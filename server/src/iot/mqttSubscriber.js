import mqtt from 'mqtt'
import { query } from '../config/db.js'
import { broadcastTelemetry } from '../websocket/socketServer.js'
import { evaluateTelemetryRules } from './ruleEngine.js'

let client = null

export function initMqttSubscriber() {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'
  console.log(`[MQTT] Attempting connection to: ${brokerUrl}`)

  try {
    client = mqtt.connect(brokerUrl, {
      clientId: process.env.MQTT_CLIENT_ID || `embed_sub_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 10000,
    })

    client.on('connect', () => {
      console.log('[MQTT] Successfully connected to MQTT Broker!')
      // Subscribe to all gateway telemetry topics
      client.subscribe('ems/gateways/+/telemetry', { qos: 1 }, (err) => {
        if (!err) console.log('[MQTT] Subscribed to topic: ems/gateways/+/telemetry')
      })
      client.subscribe('embed/devices/+/data', { qos: 1 })
    })

    client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString())
        await processIncomingTelemetry(topic, payload)
      } catch (err) {
        console.error('[MQTT Error] Failed to parse message:', err.message)
      }
    })

    client.on('error', (err) => {
      console.warn(`[MQTT Notice] Broker not connected (${err.message}). Ingestion will retry.`)
    })
  } catch (err) {
    console.warn('[MQTT Notice] MQTT connection setup:', err.message)
  }

  return client
}

export async function processIncomingTelemetry(topic, payload) {
  // Supports format: { deviceId: 2, variables: { voltageA: 228.4, currentA: 14.2, power: 8500 } }
  // or gateway format: { gateway: 'SN-10021', devices: [{ id: 2, readings: { ... } }] }
  const deviceList = payload.devices || [payload]

  for (const item of deviceList) {
    const deviceId = item.deviceId || item.id
    const readings = item.variables || item.readings || {}
    if (!deviceId) continue

    for (const [key, val] of Object.entries(readings)) {
      const numVal = parseFloat(val)
      if (isNaN(numVal)) continue

      // 1. Insert into telemetry hypertable
      try {
        await query(
          `INSERT INTO telemetry_data (time, device_id, variable_key, scaled_value)
           VALUES (CURRENT_TIMESTAMP, $1, $2, $3)`,
          [deviceId, key, numVal]
        )
      } catch (e) {
        // Table might be initializing or duplicate
      }

      // 2. Evaluate rule engine for alarms
      evaluateTelemetryRules(deviceId, key, numVal)
    }

    // 3. Push real-time update to web clients
    broadcastTelemetry(deviceId, readings)
  }
}
