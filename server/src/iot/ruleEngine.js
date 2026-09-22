import { query } from '../config/db.js'
import { broadcastAlarm, broadcastDeviceStatus } from '../websocket/socketServer.js'

export async function evaluateTelemetryRules(deviceId, variableKey, scaledValue) {
  try {
    // 1. Fetch active rules for this device
    const rulesRes = await query(
      `SELECT r.*, d.org_id, d.name as device_name 
       FROM alarm_rules r 
       JOIN devices d ON r.device_id = d.id 
       WHERE r.device_id = $1 AND r.status = 'Active'`,
      [deviceId]
    )

    for (const rule of rulesRes.rows) {
      let triggered = false
      const op = rule.condition_operator
      const threshold = rule.threshold_value

      if (op === '>' && scaledValue > threshold) triggered = true
      else if (op === '<' && scaledValue < threshold) triggered = true
      else if (op === '>=' && scaledValue >= threshold) triggered = true
      else if (op === '<=' && scaledValue <= threshold) triggered = true
      else if (op === '==' && Math.abs(scaledValue - threshold) < 0.001) triggered = true

      if (triggered) {
        // Prevent duplicate alerts in the last 5 minutes
        const existingRes = await query(
          `SELECT id FROM alarm_events 
           WHERE rule_id = $1 AND status = 'Triggered' AND triggered_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'`,
          [rule.id]
        )

        if (!existingRes.rows.length) {
          const description = `${rule.name}: ${variableKey} is ${scaledValue} (Threshold ${op} ${threshold})`
          const eventRes = await query(
            `INSERT INTO alarm_events (org_id, rule_id, device_id, trigger_name, description, trigger_value, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'Triggered')
             RETURNING *`,
            [rule.org_id, rule.id, deviceId, rule.name, description, scaledValue]
          )

          const event = { ...eventRes.rows[0], deviceName: rule.device_name }
          console.warn(`[Alarm Engine] Triggered: ${rule.name} on ${rule.device_name} (Value: ${scaledValue})`)
          broadcastAlarm(rule.org_id, event)
        }
      }
    }

    // 2. Evaluate Linkage Records (SCADA Automation)
    const linkageRes = await query(
      `SELECT * FROM linkage_records WHERE source_device_id = $1 AND status = 'Active'`,
      [deviceId]
    )

    for (const linkage of linkageRes.rows) {
      const cond = linkage.trigger_condition || {}
      if (cond.variable === variableKey) {
        let conditionMet = false
        if (cond.op === '>' && scaledValue > cond.value) conditionMet = true
        if (cond.op === '<' && scaledValue < cond.value) conditionMet = true

        if (conditionMet && linkage.target_device_id) {
          const action = linkage.target_action || {}
          if (action.command === 'switchOff') {
            await query(`UPDATE devices SET switch_on = false WHERE id = $1`, [linkage.target_device_id])
            broadcastDeviceStatus(linkage.target_device_id, { switchOn: false })
            console.log(`[Linkage Engine] Action executed: Switched OFF device ${linkage.target_device_id}`)
          }
        }
      }
    }
  } catch (err) {
    console.error('[Rule Engine Error]', err.message)
  }
}
