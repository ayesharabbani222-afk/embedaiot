import { query } from '../../config/db.js'

export async function getDashboards(req, res, next) {
  try {
    const orgId = req.user.role === 'admin' ? (req.query.orgId || null) : req.user.org_id
    const { dashboardType } = req.query
    let sql = `SELECT * FROM custom_dashboards WHERE 1=1`
    const params = []

    if (orgId) {
      params.push(orgId)
      sql += ` AND org_id = $${params.length}`
    }
    if (dashboardType) {
      params.push(dashboardType)
      sql += ` AND dashboard_type = $${params.length}`
    }
    sql += ` ORDER BY created_at DESC`

    const result = await query(sql, params)
    const formatted = result.rows.map(r => ({
      ...r,
      dashboardType: r.dashboard_type || 'ems',
      targetDevice: r.target_device || null,
      layoutConfig: r.layout_config || [],
      isDefault: r.is_default || false,
    }))
    res.json(formatted)
  } catch (err) {
    next(err)
  }
}

export async function getDashboardById(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(`SELECT * FROM custom_dashboards WHERE id = $1`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Dashboard not found.' })
    const r = result.rows[0]
    res.json({
      ...r,
      dashboardType: r.dashboard_type || 'ems',
      targetDevice: r.target_device || null,
      layoutConfig: r.layout_config || [],
      isDefault: r.is_default || false,
    })
  } catch (err) {
    next(err)
  }
}

export async function saveDashboard(req, res, next) {
  try {
    const {
      id, title, description, layoutConfig = [], widgets = [],
      isDefault = false, orgId, dashboardType = 'ems', targetDevice = null,
    } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'Dashboard title is required.' })

    const dashboardId = id || `dash-${Date.now()}`
    const effectiveOrgId = req.user.role === 'admin' ? orgId : req.user.org_id

    const result = await query(
      `INSERT INTO custom_dashboards (id, org_id, user_id, title, description, layout_config, widgets, is_default, dashboard_type, target_device)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE 
       SET title = EXCLUDED.title,
           description = EXCLUDED.description,
           layout_config = EXCLUDED.layout_config,
           widgets = EXCLUDED.widgets,
           dashboard_type = EXCLUDED.dashboard_type,
           target_device = EXCLUDED.target_device,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        dashboardId, effectiveOrgId, req.user.id, title.trim(),
        description || '', JSON.stringify(layoutConfig), JSON.stringify(widgets),
        isDefault, dashboardType, targetDevice,
      ]
    )

    const r = result.rows[0]
    res.status(201).json({
      ...r,
      dashboardType: r.dashboard_type || 'ems',
      targetDevice: r.target_device || null,
      layoutConfig: r.layout_config || [],
      isDefault: r.is_default || false,
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteDashboard(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(`DELETE FROM custom_dashboards WHERE id = $1 RETURNING id`, [id])
    if (!result.rows.length) return res.status(404).json({ error: 'Dashboard not found.' })
    res.json({ success: true, message: `Dashboard ${id} deleted.` })
  } catch (err) {
    next(err)
  }
}
