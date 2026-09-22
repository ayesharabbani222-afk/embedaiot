import { query } from '../../config/db.js'

export async function getTemplates(req, res, next) {
  try {
    let sql = `
      SELECT t.*, o.name as org_name,
             COUNT(DISTINCT s.id) AS slave_count,
             COUNT(DISTINCT v.id) AS variable_count,
             COUNT(DISTINCT d.id) AS device_count
      FROM device_templates t
      LEFT JOIN organizations o ON t.org_id = o.id
      LEFT JOIN template_slaves s ON s.template_id = t.id
      LEFT JOIN slave_variables v ON v.slave_id = s.id
      LEFT JOIN devices d ON d.template_id = t.id
    `
    const params = []
    if (req.user.role !== 'admin') {
      sql += ` WHERE t.org_id IS NULL OR t.org_id = $1`
      params.push(req.user.org_id)
    }
    sql += ` GROUP BY t.id, o.name ORDER BY t.id DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

export async function getTemplateDetail(req, res, next) {
  try {
    const { id } = req.params
    const tRes = await query(
      `SELECT t.*, o.name as org_name FROM device_templates t LEFT JOIN organizations o ON t.org_id = o.id WHERE t.id = $1`,
      [id]
    )
    if (!tRes.rows.length) return res.status(404).json({ error: 'Template not found.' })
    const template = tRes.rows[0]

    // Fetch slaves with their variables
    const slavesRes = await query(
      `SELECT * FROM template_slaves WHERE template_id = $1 ORDER BY id ASC`,
      [id]
    )
    const slaves = slavesRes.rows

    for (const s of slaves) {
      const vRes = await query(
        `SELECT * FROM slave_variables WHERE slave_id = $1 ORDER BY number ASC, id ASC`,
        [s.id]
      )
      s.variables = vRes.rows
    }

    template.slaves = slaves
    res.json(template)
  } catch (err) {
    next(err)
  }
}

export async function createTemplate(req, res, next) {
  try {
    const { name, method = 'Modbus RTU', orgId } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Template name is required.' })

    const effectiveOrgId = req.user.role === 'admin' ? (orgId || null) : req.user.org_id

    const tRes = await query(
      `INSERT INTO device_templates (org_id, name, method) VALUES ($1, $2, $3) RETURNING *`,
      [effectiveOrgId, name.trim(), method]
    )
    const template = tRes.rows[0]

    // Create a default slave
    const sRes = await query(
      `INSERT INTO template_slaves (template_id, name, protocol, is_default)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [template.id, name.toUpperCase().replace(/\s+/g, ''), method === 'Cloud Polling' ? 'Modbus TCP' : 'Modbus RTU']
    )

    template.slaves = [sRes.rows[0]]
    res.status(201).json(template)
  } catch (err) {
    next(err)
  }
}

export async function updateTemplate(req, res, next) {
  try {
    const { id } = req.params
    const { name, method } = req.body

    const result = await query(
      `UPDATE device_templates 
       SET name = COALESCE($1, name),
           method = COALESCE($2, method),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, method, id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Template not found.' })
    res.json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteTemplate(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(`DELETE FROM device_templates WHERE id = $1 RETURNING id`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Template not found.' })
    res.json({ success: true, message: `Template ${id} deleted.` })
  } catch (err) {
    next(err)
  }
}

// ── Slaves & Variables Endpoints ──
export async function addSlave(req, res, next) {
  try {
    const { templateId } = req.params
    const { name, protocol = 'Modbus RTU', isDefault = false } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Slave name is required.' })

    if (isDefault) {
      await query(`UPDATE template_slaves SET is_default = false WHERE template_id = $1`, [templateId])
    }

    const result = await query(
      `INSERT INTO template_slaves (template_id, name, protocol, is_default)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [templateId, name.trim(), protocol, isDefault]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

export async function saveSlaveVariables(req, res, next) {
  try {
    const { slaveId } = req.params
    const { variables = [] } = req.body

    // Delete existing variables and re-insert or upsert
    await query(`DELETE FROM slave_variables WHERE slave_id = $1`, [slaveId])

    const inserted = []
    for (let i = 0; i < variables.length; i++) {
      const v = variables[i]
      const r = await query(
        `INSERT INTO slave_variables (
           slave_id, number, name, unit, icon, identifier, variable_type,
           register_func_code, register_address, data_format, number_format,
           decimal_places_padding, storage_variable, storage_timing, read_write,
           acquisition_formula, control_formula, line_chart_color
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
        [
          slaveId, v.number || (i + 1), v.name, v.unit || '', v.icon || '', v.identifier || '',
          v.variableType || 'Directly collected variables',
          v.registerFuncCode || '3(Holding Register)', v.registerAddress || '',
          v.dataFormat || 'Unsigned Word', v.numberFormat || 'Integer',
          !!v.decimalPlacesPadding, v.storageVariable !== false, v.storageTiming !== false,
          v.readWrite || 'Read Only', v.acquisitionFormula || '', v.controlFormula || '',
          v.lineChartColor || '#F5A623'
        ]
      )
      inserted.push(r.rows[0])
    }

    res.json({ success: true, count: inserted.length, variables: inserted })
  } catch (err) {
    next(err)
  }
}
