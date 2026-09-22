import { query } from '../../config/db.js'

export async function getHistoricalTelemetry(req, res, next) {
  try {
    const { deviceId, variableKey, dateFrom, dateTo, interval = '1 hour' } = req.query

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId query parameter is required.' })
    }

    const startDate = dateFrom ? `${dateFrom} 00:00:00` : new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const endDate = dateTo ? `${dateTo} 23:59:59` : new Date().toISOString()

    let sql = `
      SELECT time, variable_key, scaled_value, raw_value
      FROM telemetry_data
      WHERE device_id = $1 
        AND time >= $2 
        AND time <= $3
    `
    const params = [deviceId, startDate, endDate]

    if (variableKey) {
      params.push(variableKey)
      sql += ` AND variable_key = $${params.length}`
    }

    sql += ` ORDER BY time ASC LIMIT 1000`

    const result = await query(sql, params)

    // Format for Recharts consumption
    const rows = result.rows.map(r => ({
      time: new Date(r.time).toISOString().substring(11, 16), // 'HH:mm'
      fullTime: new Date(r.time).toISOString().replace('T', ' ').substring(0, 19),
      variable: r.variable_key,
      value: r.scaled_value,
    }))

    res.json(rows)
  } catch (err) {
    next(err)
  }
}

export async function getLatestTelemetry(req, res, next) {
  try {
    const { deviceId } = req.params

    const sql = `
      SELECT DISTINCT ON (variable_key)
             variable_key, scaled_value, raw_value, time, quality
      FROM telemetry_data
      WHERE device_id = $1 AND variable_key IS NOT NULL
      ORDER BY variable_key, time DESC
    `
    const result = await query(sql, [deviceId])

    const readings = {}
    result.rows.forEach(r => {
      readings[r.variable_key] = r.scaled_value
    })

    res.json({ deviceId, readings, raw: result.rows })
  } catch (err) {
    next(err)
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const orgId = req.user.role === 'admin' ? (req.query.orgId || null) : req.user.org_id

    let devSql = `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Online' THEN 1 ELSE 0 END) as online FROM devices`
    let alarmSql = `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Triggered' THEN 1 ELSE 0 END) as active FROM alarm_events`
    let gwSql = `SELECT COUNT(*) as total FROM gateways`
    let orgSql = `SELECT COUNT(*) as total FROM organizations`
    let userSql = `SELECT COUNT(*) as total FROM users`
    let typeSql = `SELECT device_type, COUNT(*) as count FROM devices`

    const params = []
    if (orgId) {
      params.push(orgId)
      devSql += ` WHERE org_id = $1`
      alarmSql += ` WHERE org_id = $1`
      gwSql += ` WHERE org_id = $1`
      userSql += ` WHERE org_id = $1`
      typeSql += ` WHERE org_id = $1`
    }
    typeSql += ` GROUP BY device_type`

    const [devRes, alarmRes, gwRes, orgRes, userRes, typeRes] = await Promise.all([
      query(devSql, params),
      query(alarmSql, params),
      query(gwSql, params),
      query(orgSql),
      query(userSql, params),
      query(typeSql, params),
    ])

    const byType = { ems: 0, soil: 0, aqms: 0, weatherstation: 0 }
    typeRes.rows.forEach(r => {
      if (r.device_type) byType[r.device_type] = parseInt(r.count, 10)
    })

    res.json({
      totalDevices: parseInt(devRes.rows[0]?.total || 0, 10),
      onlineDevices: parseInt(devRes.rows[0]?.online || 0, 10),
      offlineDevices: parseInt(devRes.rows[0]?.total || 0, 10) - parseInt(devRes.rows[0]?.online || 0, 10),
      totalAlarms: parseInt(alarmRes.rows[0]?.total || 0, 10),
      activeAlarms: parseInt(alarmRes.rows[0]?.active || 0, 10),
      totalGateways: parseInt(gwRes.rows[0]?.total || 0, 10),
      totalOrgs: parseInt(orgRes.rows[0]?.total || 0, 10),
      totalUsers: parseInt(userRes.rows[0]?.total || 0, 10),
      monthlyEnergy: '12,450 kWh',
      devicesByType: byType,
    })
  } catch (err) {
    next(err)
  }
}

export async function ingestTelemetry(req, res, next) {
  try {
    const { deviceId, variableId, variableKey, rawValue, scaledValue } = req.body
    if (!deviceId || scaledValue === undefined) {
      return res.status(400).json({ error: 'deviceId and scaledValue are required.' })
    }

    const result = await query(
      `INSERT INTO telemetry_data (time, device_id, variable_id, variable_key, raw_value, scaled_value)
       VALUES (CURRENT_TIMESTAMP, $1, $2, $3, $4, $5)
       RETURNING *`,
      [deviceId, variableId || null, variableKey || null, rawValue || null, scaledValue]
    )

    res.status(201).json({ success: true, point: result.rows[0] })
  } catch (err) {
    next(err)
  }
}
