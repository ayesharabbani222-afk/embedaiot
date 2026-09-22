import { useMemo, useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../ui/StatCard'
import { useAuth } from '../../context/AuthContext'
import { devices as dummyDevices, users, historicalData } from '../../data/dummy'
import { getDeviceType } from '../../data/deviceTypes'
import { useDeviceStream } from '../../hooks/useDeviceStream'
import {
  Wifi, WifiOff, Cpu, LineChart, Layers, Search, Wind, Droplets, Thermometer,
  Compass, CloudRain, Sun, Activity, ShieldCheck, AlertCircle, Sparkles, Filter,
} from 'lucide-react'

// Deterministic pseudo-random reading generator
function seedNum(str = '') {
  return String(str).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

const METRIC_RANGES = {
  // Soil Moisture Meter (4 variables)
  moisture:    [25, 75],    // Soil Moisture %
  soilTemp:    [16, 28],    // Soil Temperature °C
  airMoisture: [30, 80],    // Air Moisture %
  airTemp:     [18, 38],    // Air Temperature °C

  // AQMS (24 variables)
  time1:       [0, 0],
  id:          [1, 99],
  tx:          [100, 9999],
  t:           [18, 36],    // Temperature °C
  rh:          [30, 80],    // Relative Humidity %
  sk:          [0.02, 0.95],// Smoke Index ppm
  oz:          [10, 80],    // Ozone ppb
  so2:         [2, 45],     // Sulfur Dioxide ppb
  du:          [15, 140],   // Dust Density µg/m³
  pm1:         [5, 65],     // PM1.0 µg/m³
  pm25:        [10, 140],   // PM2.5 µg/m³
  pm10:        [15, 180],   // PM10 µg/m³
  co2:         [380, 1100], // Carbon Dioxide ppm
  tvoc:        [60, 550],   // Total VOC ppb
  co:          [0.2, 7.5],  // Carbon Monoxide ppm
  no2:         [8, 55],     // Nitrogen Dioxide ppb
  nh3:         [0.1, 4.2],  // Ammonia ppm
  c3h8:        [0.05, 2.5], // Propane ppm
  c4h10:       [0.05, 2.8], // Butane ppm
  ch4:         [0.5, 4.5],  // Methane ppm
  h2:          [0.05, 1.8], // Hydrogen ppm
  c2h50h:      [0.05, 3.2], // Ethanol ppm
  b:           [82, 100],   // Battery %
  mic_v:       [35, 78],    // Mic / Noise dB

  // Weather Station (13 variables)
  time:        [0, 0],
  t1:          [16, 36],    // Air Temperature °C
  rh1:         [30, 85],    // Relative Humidity %
  l1:          [200, 55000],// Light Intensity lux
  voc:         [40, 420],   // VOC ppb
  p:           [985, 1025], // Barometric Pressure hPa
  ws:          [0.8, 16.5], // Wind Speed m/s
  wd:          [0, 359],    // Wind Direction °
  r:           [0.0, 14.5], // Rainfall mm/h

  // Generic fallback
  status:      [0, 1],
  reading1:    [0, 100],
}

function getReading(deviceName, metricKey, isOffline, tick) {
  if (isOffline) {
    if (metricKey === 'time' || metricKey === 'time1') return '—'
    if (metricKey === 'id') return deviceName ? (deviceName.match(/\d+/)?.[0] || '01') : '01'
    return '0.0'
  }

  if (metricKey === 'time' || metricKey === 'time1') {
    const d = new Date(Date.now() - tick * 1000)
    return d.toTimeString().split(' ')[0]
  }

  if (metricKey === 'id') {
    const num = (seedNum(deviceName) % 89) + 10
    return `NODE-${num}`
  }

  const [min, max] = METRIC_RANGES[metricKey] || [0, 100]
  const seed = seedNum(deviceName) + tick * 5.7 + seedNum(metricKey) * 0.3
  const rand = (Math.sin(seed) + 1) / 2
  const val = min + rand * (max - min)

  if (metricKey === 'tx') {
    const base = 1200 + (seedNum(deviceName) % 800)
    return String(Math.floor(base + tick * 3))
  }

  if (['co2', 'l1', 'p', 'wd', 'b', 'du', 'tvoc', 'voc', 'oz', 'so2', 'no2'].includes(metricKey)) {
    return Math.round(val).toString()
  }

  if (['sk', 'co', 'nh3', 'c3h8', 'c4h10', 'ch4', 'h2', 'c2h50h', 'ws', 'r'].includes(metricKey)) {
    return val.toFixed(2)
  }

  return val.toFixed(1)
}

function buildTrendSeries(seedStr, min, max, pointsCount = 12) {
  const seed = seedNum(seedStr)
  return historicalData.slice(0, pointsCount).map((row, i) => {
    const hour = i * 2
    const wave = 0.5 + 0.5 * Math.sin(((hour - 6) / 12) * Math.PI + (seed % 6))
    return { time: row.time, value: +(min + wave * (max - min)).toFixed(2) }
  })
}

function buildSparkline(seedStr, min, max) {
  const seed = seedNum(seedStr)
  return Array.from({ length: 8 }).map((_, i) => {
    const val = min + ((Math.sin(seed + i * 1.3) + 1) / 2) * (max - min)
    return +(val.toFixed(1))
  })
}

function getWindCardinal(degrees) {
  const deg = parseFloat(degrees) || 0
  const val = Math.floor((deg / 22.5) + 0.5) % 16
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return arr[val] || 'N'
}

function getAqiRating(pm25Val) {
  const pm = parseFloat(pm25Val) || 28
  if (pm <= 12) return { label: 'Good', aqi: Math.round(pm * 4.1), color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-950/40 border-success-200 dark:border-success-800', badge: 'badge-success' }
  if (pm <= 35.4) return { label: 'Moderate', aqi: Math.round(50 + (pm - 12) * 2.1), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', badge: 'badge-primary' }
  if (pm <= 55.4) return { label: 'Unhealthy for Sensitive', aqi: Math.round(100 + (pm - 35.4) * 2.5), color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800', badge: 'badge-warning' }
  return { label: 'Unhealthy', aqi: Math.round(150 + (pm - 55.4) * 1.5), color: 'text-danger-600 dark:text-danger-400', bg: 'bg-danger-50 dark:bg-danger-950/40 border-danger-200 dark:border-danger-800', badge: 'badge-danger' }
}

function getParameterStatus(key, valStr) {
  const v = parseFloat(valStr)
  if (isNaN(v)) return { text: 'Active', dot: 'bg-surface-400' }

  if (key === 'pm25') {
    if (v < 25) return { text: 'Optimal', dot: 'bg-success-500' }
    if (v < 50) return { text: 'Moderate', dot: 'bg-amber-500' }
    return { text: 'Elevated', dot: 'bg-danger-500' }
  }
  if (key === 'co2') {
    if (v < 800) return { text: 'Fresh', dot: 'bg-success-500' }
    if (v < 1000) return { text: 'Normal', dot: 'bg-amber-500' }
    return { text: 'Ventilate', dot: 'bg-danger-500' }
  }
  if (key === 'moisture') {
    if (v >= 40 && v <= 65) return { text: 'Optimal', dot: 'bg-success-500' }
    if (v < 40) return { text: 'Dry', dot: 'bg-amber-500' }
    return { text: 'Saturated', dot: 'bg-info-500' }
  }
  if (key === 'b') {
    if (v > 85) return { text: 'Strong', dot: 'bg-success-500' }
    if (v > 20) return { text: 'Good', dot: 'bg-success-500' }
    return { text: 'Low', dot: 'bg-danger-500' }
  }
  return { text: 'Nominal', dot: 'bg-success-500' }
}

const AQMS_CATEGORIES = [
  { id: 'all', label: 'All (24)', keys: null },
  { id: 'gases', label: 'Gases (12)', keys: ['co2', 'tvoc', 'co', 'no2', 'nh3', 'oz', 'so2', 'ch4', 'c3h8', 'c4h10', 'h2', 'c2h50h'] },
  { id: 'particulates', label: 'Particulates (4)', keys: ['pm1', 'pm25', 'pm10', 'du'] },
  { id: 'microclimate', label: 'Climate & Audio (4)', keys: ['t', 'rh', 'mic_v', 'sk'] },
  { id: 'diagnostics', label: 'Diagnostics (4)', keys: ['time1', 'id', 'tx', 'b'] },
]

const WEATHER_CATEGORIES = [
  { id: 'all', label: 'All (13)', keys: null },
  { id: 'atmosphere', label: 'Atmosphere (4)', keys: ['t1', 'rh1', 'p', 'l1'] },
  { id: 'wind_rain', label: 'Wind & Rain (3)', keys: ['ws', 'wd', 'r'] },
  { id: 'gases', label: 'Ambient Air (2)', keys: ['co', 'voc'] },
  { id: 'diagnostics', label: 'Diagnostics (4)', keys: ['time', 'id', 'tx', 'b'] },
]

export default function GenericDeviceDashboard({ deviceTypeId, scope }) {
  const { user } = useAuth()
  const [tick, setTick] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [timeRange, setTimeRange] = useState('24H')
  const [tableColumnFilter, setTableColumnFilter] = useState('all')

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 4000)
    return () => clearInterval(interval)
  }, [])

  const deviceType = getDeviceType(deviceTypeId)

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

  const primaryDevice = orgDevices[0]
  const { liveReadings } = useDeviceStream(primaryDevice?.id)

  const metrics = useMemo(() => deviceType?.metrics || [], [deviceType])

  // Selectable metric for the 24h Trend AreaChart
  const chartableMetrics = useMemo(() => {
    return metrics.filter(m => !['time', 'time1', 'id', 'tx'].includes(m.key))
  }, [metrics])

  const [selectedMetricKey, setSelectedMetricKey] = useState(null)

  const activeTrendMetric = useMemo(() => {
    if (selectedMetricKey) {
      const found = chartableMetrics.find(m => m.key === selectedMetricKey)
      if (found) return found
    }
    return chartableMetrics[0] || metrics[0]
  }, [chartableMetrics, metrics, selectedMetricKey])

  const resolveReading = (device, metricKey) => {
    if (device?.id === primaryDevice?.id && liveReadings?.variables?.[metricKey] !== undefined) {
      const v = liveReadings.variables[metricKey]
      return typeof v === 'number' ? (Number.isInteger(v) ? v.toString() : v.toFixed(1)) : String(v)
    }
    return getReading(device?.name || orgName, metricKey, device?.status === 'Offline', tick)
  }

  if (!deviceType) return null

  const onlineCount = orgDevices.filter(d => d.status === 'Online').length
  const isSoil = deviceTypeId === 'soil'
  const isAqms = deviceTypeId === 'aqms'
  const isWeather = deviceTypeId === 'weatherstation'

  const categories = isAqms ? AQMS_CATEGORIES : (isWeather ? WEATHER_CATEGORIES : [])

  // Filtered metrics for parameter grid based on Category + Search
  const filteredMetrics = useMemo(() => {
    let list = metrics
    if (activeCategory !== 'all' && categories.length) {
      const cat = categories.find(c => c.id === activeCategory)
      if (cat?.keys) list = list.filter(m => cat.keys.includes(m.key))
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase()
      list = list.filter(m => m.label.toLowerCase().includes(q) || m.key.toLowerCase().includes(q))
    }
    return list
  }, [metrics, activeCategory, categories, searchTerm])

  // Filtered columns for telemetry table
  const tableMetrics = useMemo(() => {
    if (tableColumnFilter === 'all' || !categories.length) return metrics
    const cat = categories.find(c => c.id === tableColumnFilter)
    return cat?.keys ? metrics.filter(m => cat.keys.includes(m.key)) : metrics
  }, [metrics, tableColumnFilter, categories])

  const trendRange = METRIC_RANGES[activeTrendMetric?.key] || [0, 100]
  const trendSeries = activeTrendMetric
    ? buildTrendSeries(`${orgName}-${activeTrendMetric.key}`, trendRange[0], trendRange[1])
    : []

  // Trend statistics (Min, Avg, Max, Current)
  const trendStats = useMemo(() => {
    if (!trendSeries.length) return { min: 0, avg: 0, max: 0, current: 0 }
    const vals = trendSeries.map(p => p.value)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    const current = vals[vals.length - 1]
    return {
      min: min.toFixed(1),
      avg: avg.toFixed(1),
      max: max.toFixed(1),
      current: current.toFixed(1),
    }
  }, [trendSeries])

  // Key live values for hero cards
  const pm25Val = orgDevices.length ? resolveReading(orgDevices[0], 'pm25') : '32'
  const aqiInfo = isAqms ? getAqiRating(pm25Val) : null

  const tempVal = orgDevices.length ? resolveReading(orgDevices[0], isAqms ? 't' : (isWeather ? 't1' : 'airTemp')) : '24.5'
  const humidityVal = orgDevices.length ? resolveReading(orgDevices[0], isAqms ? 'rh' : (isWeather ? 'rh1' : 'airMoisture')) : '52'
  const windVal = isWeather && orgDevices.length ? resolveReading(orgDevices[0], 'ws') : '4.8'
  const windDirVal = isWeather && orgDevices.length ? resolveReading(orgDevices[0], 'wd') : '180'
  const rainVal = isWeather && orgDevices.length ? resolveReading(orgDevices[0], 'r') : '0.0'
  const soilMoistVal = isSoil && orgDevices.length ? resolveReading(orgDevices[0], 'moisture') : '48.5'
  const soilTempVal = isSoil && orgDevices.length ? resolveReading(orgDevices[0], 'soilTemp') : '21.2'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="page-title flex items-center gap-2.5">
            <deviceType.icon className="text-primary-500" size={24} />
            {deviceType.name}
          </h2>
          <p className="breadcrumb">{deviceType.fullName || deviceType.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
            <span className={`w-2 h-2 rounded-full ${onlineCount > 0 ? 'bg-success-500 animate-pulse' : 'bg-surface-400'}`} />
            {onlineCount} of {orgDevices.length} Online
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
            {metrics.length} Parameters Monitored
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* HERO STATUS CARDS PER DASHBOARD TYPE                                     */}
      {/* ───────────────────────────────────────────────────────────────────────── */}

      {/* 1. AQMS HERO: Air Quality Index & High-Level Ambient Callout */}
      {isAqms && aqiInfo && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${aqiInfo.bg} flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 flex flex-col items-center justify-center shadow-xs flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">AQI</span>
              <span className={`text-xl font-black ${aqiInfo.color}`}>{aqiInfo.aqi}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                  Air Quality Status: <span className={aqiInfo.color}>{aqiInfo.label}</span>
                </h3>
                <span className={`badge ${aqiInfo.badge} text-[10px]`}>Live Telemetry</span>
              </div>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-0.5">
                Primary Contributor: <strong>PM2.5 ({pm25Val} µg/m³)</strong> &bull; Carbon Dioxide: <strong>{resolveReading(orgDevices[0], 'co2')} ppm</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 text-xs text-surface-600 dark:text-surface-300 border-t md:border-t-0 md:border-l border-surface-200 dark:border-surface-700/60 pt-3 md:pt-0 md:pl-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Temperature</span>
              <span className="text-sm font-bold text-surface-800 dark:text-surface-100">{tempVal} °C</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Humidity</span>
              <span className="text-sm font-bold text-surface-800 dark:text-surface-100">{humidityVal} %</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Acoustic</span>
              <span className="text-sm font-bold text-surface-800 dark:text-surface-100">{resolveReading(orgDevices[0], 'mic_v')} dB</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Battery</span>
              <span className="text-sm font-bold text-success-600 dark:text-success-400">{resolveReading(orgDevices[0], 'b')} %</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. WEATHER STATION HERO: Meteorological Summary & Cardinal Wind */}
      {isWeather && (
        <div className="p-4 sm:p-5 rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 flex flex-col items-center justify-center shadow-xs flex-shrink-0">
              <Compass size={24} className="text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                  Meteorological Station Summary
                </h3>
                <span className="badge badge-info text-[10px]">Real-time AWS</span>
              </div>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-0.5">
                Wind: <strong>{windVal} m/s ({getWindCardinal(windDirVal)} &bull; {windDirVal}°)</strong> &bull; Precipitation: <strong>{rainVal} mm/h</strong> &bull; Pressure: <strong>{resolveReading(orgDevices[0], 'p')} hPa</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-xs text-surface-600 dark:text-surface-300 border-t md:border-t-0 md:border-l border-surface-200 dark:border-surface-700/60 pt-3 md:pt-0 md:pl-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Air Temp</span>
              <span className="text-sm font-bold text-surface-800 dark:text-surface-100">{tempVal} °C</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Rel Humidity</span>
              <span className="text-sm font-bold text-surface-800 dark:text-surface-100">{humidityVal} %</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Solar Lux</span>
              <span className="text-sm font-bold text-surface-800 dark:text-surface-100">{resolveReading(orgDevices[0], 'l1')} lux</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Battery</span>
              <span className="text-sm font-bold text-success-600 dark:text-success-400">{resolveReading(orgDevices[0], 'b')} %</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. SOIL MOISTURE HERO: Subsurface Health & Irrigation Status */}
      {isSoil && (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 flex flex-col items-center justify-center shadow-xs flex-shrink-0">
              <Droplets size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                  Subsurface Agricultural Probe Status: <span className="text-emerald-600 dark:text-emerald-400">Optimal Hydration</span>
                </h3>
                <span className="badge badge-success text-[10px]">Probe Active</span>
              </div>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-0.5">
                Volumetric Moisture: <strong>{soilMoistVal} %</strong> &bull; Root Zone Temp: <strong>{soilTempVal} °C</strong> &bull; Irrigation: <strong>Adequate (No Action Needed)</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-xs text-surface-600 dark:text-surface-300 border-t md:border-t-0 md:border-l border-surface-200 dark:border-surface-700/60 pt-3 md:pt-0 md:pl-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Air Temp</span>
              <span className="text-sm font-bold text-surface-800 dark:text-surface-100">{resolveReading(orgDevices[0], 'airTemp')} °C</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Air Moisture</span>
              <span className="text-sm font-bold text-surface-800 dark:text-surface-100">{resolveReading(orgDevices[0], 'airMoisture')} %</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-surface-400 block">Temp Delta</span>
              <span className="text-sm font-bold text-surface-800 dark:text-surface-100">
                {(parseFloat(resolveReading(orgDevices[0], 'airTemp') || 26) - parseFloat(soilTempVal)).toFixed(1)} °C
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* SOIL MOISTURE: 4 Key Variable StatCards                                   */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {isSoil && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(m => {
            const val = orgDevices.length ? resolveReading(orgDevices[0], m.key) : '—'
            const [min, max] = METRIC_RANGES[m.key] || [0, 100]
            const sparkData = buildSparkline(`${orgDevices[0]?.name || orgName}-${m.key}`, min, max)
            const isSelected = activeTrendMetric?.key === m.key

            return (
              <div
                key={m.key}
                onClick={() => setSelectedMetricKey(m.key)}
                className={`cursor-pointer transition-all duration-150 ${isSelected ? 'ring-2 ring-primary-500 rounded-xl' : ''}`}
              >
                <StatCard
                  label={m.label}
                  value={orgDevices.length ? `${val}${m.unit ? ' ' + m.unit : ''}` : '—'}
                  icon={m.icon}
                  color={m.color}
                  sparkline={true}
                  sparklineData={sparkData}
                  sub={orgDevices[0]?.name || 'Probe Active'}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 24H HISTORICAL TREND AREA CHART                                          */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTrendMetric && (
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <LineChart size={16} className="text-primary-500" />
                <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">
                  {activeTrendMetric.label} Historical Trend
                </h3>
                <span className="badge badge-neutral text-[10px]">{activeTrendMetric.unit || 'Index'}</span>
              </div>
              <p className="text-xs text-surface-500 mt-0.5">
                Telemetry log for {orgDevices[0]?.name || 'Primary Node'} &bull; Parameter: <code className="text-primary-600 font-mono">{activeTrendMetric.key}</code>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Range Buttons */}
              <div className="flex items-center bg-surface-100 dark:bg-surface-800 p-0.5 rounded-lg border border-surface-200 dark:border-surface-700">
                {['1H', '6H', '24H', '7D'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTimeRange(r)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                      timeRange === r ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-xs' : 'text-surface-500 hover:text-surface-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Variable Switcher Dropdown */}
              {chartableMetrics.length > 1 && (
                <select
                  value={activeTrendMetric.key}
                  onChange={(e) => setSelectedMetricKey(e.target.value)}
                  aria-label="Select parameter for trend chart"
                  className="input-field text-xs py-1 px-2.5 rounded-lg border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
                >
                  {chartableMetrics.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label} {m.unit ? `(${m.unit})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Quick Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-850 border border-surface-150 dark:border-surface-800 text-xs">
            <div className="flex items-center justify-between px-2 border-r border-surface-200 dark:border-surface-750">
              <span className="text-surface-400 font-medium">Min:</span>
              <span className="font-bold text-surface-700 dark:text-surface-200">{trendStats.min} {activeTrendMetric.unit}</span>
            </div>
            <div className="flex items-center justify-between px-2 border-r border-surface-200 dark:border-surface-750">
              <span className="text-surface-400 font-medium">Avg:</span>
              <span className="font-bold text-surface-700 dark:text-surface-200">{trendStats.avg} {activeTrendMetric.unit}</span>
            </div>
            <div className="flex items-center justify-between px-2 border-r border-surface-200 dark:border-surface-750">
              <span className="text-surface-400 font-medium">Max:</span>
              <span className="font-bold text-surface-700 dark:text-surface-200">{trendStats.max} {activeTrendMetric.unit}</span>
            </div>
            <div className="flex items-center justify-between px-2">
              <span className="text-surface-400 font-medium">Current:</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">{trendStats.current} {activeTrendMetric.unit}</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendSeries}>
                <defs>
                  <linearGradient id="genericMetricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-150 dark:stroke-surface-800" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={42} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
                  formatter={(value) => [`${value} ${activeTrendMetric.unit || ''}`, activeTrendMetric.label]}
                />
                <Area type="monotone" dataKey="value" stroke="#F5A623" strokeWidth={2.5} fill="url(#genericMetricGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* DECLUTTERED PARAMETER CARDS FOR AQMS & WEATHER STATION                    */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {(isAqms || isWeather) && (
        <div className="space-y-3">
          {/* Subsystem Category Filter Bar + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-surface-900 p-3 rounded-xl border border-surface-200 dark:border-surface-800 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-surface-400 mr-1 flex items-center gap-1">
                <Filter size={12} /> Category:
              </span>
              {categories.map(c => {
                const active = activeCategory === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-primary-500 text-white shadow-xs'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>

            <div className="relative min-w-[12rem]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search parameter or key..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input pl-8 py-1.5 text-xs w-full"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredMetrics.map(m => {
              const val = orgDevices.length ? resolveReading(orgDevices[0], m.key) : '—'
              const isChartable = !['time', 'time1', 'id', 'tx'].includes(m.key)
              const isSelected = activeTrendMetric?.key === m.key
              const pStatus = getParameterStatus(m.key, val)

              return (
                <div
                  key={m.key}
                  onClick={() => isChartable && setSelectedMetricKey(m.key)}
                  className={`p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                    isChartable ? 'cursor-pointer hover:shadow-floating hover:border-primary-400' : ''
                  } ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/20 ring-1 ring-primary-500 shadow-sm'
                      : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider truncate" title={m.label}>
                      {m.label}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${pStatus.dot}`} title={pStatus.text} />
                      <m.icon size={13} className="text-primary-500" />
                    </div>
                  </div>

                  <div>
                    <div className="text-lg font-bold text-surface-900 dark:text-surface-100 leading-tight">
                      {val}
                      {m.unit && <span className="text-[11px] font-medium text-surface-400 ml-1">{m.unit}</span>}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-[10px] text-surface-400">
                    <span className="font-mono text-primary-600 dark:text-primary-400">{m.key}</span>
                    <span className="text-[9px] font-semibold uppercase text-surface-400">{pStatus.text}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredMetrics.length === 0 && (
            <div className="card p-8 text-center text-surface-400 text-xs">
              No parameters match your search query "{searchTerm}".
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* DEVICE TELEMETRY TABLE: Filterable columns with zero clutter               */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100">
              {deviceType.shortName} Live Telemetry Readings {orgName ? `— ${orgName}` : ''}
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">
              {orgDevices.length} Device node{orgDevices.length === 1 ? '' : 's'} reporting telemetry
            </p>
          </div>

          {/* Category column selector for tables with > 8 columns */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-surface-400">Columns:</span>
              <select
                value={tableColumnFilter}
                onChange={e => setTableColumnFilter(e.target.value)}
                className="input-field text-xs py-1 px-2.5 rounded-lg border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
              >
                <option value="all">All Columns ({metrics.length})</option>
                {categories.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {orgDevices.length === 0 ? (
          <div className="text-center py-10">
            <Cpu size={24} className="text-surface-300 mx-auto mb-2" />
            <p className="text-xs text-surface-500">No {deviceType.shortName} devices registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="text-left text-surface-500 border-b border-surface-150 dark:border-surface-800">
                  <th className="py-2.5 pr-4 font-bold uppercase tracking-wide whitespace-nowrap sticky left-0 bg-white dark:bg-surface-900 z-10">
                    Device
                  </th>
                  <th className="py-2.5 pr-4 font-bold uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="py-2.5 pr-4 font-bold uppercase tracking-wide whitespace-nowrap">Gateway</th>
                  {tableMetrics.map(m => (
                    <th key={m.key} className="py-2.5 pr-4 font-bold uppercase tracking-wide whitespace-nowrap">
                      {m.label} {m.unit ? `(${m.unit})` : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgDevices.map(d => (
                  <tr key={d.id} className="border-b border-surface-100 dark:border-surface-900 last:border-0 hover:bg-surface-50/50 dark:hover:bg-surface-800/30">
                    <td className="py-3 pr-4 font-semibold text-surface-800 dark:text-surface-100 whitespace-nowrap sticky left-0 bg-white dark:bg-surface-900 z-10">
                      {d.name}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className={`badge ${d.status === 'Online' ? 'badge-success' : 'badge-neutral'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-surface-500 whitespace-nowrap">{d.gateway}</td>
                    {tableMetrics.map(m => (
                      <td key={m.key} className="py-3 pr-4 text-surface-700 dark:text-surface-300 whitespace-nowrap font-mono text-xs">
                        {resolveReading(d, m.key)}
                        {m.unit ? ` ${m.unit}` : ''}
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
