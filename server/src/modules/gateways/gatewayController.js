import { query } from '../../config/db.js'

export async function getGateways(req, res, next) {
  try {
    let sql = `
      SELECT g.*, o.name as org_name,
             COUNT(d.id) AS device_count
      FROM gateways g
      LEFT JOIN organizations o ON g.org_id = o.id
      LEFT JOIN devices d ON d.gateway_id = g.id
    `
    const params = []
    if (req.user.role !== 'admin') {
      sql += ` WHERE g.org_id = $1`
      params.push(req.user.org_id)
    }
    sql += ` GROUP BY g.id, o.name ORDER BY g.id DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function createGateway(req, res, next) {
  try {
    const { name, serialNumber, model = 'CF-G200', orgId, status = 'Offline' } = req.body
    if (!name?.trim() || !serialNumber?.trim()) {
      return res.status(400).json({ error: 'Gateway name and serial number are required.' })
    }

    const effectiveOrgId = req.user.role === 'admin' ? orgId : req.user.org_id

    const result = await query(
      `INSERT INTO gateways (org_id, name, serial_number, model, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [effectiveOrgId, name.trim(), serialNumber.trim(), model, status]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A gateway with this serial number already exists.' })
    }
    next(err)
  }
}

export async function updateGateway(req, res, next) {
  try {
    const { id } = req.params
    const { name, serialNumber, model, status } = req.body

    const result = await query(
      `UPDATE gateways 
       SET name = COALESCE($1, name),
           serial_number = COALESCE($2, serial_number),
           model = COALESCE($3, model),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, serialNumber, model, status, id]
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Gateway not found.' })
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteGateway(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(`DELETE FROM gateways WHERE id = $1 RETURNING id`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Gateway not found.' })
    res.json({ success: true, message: `Gateway ${id} deleted.` })
  } catch (err) {
    next(err)
  }
}

export async function gatewayHeartbeat(req, res, next) {
  try {
    const { serial } = req.params
    const { ipAddress } = req.body

    const result = await query(
      `UPDATE gateways 
       SET status = 'Online',
           last_heartbeat = CURRENT_TIMESTAMP,
           ip_address = COALESCE($1, ip_address)
       WHERE serial_number = $2
       RETURNING *`,
      [ipAddress, serial]
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Gateway not registered.' })
    res.json({ success: true, gateway: result.rows[0] })
  } catch (err) {
    next(err)
  }
}
