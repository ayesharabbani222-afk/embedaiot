import { query } from '../../config/db.js'

// ── Alarm Contacts ──
export async function getAlarmContacts(req, res, next) {
  try {
    const orgId = req.user.role === 'admin' ? (req.query.orgId || null) : req.user.org_id
    let sql = `SELECT c.*, o.name as org_name FROM alarm_contacts c LEFT JOIN organizations o ON c.org_id = o.id`
    const params = []
    if (orgId) {
      sql += ` WHERE c.org_id = $1`
      params.push(orgId)
    }
    sql += ` ORDER BY c.id DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function createAlarmContact(req, res, next) {
  try {
    const { name, phone, email, whatsapp, remark, orgId } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Contact name is required.' })

    const effectiveOrgId = req.user.role === 'admin' ? orgId : req.user.org_id

    const result = await query(
      `INSERT INTO alarm_contacts (org_id, name, phone, email, whatsapp, remark)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [effectiveOrgId, name.trim(), phone, email, whatsapp, remark]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function updateAlarmContact(req, res, next) {
  try {
    const { id } = req.params
    const { name, phone, email, whatsapp, remark } = req.body

    const result = await query(
      `UPDATE alarm_contacts 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           whatsapp = COALESCE($4, whatsapp),
           remark = COALESCE($5, remark),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, phone, email, whatsapp, remark, id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Contact not found.' })
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteAlarmContact(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(`DELETE FROM alarm_contacts WHERE id = $1 RETURNING id`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Contact not found.' })
    res.json({ success: true, message: `Contact ${id} deleted.` })
  } catch (err) {
    next(err)
  }
}

// ── Alarm Rules / Triggers ──
export async function getAlarmRules(req, res, next) {
  try {
    const orgId = req.user.role === 'admin' ? (req.query.orgId || null) : req.user.org_id
    let sql = `
      SELECT r.*, o.name as org_name, d.name as device_name, v.name as variable_name
      FROM alarm_rules r
      LEFT JOIN organizations o ON r.org_id = o.id
      LEFT JOIN devices d ON r.device_id = d.id
      LEFT JOIN slave_variables v ON r.variable_id = v.id
    `
    const params = []
    if (orgId) {
      sql += ` WHERE r.org_id = $1`
      params.push(orgId)
    }
    sql += ` ORDER BY r.id DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function createAlarmRule(req, res, next) {
  try {
    const { name, deviceId, variableId, pushType, pushMethod, mechanism, conditionOperator, thresholdValue, orgId } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Rule name is required.' })

    const effectiveOrgId = req.user.role === 'admin' ? orgId : req.user.org_id

    const result = await query(
      `INSERT INTO alarm_rules (org_id, name, device_id, variable_id, push_type, push_method, mechanism, condition_operator, threshold_value, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active') RETURNING *`,
      [effectiveOrgId, name.trim(), deviceId, variableId, pushType || 'Template Trigger', pushMethod || 'Email', mechanism || 'Instant', conditionOperator || '>', thresholdValue || 0]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

// ── Historical Alarm Events / Notifications ──
export async function getAlarmEvents(req, res, next) {
  try {
    const orgId = req.user.role === 'admin' ? (req.query.orgId || null) : req.user.org_id
    const status = req.query.status // 'Triggered', 'Resolved', etc.
    let sql = `
      SELECT e.*, d.name as device_name, o.name as org_name
      FROM alarm_events e
      LEFT JOIN devices d ON e.device_id = d.id
      LEFT JOIN organizations o ON e.org_id = o.id
    `
    const conditions = []
    const params = []

    if (orgId) {
      params.push(orgId)
      conditions.push(`e.org_id = $${params.length}`)
    }
    if (status) {
      params.push(status)
      conditions.push(`e.status = $${params.length}`)
    }

    if (conditions.length) {
      sql += ` WHERE ` + conditions.join(' AND ')
    }
    sql += ` ORDER BY e.triggered_at DESC LIMIT 100`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function resolveAlarmEvent(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(
      `UPDATE alarm_events SET status = 'Resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Alarm event not found.' })
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
}
