import { query } from '../../config/db.js'
import { broadcastDeviceStatus } from '../../websocket/socketServer.js'

export async function getDevices(req, res, next) {
  try {
    let sql = `
      SELECT d.*, 
             o.name as org_name,
             g.name as gateway_name, g.serial_number as gateway_serial,
             t.name as template_name, t.method as template_method
      FROM devices d
      LEFT JOIN organizations o ON d.org_id = o.id
      LEFT JOIN gateways g ON d.gateway_id = g.id
      LEFT JOIN device_templates t ON d.template_id = t.id
    `
    const params = []
    if (req.user.role !== 'admin') {
      sql += ` WHERE d.org_id = $1`
      params.push(req.user.org_id)
    }
    sql += ` ORDER BY d.id DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function getDeviceById(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(
      `SELECT d.*, o.name as org_name, g.name as gateway_name, g.serial_number as gateway_serial,
              t.name as template_name, t.method as template_method
       FROM devices d
       LEFT JOIN organizations o ON d.org_id = o.id
       LEFT JOIN gateways g ON d.gateway_id = g.id
       LEFT JOIN device_templates t ON d.template_id = t.id
       WHERE d.id = $1`,
      [id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Device not found.' })
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function createDevice(req, res, next) {
  try {
    const { name, orgId, gatewayId, templateId, deviceType = 'ems', switchOn = true, status = 'Online' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Device name is required.' })

    const effectiveOrgId = req.user.role === 'admin' ? orgId : req.user.org_id

    const result = await query(
      `INSERT INTO devices (org_id, gateway_id, template_id, name, device_type, switch_on, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [effectiveOrgId, gatewayId || null, templateId || null, name.trim(), deviceType, switchOn, status]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function updateDevice(req, res, next) {
  try {
    const { id } = req.params
    const { name, gatewayId, templateId, deviceType, status, switchOn } = req.body

    const result = await query(
      `UPDATE devices 
       SET name = COALESCE($1, name),
           gateway_id = COALESCE($2, gateway_id),
           template_id = COALESCE($3, template_id),
           device_type = COALESCE($4, device_type),
           status = COALESCE($5, status),
           switch_on = COALESCE($6, switch_on),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, gatewayId, templateId, deviceType, status, switchOn, id]
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Device not found.' })
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteDevice(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(`DELETE FROM devices WHERE id = $1 RETURNING id`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Device not found.' })
    res.json({ success: true, message: `Device ${id} deleted.` })
  } catch (err) {
    next(err)
  }
}

export async function toggleDeviceSwitch(req, res, next) {
  try {
    const { id } = req.params
    const { switchOn } = req.body

    const result = await query(
      `UPDATE devices SET switch_on = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [switchOn, id]
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Device not found.' })
    const device = result.rows[0]

    // Broadcast switch change in real time via WebSocket
    broadcastDeviceStatus(device.id, { switchOn: device.switch_on, status: device.status })

    res.json({ success: true, device })
  } catch (err) {
    next(err)
  }
}
