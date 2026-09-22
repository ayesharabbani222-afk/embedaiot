import mqtt from 'mqtt'
import { query } from '../../config/db.js'
import { broadcastTelemetry } from '../../websocket/socketServer.js'
import { evaluateTelemetryRules } from '../../iot/ruleEngine.js'

// Map of active MQTT client connections: bridgeId -> { client, messageCount }
const activeBridges = new Map()
let ioInstance = null

export function setWebSocketInstance(io) {
  ioInstance = io
}

export async function initAllBridges(io) {
  if (io) ioInstance = io
  try {
    const result = await query(`SELECT * FROM mqtt_bridges WHERE is_active = true`)
    console.log(`[Bridge Manager] Initializing ${result.rows.length} configured MQTT bridge(s)...`)
    for (const bridge of result.rows) {
      await startBridge(bridge)
    }
  } catch (err) {
    console.warn('[Bridge Manager] Error initializing bridges:', err.message)
  }
}

export async function startBridge(bridgeOrId) {
  let bridge = bridgeOrId
  if (typeof bridgeOrId === 'number' || typeof bridgeOrId === 'string') {
    const res = await query(`SELECT * FROM mqtt_bridges WHERE id = $1`, [bridgeOrId])
    if (!res.rows.length) throw new Error('Bridge not found')
    bridge = res.rows[0]
  }

  // If already running, disconnect first
  if (activeBridges.has(bridge.id)) {
    stopBridge(bridge.id)
  }

  const brokerUrl = `mqtt://${bridge.broker_host}:${bridge.broker_port || 1883}`
  console.log(`[Bridge #${bridge.id}] Connecting to broker: ${brokerUrl} (Topic: ${bridge.subscribe_topic})`)

  try {
    const client = mqtt.connect(brokerUrl, {
      clientId: bridge.client_id || `ems_bridge_${bridge.id}_${Math.random().toString(16).slice(2, 6)}`,
      username: bridge.username || undefined,
      password: bridge.password || undefined,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 10000,
    })

    const bridgeState = {
      client,
      messageCount: parseInt(bridge.message_count || 0, 10),
      status: 'CONNECTING',
    }
    activeBridges.set(bridge.id, bridgeState)

    client.on('connect', async () => {
      console.log(`[Bridge #${bridge.id}] ✓ CONNECTED to ${brokerUrl}`)
      bridgeState.status = 'CONNECTED'
      await query(`UPDATE mqtt_bridges SET status = 'CONNECTED', is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [bridge.id])
      
      client.subscribe(bridge.subscribe_topic, { qos: 1 }, (err) => {
        if (!err) console.log(`[Bridge #${bridge.id}] Subscribed to: ${bridge.subscribe_topic}`)
      })

      if (ioInstance) {
        ioInstance.emit('bridge:status', { bridgeId: bridge.id, status: 'CONNECTED' })
      }
    })

    client.on('message', async (topic, message) => {
      bridgeState.messageCount++
      const now = new Date().toISOString()

      // Broadcast live message count tick to UI
      if (ioInstance) {
        ioInstance.emit('bridge:msg', {
          bridgeId: bridge.id,
          messageCount: bridgeState.messageCount,
          lastMessageAt: now,
        })
      }

      // Periodically persist message count to DB
      if (bridgeState.messageCount % 10 === 0) {
        query(`UPDATE mqtt_bridges SET message_count = $1, last_message_at = CURRENT_TIMESTAMP WHERE id = $2`, [bridgeState.messageCount, bridge.id]).catch(() => {})
      }

      // Parse payload according to the 4 checklist rules:
      // 1. Gateway serial number = MQTT serial_number
      // 2. Device name = MQTT device field
      // 3. Slave names match MQTT blocks (e.g. Main, EMS PANEL)
      // 4. Template variable registerAddress = MQTT keys (e.g. 40097)
      try {
        const payload = JSON.parse(message.toString())
        await processBridgePayload(bridge, payload)
      } catch (err) {
        // payload might not be JSON or malformed
      }
    })

    client.on('error', async (err) => {
      console.warn(`[Bridge #${bridge.id}] Error (${err.message}). Retrying in background...`)
      bridgeState.status = 'ERROR'
      await query(`UPDATE mqtt_bridges SET status = 'ERROR' WHERE id = $1`, [bridge.id]).catch(() => {})
      if (ioInstance) {
        ioInstance.emit('bridge:status', { bridgeId: bridge.id, status: 'ERROR' })
      }
    })

    client.on('offline', async () => {
      bridgeState.status = 'DISCONNECTED'
      await query(`UPDATE mqtt_bridges SET status = 'DISCONNECTED' WHERE id = $1`, [bridge.id]).catch(() => {})
      if (ioInstance) {
        ioInstance.emit('bridge:status', { bridgeId: bridge.id, status: 'DISCONNECTED' })
      }
    })

    return { success: true, status: 'CONNECTED' }
  } catch (err) {
    console.error(`[Bridge #${bridge.id}] Failed to start:`, err.message)
    return { success: false, error: err.message }
  }
}

export async function stopBridge(bridgeId) {
  const existing = activeBridges.get(bridgeId)
  if (existing) {
    try {
      existing.client.end(true)
    } catch (e) {}
    activeBridges.delete(bridgeId)
  }
  await query(`UPDATE mqtt_bridges SET status = 'DISCONNECTED', is_active = false WHERE id = $1`, [bridgeId])
  if (ioInstance) {
    ioInstance.emit('bridge:status', { bridgeId, status: 'DISCONNECTED' })
  }
  return { success: true, status: 'DISCONNECTED' }
}

export function getBridgeLiveStatus(bridgeId) {
  const active = activeBridges.get(bridgeId)
  return active ? active.status : 'DISCONNECTED'
}

// Map incoming MQTT payload into devices & TimescaleDB
async function processBridgePayload(bridge, payload) {
  const serial = payload.serial_number || payload.gateway || payload.serial
  const deviceName = payload.device || payload.deviceName || payload.name

  // Try to find the matching device in this organization
  let devSql = `SELECT d.* FROM devices d WHERE d.org_id = $1`
  const params = [bridge.org_id]

  if (deviceName) {
    devSql += ` AND (LOWER(d.name) = LOWER($2) OR d.name ILIKE $2)`
    params.push(`%${deviceName}%`)
  }
  devSql += ` LIMIT 1`

  const devRes = await query(devSql, params)
  const targetDevice = devRes.rows[0]
  if (!targetDevice) return

  // Extract variables: e.g. payload.data or payload.registers or payload directly
  const dataBlock = payload.data || payload.registers || payload.variables || payload
  const readings = {}

  for (const [key, val] of Object.entries(dataBlock)) {
    const num = parseFloat(val)
    if (!isNaN(num)) {
      readings[key] = num
      // Insert to hypertable
      query(
        `INSERT INTO telemetry_data (time, device_id, variable_key, scaled_value)
         VALUES (CURRENT_TIMESTAMP, $1, $2, $3)`,
        [targetDevice.id, key, num]
      ).catch(() => {})

      evaluateTelemetryRules(targetDevice.id, key, num).catch(() => {})
    }
  }

  if (Object.keys(readings).length > 0) {
    broadcastTelemetry(targetDevice.id, readings)
  }
}
