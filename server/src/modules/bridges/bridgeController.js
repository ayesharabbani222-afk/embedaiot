import { query } from '../../config/db.js'
import { startBridge, stopBridge } from './bridgeManager.js'

export async function getBridges(req, res, next) {
  try {
    const orgId = req.user.role === 'admin' ? (req.query.orgId || null) : req.user.org_id

    let sql = `
      SELECT b.*, o.name as org_name
      FROM mqtt_bridges b
      LEFT JOIN organizations o ON b.org_id = o.id
    `
    const params = []
    if (orgId) {
      sql += ` WHERE b.org_id = $1`
      params.push(orgId)
    }
    sql += ` ORDER BY b.id ASC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function createBridge(req, res, next) {
  try {
    const { name = 'MQTT Bridge', orgId, brokerHost = '51.38.88.130', brokerPort = 1883, subscribeTopic = '/UploadTopic', commandTopic = '/DownTopic', clientId, username, password } = req.body
    if (!brokerHost?.trim() || !subscribeTopic?.trim()) {
      return res.status(400).json({ error: 'Broker host and subscribe topic are required.' })
    }

    const effectiveOrgId = req.user.role === 'admin' ? (orgId || 1) : req.user.org_id

    const result = await query(
      `INSERT INTO mqtt_bridges (name, org_id, broker_host, broker_port, subscribe_topic, command_topic, client_id, username, password, status, is_active, message_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'CONNECTED', true, 0)
       RETURNING *`,
      [name.trim(), effectiveOrgId, brokerHost.trim(), brokerPort || 1883, subscribeTopic.trim(), commandTopic || '/DownTopic', clientId || null, username || null, password || null]
    )

    const bridge = result.rows[0]
    // Start the MQTT client in background
    startBridge(bridge).catch(() => {})

    res.status(201).json(bridge)
  } catch (err) {
    next(err)
  }
}

export async function updateBridge(req, res, next) {
  try {
    const { id } = req.params
    const { name, orgId, brokerHost, brokerPort, subscribeTopic, commandTopic, clientId, username, password } = req.body

    const result = await query(
      `UPDATE mqtt_bridges 
       SET name = COALESCE($1, name),
           org_id = COALESCE($2, org_id),
           broker_host = COALESCE($3, broker_host),
           broker_port = COALESCE($4, broker_port),
           subscribe_topic = COALESCE($5, subscribe_topic),
           command_topic = COALESCE($6, command_topic),
           client_id = COALESCE($7, client_id),
           username = COALESCE($8, username),
           password = COALESCE($9, password),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, orgId, brokerHost, brokerPort, subscribeTopic, commandTopic, clientId, username, password, id]
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Bridge not found' })
    const updated = result.rows[0]

    // Restart client if active
    if (updated.is_active) {
      startBridge(updated).catch(() => {})
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function deleteBridge(req, res, next) {
  try {
    const { id } = req.params
    await stopBridge(parseInt(id, 10)).catch(() => {})
    const result = await query(`DELETE FROM mqtt_bridges WHERE id = $1 RETURNING id`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Bridge not found' })
    res.json({ success: true, message: `Bridge ${id} deleted.` })
  } catch (err) {
    next(err)
  }
}

export async function toggleBridge(req, res, next) {
  try {
    const { id } = req.params
    const bridgeId = parseInt(id, 10)

    const cur = await query(`SELECT * FROM mqtt_bridges WHERE id = $1`, [bridgeId])
    if (!cur.rows.length) return res.status(404).json({ error: 'Bridge not found' })
    const bridge = cur.rows[0]

    let nextStatus
    if (bridge.is_active) {
      await stopBridge(bridgeId)
      nextStatus = 'DISCONNECTED'
    } else {
      await startBridge(bridge)
      nextStatus = 'CONNECTED'
    }

    res.json({ success: true, bridgeId, status: nextStatus, isActive: nextStatus === 'CONNECTED' })
  } catch (err) {
    next(err)
  }
}
