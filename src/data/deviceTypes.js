// Embed AIoT — Device / Product Type Catalog
//
// This is the single source of truth for every device/product category the
// platform supports. Organizations are assigned a subset of these during
// Organization Registration (Admin > Organizations), and each org can further
// designate a subset of its own types to individual users (Org > Users).
//
// HOW TO ADD A NEW DEVICE TYPE LATER:
//   1. Add an entry below with a unique `id`, a `name`, an `icon` (lucide-react
//      component), a short `description`, and a `metrics` array describing the
//      cards/parameters its dashboard should show (label, key, unit, icon, color).
//   2. If it needs a fully custom dashboard (not just different metric cards),
//      add a case for it in `GenericDeviceDashboard.jsx`'s metric config, or
//      build a bespoke page and route to it from `DeviceDashboardRouter`.
//   3. That's it — it will automatically appear as an option in Organization
//      Registration, the User designation form, and the post-login Device
//      Selection screen.
//
// Types without a finalized parameter list ship with a small placeholder set
// marked `provisional: true` so the UI clearly communicates "structure is
// ready, real parameters to be confirmed" rather than inventing specifics.

import {
  Zap,
  Wind,
  Droplets,
  Boxes,
  Thermometer,
  Clock,
  Hash,
  Radio,
  CloudFog,
  Sun,
  AlertTriangle,
  Layers,
  Activity,
  Gauge,
  AlertCircle,
  Flame,
  FlaskConical,
  Battery,
  Mic,
  CloudSun,
  SunMedium,
  Compass,
  CloudRain,
} from 'lucide-react'

