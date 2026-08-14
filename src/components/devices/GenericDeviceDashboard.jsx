import { useMemo, useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../ui/StatCard'
import { useAuth } from '../../context/AuthContext'
import { devices as dummyDevices, users, historicalData } from '../../data/dummy'
import { getDeviceType } from '../../data/deviceTypes'
import { Wifi, WifiOff, Cpu } from 'lucide-react'

// Deterministic pseudo-random reading generator so values look "live" and
// stay stable within a metric's plausible range, without a real backend.
function seedNum(str = '') {
  return String(str).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

const METRIC_RANGES = {
  aqi:         [20, 180],
  pm25:        [5, 120],
  pm10:        [10, 180],
  co2:         [380, 1200],
  temperature: [18, 34],
  humidity:    [30, 80],
  moisture:    [15, 65],
  soilTemp:    [16, 30],
  conductivity:[0.4, 2.8],
  ph:          [5.5, 7.8],
  aqiOut:      [5, 45],
  pm25In:      [30, 150],
  pm25Out:     [2, 25],
  fanSpeed:    [20, 100],
  filterLife:  [10, 100],
  status:      [0, 1],
  reading1:    [0, 100],
}

function getReading(deviceName, metricKey, isOffline, tick) {
  const [min, max] = METRIC_RANGES[metricKey] || [0, 100]
  if (isOffline) return metricKey === 'ph' ? '—' : (0).toFixed(1)
  const seed = seedNum(deviceName) + tick * 5.7
  const rand = (Math.sin(seed) + 1) / 2
  const val = min + rand * (max - min)
  return metricKey === 'ph' || metricKey === 'conductivity' ? val.toFixed(2) : val.toFixed(1)
}

function buildTrendSeries(seedStr, min, max) {
  const seed = seedNum(seedStr)
  return historicalData.map((row, i) => {
    const hour = i * 2
    const wave = 0.5 + 0.5 * Math.sin(((hour - 6) / 12) * Math.PI + (seed % 6))
    return { time: row.time, value: +(min + wave * (max - min)).toFixed(2) }
  })
}

export default function GenericDeviceDashboard({ deviceTypeId, scope }) {
  const { user } = useAuth()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(interval)
  }, [])

  const deviceType = getDeviceType(deviceTypeId)

  // Resolve the org name in scope: org role logs in as the org itself;
  // user role's org is looked up from their user record (mirrors how
  // AuthContext resolves device types).
  const orgName = useMemo(() => {
    if (scope === 'org') return user?.name
    if (scope === 'user') {
      let userList = users
      try {
        const saved = localStorage.getItem('cf-ems-users')
        if (saved) userList = JSON.parse(saved)
      } catch { /* ignore */ }
      const match = userList.find(u => u.email === user?.email)
      return match?.org || null
    }
    return null
  }, [scope, user])

  const orgDevices = useMemo(() => {
    let deviceList = dummyDevices
    try {
      const saved = localStorage.getItem('cf-ems-devices')
      if (saved) deviceList = JSON.parse(saved)
    } catch { /* ignore */ }
    return deviceList.filter(d => d.org === orgName && d.deviceType === deviceTypeId)
  }, [orgName, deviceTypeId])

  if (!deviceType) return null

  const metrics = deviceType.metrics || []
  const onlineCount = orgDevices.filter(d => d.status === 'Online').length
  const primaryMetric = metrics[0]
  const trendSeries = primaryMetric
    ? buildTrendSeries(`${orgName}-${primaryMetric.key}`, ...(METRIC_RANGES[primaryMetric.key] || [0, 100]))
    : []

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">{deviceType.name}</h2>
          <p className="breadcrumb">{deviceType.fullName || deviceType.name}</p>
        </div>
      </div>

      {deviceType.provisional && (
        <div className="card p-4 border-dashed border-2 border-surface-300 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/50">
          <p className="text-xs text-surface-500">
            This device category is registered for your organization, but its specific parameters haven't been finalized yet.
            The dashboard structure below is ready — real metrics will populate automatically once defined.
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Devices Online"
          value={`${onlineCount}/${orgDevices.length}`}
          icon={onlineCount > 0 ? Wifi : WifiOff}
          color={onlineCount > 0 ? 'success' : 'neutral'}
          sparkline={false}
        />
        {metrics.slice(0, 3).map(m => (
          <StatCard
            key={m.key}
            label={m.label}
            value={orgDevices.length ? `${getReading(orgDevices[0]?.name || orgName, m.key, orgDevices[0]?.status === 'Offline', tick)}${m.unit ? ' ' + m.unit : ''}` : '—'}
            icon={m.icon}
            color={m.color}
          />
        ))}
      </div>

      {/* Trend chart */}
      {primaryMetric && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">{primaryMetric.label} — 24h Trend</h3>
              <p className="text-xs text-surface-500">Org-wide average across all {deviceType.shortName} devices</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendSeries}>
                <defs>
                  <linearGradient id="genericMetricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-150 dark:stroke-surface-800" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#genericMetricGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Device list */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-4">
          {deviceType.shortName} Devices {orgName ? `— ${orgName}` : ''}
        </h3>
        {orgDevices.length === 0 ? (
          <div className="text-center py-10">
            <Cpu size={24} className="text-surface-300 mx-auto mb-2" />
            <p className="text-xs text-surface-500">No {deviceType.shortName} devices linked yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-surface-500 border-b border-surface-150 dark:border-surface-800">
                  <th className="py-2 pr-4 font-bold uppercase tracking-wide">Device</th>
                  <th className="py-2 pr-4 font-bold uppercase tracking-wide">Status</th>
                  <th className="py-2 pr-4 font-bold uppercase tracking-wide">Gateway</th>
                  {metrics.slice(0, 3).map(m => (
                    <th key={m.key} className="py-2 pr-4 font-bold uppercase tracking-wide">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgDevices.map(d => (
                  <tr key={d.id} className="border-b border-surface-100 dark:border-surface-900 last:border-0">
                    <td className="py-2.5 pr-4 font-semibold text-surface-800 dark:text-surface-100">{d.name}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge ${d.status === 'Online' ? 'badge-success' : 'badge-neutral'}`}>{d.status}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-surface-500">{d.gateway}</td>
                    {metrics.slice(0, 3).map(m => (
                      <td key={m.key} className="py-2.5 pr-4 text-surface-700 dark:text-surface-300">
                        {getReading(d.name, m.key, d.status === 'Offline', tick)}{m.unit ? ` ${m.unit}` : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
