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
  Zap, Wind, Droplets, AirVent, Boxes,
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
      { key: 'aqi',        label: 'Air Quality Index', unit: '',      icon: Wind,     color: 'info' },
      { key: 'pm25',       label: 'PM2.5',              unit: 'µg/m³', icon: Wind,     color: 'warning' },
      { key: 'pm10',       label: 'PM10',               unit: 'µg/m³', icon: Wind,     color: 'primary' },
      { key: 'co2',        label: 'CO₂ Level',          unit: 'ppm',   icon: Wind,     color: 'danger' },
      { key: 'temperature',label: 'Temperature',        unit: '°C',    icon: Droplets, color: 'success' },
      { key: 'humidity',   label: 'Humidity',           unit: '%',     icon: Droplets, color: 'info' },
    ],
  },
  {
    id: 'soil',
    name: 'Soil Moisture Meter',
    shortName: 'Soil Moisture',
    icon: Droplets,
    color: 'success',
    description: 'In-field probes tracking soil moisture, temperature and conductivity for irrigation.',
    metrics: [
      { key: 'moisture',    label: 'Soil Moisture',     unit: '%',    icon: Droplets, color: 'info' },
      { key: 'soilTemp',    label: 'Soil Temperature',  unit: '°C',   icon: Droplets, color: 'warning' },
      { key: 'conductivity',label: 'Conductivity (EC)', unit: 'mS/cm',icon: Droplets, color: 'primary' },
      { key: 'ph',          label: 'Soil pH',           unit: 'pH',   icon: Droplets, color: 'success' },
    ],
  },
  {
    id: 'airpurifier',
    name: 'Air Purifier',
    shortName: 'Air Purifier',
    icon: AirVent,
    color: 'warning',
    description: 'Purifier units reporting filtration performance and indoor air output quality.',
    metrics: [
      { key: 'aqiOut',     label: 'Output AQI',        unit: '',   icon: AirVent, color: 'success' },
      { key: 'pm25In',     label: 'PM2.5 (Inlet)',     unit: 'µg/m³', icon: Wind, color: 'danger' },
      { key: 'pm25Out',    label: 'PM2.5 (Outlet)',    unit: 'µg/m³', icon: Wind, color: 'success' },
      { key: 'fanSpeed',   label: 'Fan Speed',         unit: '%',  icon: AirVent, color: 'primary' },
      { key: 'filterLife', label: 'Filter Life Remaining', unit: '%', icon: AirVent, color: 'warning' },
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
      { key: 'status',  label: 'Device Status',  unit: '', icon: Boxes, color: 'neutral' },
      { key: 'reading1',label: 'Primary Reading',unit: '', icon: Boxes, color: 'neutral' },
    ],
  },
]

export const DEVICE_TYPE_MAP = DEVICE_TYPES.reduce((acc, t) => { acc[t.id] = t; return acc }, {})

export const getDeviceType = (id) => DEVICE_TYPE_MAP[id] || null

// Every org defaults to at least EMS if nothing is configured, so the
// existing system behaves exactly as before for orgs that predate this
// feature (no data migration required).
export const DEFAULT_DEVICE_TYPES = ['ems']