export const DEVICE_TYPES = [
  {
    id: 'ems',
    name: 'Energy Management Devices',
    shortName: 'EMS',
    icon: Zap,
    color: 'primary',
    description: 'Panels, meters & gateways monitoring voltage, current, power factor and consumption.',
    isDefault: true, // renders the existing, unmodified EMS dashboard
  },
  {
    id: 'aqms',
    name: 'AQMS',
    shortName: 'AQMS',
    fullName: 'Air Quality Monitoring System',
    icon: Wind,
    color: 'info',
    description: 'Ambient air quality sensors tracking pollutants, particulates and comfort levels.',
    metrics: [
      { key: 'time1',  label: 'Timestamp (time1)',       unit: '',      icon: Clock,        color: 'neutral' },
      { key: 'id',     label: 'Sensor ID (id)',          unit: '',      icon: Hash,         color: 'neutral' },
      { key: 'tx',     label: 'Tx Packets (tx)',         unit: 'pkts',  icon: Radio,        color: 'info' },
      { key: 't',      label: 'Temperature (t)',         unit: '°C',    icon: Thermometer,  color: 'warning' },
      { key: 'rh',     label: 'Relative Humidity (rh)',  unit: '%',     icon: Droplets,     color: 'info' },
      { key: 'sk',     label: 'Smoke Index (sk)',        unit: 'ppm',   icon: CloudFog,     color: 'danger' },
      { key: 'oz',     label: 'Ozone (oz)',              unit: 'ppb',   icon: Sun,          color: 'warning' },
      { key: 'so2',    label: 'Sulfur Dioxide (so2)',    unit: 'ppb',   icon: AlertTriangle,color: 'danger' },
      { key: 'du',     label: 'Dust Density (du)',       unit: 'µg/m³', icon: Layers,       color: 'primary' },
      { key: 'pm1',    label: 'PM1.0 (pm1)',             unit: 'µg/m³', icon: Wind,         color: 'info' },
      { key: 'pm25',   label: 'PM2.5 (pm25)',            unit: 'µg/m³', icon: Wind,         color: 'warning' },
      { key: 'pm10',   label: 'PM10 (pm10)',             unit: 'µg/m³', icon: Wind,         color: 'primary' },
      { key: 'co2',    label: 'Carbon Dioxide (co2)',    unit: 'ppm',   icon: Activity,     color: 'danger' },
      { key: 'tvoc',   label: 'Total VOC (tvoc)',        unit: 'ppb',   icon: Gauge,        color: 'warning' },
      { key: 'co',     label: 'Carbon Monoxide (co)',    unit: 'ppm',   icon: AlertCircle,  color: 'danger' },
      { key: 'no2',    label: 'Nitrogen Dioxide (no2)',  unit: 'ppb',   icon: Wind,         color: 'warning' },
      { key: 'nh3',    label: 'Ammonia (nh3)',           unit: 'ppm',   icon: AlertTriangle,color: 'danger' },
      { key: 'c3h8',   label: 'Propane (c3h8)',          unit: 'ppm',   icon: Flame,        color: 'danger' },
      { key: 'c4h10',  label: 'Butane (c4h10)',          unit: 'ppm',   icon: Flame,        color: 'danger' },
      { key: 'ch4',    label: 'Methane (ch4)',           unit: 'ppm',   icon: Flame,        color: 'danger' },
      { key: 'h2',     label: 'Hydrogen (h2)',           unit: 'ppm',   icon: Zap,          color: 'primary' },
      { key: 'c2h50h', label: 'Ethanol (c2h50h)',        unit: 'ppm',   icon: FlaskConical, color: 'primary' },
      { key: 'b',      label: 'Battery (b)',             unit: '%',     icon: Battery,      color: 'success' },
      { key: 'mic_v',  label: 'Mic / Noise (mic_v)',     unit: 'dB',    icon: Mic,          color: 'neutral' },
    ],
  },
  {
    id: 'soil',
    name: 'Soil Moisture Meter',
    shortName: 'Soil Moisture',
    fullName: 'Soil Moisture & Soil/Air Temperature Meter',
    icon: Droplets,
    color: 'success',
    description: 'In-field probes tracking soil moisture, soil temperature, air moisture and air temperature.',
    metrics: [
      { key: 'moisture',    label: 'Soil Moisture',    unit: '%',  icon: Droplets,    color: 'info' },
      { key: 'soilTemp',    label: 'Soil Temperature', unit: '°C', icon: Thermometer, color: 'warning' },
      { key: 'airMoisture', label: 'Air Moisture',     unit: '%',  icon: Droplets,    color: 'primary' },
      { key: 'airTemp',     label: 'Air Temperature',  unit: '°C', icon: Thermometer, color: 'danger' },
    ],
  },
  {
    id: 'weatherstation',
    name: 'Weather Station',
    shortName: 'Weather Station',
    fullName: 'Automated Weather Monitoring Station',
    icon: CloudSun,
    color: 'info',
    description: 'Real-time meteorological monitoring station tracking temperature, wind, rain, pressure, and ambient gases.',
    metrics: [
      { key: 'time', label: 'Timestamp (time)',        unit: '',     icon: Clock,       color: 'neutral' },
      { key: 'id',   label: 'Station ID (id)',         unit: '',     icon: Hash,        color: 'neutral' },
      { key: 'tx',   label: 'Tx Packets (tx)',         unit: 'pkts', icon: Radio,       color: 'info' },
      { key: 't1',   label: 'Air Temperature (t1)',    unit: '°C',   icon: Thermometer, color: 'warning' },
      { key: 'rh1',  label: 'Relative Humidity (rh1)', unit: '%',    icon: Droplets,    color: 'info' },
      { key: 'l1',   label: 'Light Intensity (l1)',    unit: 'lux',  icon: SunMedium,   color: 'warning' },
      { key: 'co',   label: 'Carbon Monoxide (co)',    unit: 'ppm',  icon: AlertCircle, color: 'danger' },
      { key: 'voc',  label: 'VOC (voc)',               unit: 'ppb',  icon: Gauge,       color: 'warning' },
      { key: 'p',    label: 'Barometric Pressure (p)', unit: 'hPa',  icon: Gauge,       color: 'primary' },
      { key: 'ws',   label: 'Wind Speed (ws)',         unit: 'm/s',  icon: Wind,        color: 'info' },
      { key: 'wd',   label: 'Wind Direction (wd)',     unit: '°',    icon: Compass,     color: 'primary' },
      { key: 'r',    label: 'Rainfall (r)',            unit: 'mm/h', icon: CloudRain,   color: 'info' },
      { key: 'b',    label: 'Battery Level (b)',       unit: '%',    icon: Battery,     color: 'success' },
    ],
  },
  {
    id: 'other',
    name: 'Other Supported Embed AIoT Devices',
    shortName: 'Other',
    icon: Boxes,
    color: 'neutral',
    description: 'Reserved for additional Embed AIoT device categories as they are onboarded.',
    provisional: true,
    metrics: [
      { key: 'status',   label: 'Device Status',  unit: '', icon: Boxes, color: 'neutral' },
      { key: 'reading1', label: 'Primary Reading', unit: '', icon: Boxes, color: 'neutral' },
    ],
  },
]

export const DEVICE_TYPE_MAP = DEVICE_TYPES.reduce((acc, t) => { acc[t.id] = t; return acc }, {})

export const getDeviceType = (id) => DEVICE_TYPE_MAP[id] || null

// Every org defaults to at least EMS if nothing is configured, so the
// existing system behaves exactly as before for orgs that predate this
// feature (no data migration required).
export const DEFAULT_DEVICE_TYPES = ['ems']
