import { query } from '../../config/db.js'

export async function getOrganizations(req, res, next) {
  try {
    let sql = `
      SELECT o.*, 
             COUNT(DISTINCT d.id) AS device_count,
             COUNT(DISTINCT u.id) AS user_count,
             COUNT(DISTINCT g.id) AS gateway_count
      FROM organizations o
      LEFT JOIN devices d ON d.org_id = o.id
      LEFT JOIN users u ON u.org_id = o.id
      LEFT JOIN gateways g ON g.org_id = o.id
    `
    const params = []
    if (req.user.role !== 'admin') {
      sql += ` WHERE o.id = $1`
      params.push(req.user.org_id)
    }
    sql += ` GROUP BY o.id ORDER BY o.id DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function getOrganizationById(req, res, next) {
  try {
    const { id } = req.params
    if (req.user.role !== 'admin' && String(req.user.org_id) !== String(id)) {
      return res.status(403).json({ error: 'Access forbidden to other organizations.' })
    }

    const result = await query(`SELECT * FROM organizations WHERE id = $1`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Organization not found.' })
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function createOrganization(req, res, next) {
  try {
    const { name, description, status = 'Active', deviceTypes = ['ems'] } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Organization name is required.' })

    const result = await query(
      `INSERT INTO organizations (name, description, status, device_types)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING *`,
      [name.trim(), description || '', status, JSON.stringify(deviceTypes)]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An organization with this name already exists.' })
    }
    next(err)
  }
}

export async function updateOrganization(req, res, next) {
  try {
    const { id } = req.params
    const { name, description, status, deviceTypes } = req.body

    const result = await query(
      `UPDATE organizations 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           device_types = COALESCE($4::jsonb, device_types),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, description, status, deviceTypes ? JSON.stringify(deviceTypes) : null, id]
    )

    if (!result.rows.length) return res.status(404).json({ error: 'Organization not found.' })
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteOrganization(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(`DELETE FROM organizations WHERE id = $1 RETURNING id`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Organization not found.' })
    res.json({ success: true, message: `Organization ${id} deleted.` })
  } catch (err) {
    next(err)
  }
}
