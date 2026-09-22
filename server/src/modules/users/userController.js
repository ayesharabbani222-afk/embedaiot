import bcrypt from 'bcryptjs'
import { query } from '../../config/db.js'

export async function getUsers(req, res, next) {
  try {
    let sql = `
      SELECT u.id, u.org_id, u.name, u.email, u.phone, u.role, u.status, 
             u.device_types, u.created_at, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
    `
    const params = []
    if (req.user.role !== 'admin') {
      sql += ` WHERE u.org_id = $1`
      params.push(req.user.org_id)
    }
    sql += ` ORDER BY u.id DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, phone, role = 'user', orgId, deviceTypes = ['ems'], password = 'password123' } = req.body
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Name and email are required.' })
    }

    const effectiveOrgId = req.user.role === 'admin' ? orgId : req.user.org_id
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const result = await query(
      `INSERT INTO users (org_id, name, email, phone, role, password_hash, device_types, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'Active')
       RETURNING id, org_id, name, email, phone, role, status, device_types, created_at`,
      [effectiveOrgId, name.trim(), email.trim(), phone, role, passwordHash, JSON.stringify(deviceTypes)]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A user with this email already exists.' })
    }
    next(err)
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params
    const { name, email, phone, role, status, deviceTypes, password } = req.body

    let passwordHash = null
    if (password) {
      const salt = await bcrypt.genSalt(10)
      passwordHash = await bcrypt.hash(password, salt)
    }

    const result = await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           role = COALESCE($4, role),
           status = COALESCE($5, status),
           device_types = COALESCE($6::jsonb, device_types),
           password_hash = COALESCE($7, password_hash),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, org_id, name, email, phone, role, status, device_types, updated_at`,
      [name, email, phone, role, status, deviceTypes ? JSON.stringify(deviceTypes) : null, passwordHash, id]
    )

    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' })
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' })
    res.json({ success: true, message: `User ${id} deleted.` })
  } catch (err) {
    next(err)
  }
}
