import {
  LineChart as LineIcon, AreaChart as AreaIcon, BarChart3, PieChart as PieIcon,
  Gauge, CreditCard, Table2, BellRing, LayoutGrid, FileText,
} from 'lucide-react'

// Every entry here is one "panel type" a user can drop onto their canvas —
// mirrors a Grafana-style visualization picker.
export const WIDGET_TYPES = [
  { type: 'line',   label: 'Line Chart',    icon: LineIcon, defaultSize: { w: 6, h: 8 }, description: 'Trend over time' },
  { type: 'area',   label: 'Area Chart',    icon: AreaIcon, defaultSize: { w: 6, h: 8 }, description: 'Filled trend over time' },
  { type: 'bar',    label: 'Bar Chart',     icon: BarChart3, defaultSize: { w: 6, h: 8 }, description: 'Compare values or groups' },
  { type: 'pie',    label: 'Pie / Donut',   icon: PieIcon,  defaultSize: { w: 4, h: 8 }, description: 'Share of total' },
  { type: 'gauge',  label: 'Radial Gauge',  icon: Gauge,    defaultSize: { w: 4, h: 8 }, description: 'Single current value' },
  { type: 'stat',   label: 'Stat Card',     icon: CreditCard, defaultSize: { w: 3, h: 5 }, description: 'Big number + trend' },
  { type: 'table',  label: 'Data Table',    icon: Table2,   defaultSize: { w: 6, h: 8 }, description: 'Per-device breakdown' },
  { type: 'alarms', label: 'Alarm List',    icon: BellRing, defaultSize: { w: 4, h: 8 }, description: 'Recent active alarms' },
  { type: 'heatmap',label: 'Energy Heatmap', icon: LayoutGrid, defaultSize: { w: 12, h: 10 }, description: '24h × 7-day load pattern' },
  { type: 'text',   label: 'Text / Markdown', icon: FileText, defaultSize: { w: 4, h: 6 }, description: 'Rich notes and section headers' },
  { type: 'multiseries', label: 'Multi-Metric Chart', icon: LineIcon, defaultSize: { w: 8, h: 9 }, description: 'Overlay 2–4 metrics on one chart' },
]

export const SYSTEM_TYPES = [
  { id: 'ems',            name: 'Energy Management (EMS)', shortName: 'EMS', badgeColor: 'badge-primary', color: 'primary' },
  { id: 'aqms',           name: 'Air Quality (AQMS)',       shortName: 'AQMS', badgeColor: 'badge-info', color: 'info' },
  { id: 'soil',           name: 'Soil Moisture Meter',      shortName: 'Soil', badgeColor: 'badge-success', color: 'success' },
  { id: 'weatherstation', name: 'Weather Station',          shortName: 'Weather', badgeColor: 'badge-purple', color: 'purple' },
  { id: 'unified',        name: 'Unified / Multi-System',   shortName: 'Unified', badgeColor: 'badge-neutral', color: 'neutral' },
]

export const METRIC_OPTIONS_BY_SYSTEM = {
  ems: [
    { value: 'energyConsumption', label: 'Energy Consumption (kWh)', category: 'Energy' },
    { value: 'activePower',       label: 'Active Power (kW)', category: 'Power' },
    { value: 'voltage',           label: 'Voltage (V)', category: 'Power Quality' },
    { value: 'current',           label: 'Current (A)', category: 'Power Quality' },
    { value: 'powerFactor',       label: 'Power Factor', category: 'Power Quality' },
    { value: 'cost',              label: 'Energy Cost (PKR)', category: 'Financial' },
    { value: 'carbonEmissions',   label: 'Carbon Emissions (kg CO₂)', category: 'Environmental' },
    { value: 'devicesOnline',     label: 'Devices Online', category: 'System' },
    { value: 'activeAlarms',      label: 'Active Alarms', category: 'System' },
  ],
  aqms: [
    { value: 'time1',  label: 'Node Clock (time1)', category: 'System' },
    { value: 'id',     label: 'Node Identifier (id)', category: 'System' },
    { value: 'tx',     label: 'Packet Counter (tx)', category: 'System' },
    { value: 'b',      label: 'Battery (b) [%]', category: 'System' },
    { value: 't',      label: 'Ambient Temperature (t) [°C]', category: 'Microclimate' },
    { value: 'rh',     label: 'Relative Humidity (rh) [%]', category: 'Microclimate' },
    { value: 'mic_v',  label: 'Acoustic / Noise (mic_v) [dB]', category: 'Microclimate' },
    { value: 'sk',     label: 'Smoke Index (sk) [ppm]', category: 'Safety' },
    { value: 'du',     label: 'Dust Density (du) [µg/m³]', category: 'Particulates' },
    { value: 'pm1',    label: 'PM1.0 (pm1) [µg/m³]', category: 'Particulates' },
    { value: 'pm25',   label: 'PM2.5 (pm25) [µg/m³]', category: 'Particulates' },
    { value: 'pm10',   label: 'PM10 (pm10) [µg/m³]', category: 'Particulates' },
    { value: 'co2',    label: 'Carbon Dioxide (co2) [ppm]', category: 'Gases' },
    { value: 'tvoc',   label: 'Total VOC (tvoc) [ppb]', category: 'Gases' },
    { value: 'co',     label: 'Carbon Monoxide (co) [ppm]', category: 'Gases' },
    { value: 'no2',    label: 'Nitrogen Dioxide (no2) [ppb]', category: 'Gases' },
    { value: 'nh3',    label: 'Ammonia (nh3) [ppm]', category: 'Gases' },
    { value: 'oz',     label: 'Ozone (oz) [ppb]', category: 'Gases' },
    { value: 'so2',    label: 'Sulfur Dioxide (so2) [ppb]', category: 'Gases' },
    { value: 'ch4',    label: 'Methane (ch4) [ppm]', category: 'Gases' },
    { value: 'c3h8',   label: 'Propane (c3h8) [ppm]', category: 'Gases' },
    { value: 'c4h10',  label: 'Butane (c4h10) [ppm]', category: 'Gases' },
    { value: 'h2',     label: 'Hydrogen (h2) [ppm]', category: 'Gases' },
    { value: 'c2h50h', label: 'Ethanol (c2h50h) [ppm]', category: 'Gases' },
  ],
  soil: [
    { value: 'moisture',    label: 'Soil Moisture [%]', category: 'Subsurface' },
    { value: 'soilTemp',    label: 'Soil Temperature [°C]', category: 'Subsurface' },
    { value: 'airMoisture', label: 'Air Moisture [%]', category: 'Atmosphere' },
    { value: 'airTemp',     label: 'Air Temperature [°C]', category: 'Atmosphere' },
  ],
  weatherstation: [
    { value: 'time', label: 'Station Time (time)', category: 'System' },
    { value: 'id',   label: 'Station ID (id)', category: 'System' },
    { value: 'tx',   label: 'Packet Counter (tx)', category: 'System' },
    { value: 'b',    label: 'Station Battery (b) [%]', category: 'System' },
    { value: 't1',   label: 'Air Temperature (t1) [°C]', category: 'Atmosphere' },
    { value: 'rh1',  label: 'Relative Humidity (rh1) [%]', category: 'Atmosphere' },
    { value: 'p',    label: 'Barometric Pressure (p) [hPa]', category: 'Atmosphere' },
    { value: 'l1',   label: 'Solar Light (l1) [lux]', category: 'Atmosphere' },
    { value: 'ws',   label: 'Wind Speed (ws) [m/s]', category: 'Wind & Rain' },
    { value: 'wd',   label: 'Wind Direction (wd) [°]', category: 'Wind & Rain' },
    { value: 'r',    label: 'Rainfall (r) [mm/h]', category: 'Wind & Rain' },
    { value: 'co',   label: 'Carbon Monoxide (co) [ppm]', category: 'Gases' },
    { value: 'voc',  label: 'VOC Index (voc) [ppb]', category: 'Gases' },
  ],
}

// Flat list of all metrics + text panel option for universal select compatibility
export const METRIC_OPTIONS = [
  ...METRIC_OPTIONS_BY_SYSTEM.ems,
  ...METRIC_OPTIONS_BY_SYSTEM.aqms.filter(m => !METRIC_OPTIONS_BY_SYSTEM.ems.some(e => e.value === m.value)),
  ...METRIC_OPTIONS_BY_SYSTEM.soil.filter(m => !METRIC_OPTIONS_BY_SYSTEM.ems.some(e => e.value === m.value)),
  ...METRIC_OPTIONS_BY_SYSTEM.weatherstation.filter(m => !METRIC_OPTIONS_BY_SYSTEM.ems.some(e => e.value === m.value)),
  { value: '_none', label: '(No metric — text panel)', category: 'General' },
]

export function getMetricsForSystem(systemType) {
  if (systemType && METRIC_OPTIONS_BY_SYSTEM[systemType]) {
    return [
      ...METRIC_OPTIONS_BY_SYSTEM[systemType],
      { value: '_none', label: '(No metric — text panel)', category: 'General' },
    ]
  }
  return METRIC_OPTIONS
}

export const GROUP_BY_OPTIONS = [
  { value: 'none',       label: 'No grouping (single scope value)' },
  { value: 'building',   label: 'Compare Buildings' },
  { value: 'floor',      label: 'Compare Floors' },
  { value: 'department', label: 'Compare Departments' },
]

export const COLOR_THEMES = [
  { value: 'primary', label: 'Amber',  hex: '#F5A623' },
  { value: 'info',    label: 'Blue',   hex: '#2563EB' },
  { value: 'success', label: 'Green',  hex: '#16A34A' },
  { value: 'danger',  label: 'Red',    hex: '#DC2626' },
  { value: 'neutral', label: 'Slate',  hex: '#4B5563' },
]

// Starter templates offered when a user creates a brand-new dashboard.
export const DASHBOARD_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    systemType: 'all',
    description: 'Start with an empty dashboard and add custom widgets',
    widgets: [],
  },
  // EMS Templates
  {
    id: 'energy-overview',
    name: 'Energy Performance Overview',
    systemType: 'ems',
    description: 'Consumption trends, cost, power factor and live facility stats',
    widgets: [
      { type: 'stat',  title: 'Energy Consumption', metric: 'energyConsumption', groupBy: 'none', color: 'primary' },
      { type: 'stat',  title: 'Active Power',        metric: 'activePower',       groupBy: 'none', color: 'info' },
      { type: 'stat',  title: 'Energy Cost',         metric: 'cost',              groupBy: 'none', color: 'success' },
      { type: 'stat',  title: 'Active Alarms',       metric: 'activeAlarms',      groupBy: 'none', color: 'danger' },
      { type: 'line',  title: 'Energy Consumption Trend', metric: 'energyConsumption', groupBy: 'none', color: 'primary' },
      { type: 'area',  title: 'Active Power Trend',  metric: 'activePower', groupBy: 'none', color: 'info' },
      { type: 'gauge', title: 'Power Factor',        metric: 'powerFactor', groupBy: 'none', color: 'success' },
      { type: 'alarms',title: 'Recent Alarms',       metric: 'activeAlarms', groupBy: 'none', color: 'danger' },
    ],
  },
  {
    id: 'building-comparison',
    name: 'Facility Breakdown Comparison',
    systemType: 'ems',
    description: 'Compare energy & cost across buildings, floors, and departments',
    widgets: [
      { type: 'bar',  title: 'Energy Consumption by Building', metric: 'energyConsumption', groupBy: 'building', color: 'primary' },
      { type: 'bar',  title: 'Energy Cost by Building',        metric: 'cost',              groupBy: 'building', color: 'success' },
      { type: 'pie',  title: 'Consumption Share by Building',  metric: 'energyConsumption', groupBy: 'building', color: 'info' },
      { type: 'table',title: 'Device Breakdown',               metric: 'energyConsumption', groupBy: 'none',     color: 'neutral' },
    ],
  },
  {
    id: 'alarms-health',
    name: 'Alarms & System Health',
    systemType: 'ems',
    description: 'Monitor devices online, active alarms and electrical grid stability',
    widgets: [
      { type: 'stat',   title: 'Devices Online', metric: 'devicesOnline', groupBy: 'none', color: 'info' },
      { type: 'stat',   title: 'Active Alarms',  metric: 'activeAlarms',  groupBy: 'none', color: 'danger' },
      { type: 'alarms', title: 'Alarm Feed',     metric: 'activeAlarms',  groupBy: 'none', color: 'danger' },
      { type: 'line',   title: 'Voltage Trend',  metric: 'voltage',       groupBy: 'none', color: 'primary' },
      { type: 'line',   title: 'Current Trend',  metric: 'current',       groupBy: 'none', color: 'danger' },
    ],
  },
  // AQMS Templates
  {
    id: 'aqms-overview',
    name: 'Air Quality & Particulate Overview',
    systemType: 'aqms',
    description: 'Real-time PM2.5, PM10, CO₂, TVOC, and microclimate telemetry',
    widgets: [
      { type: 'stat',  title: 'PM2.5 Level',         metric: 'pm25',  groupBy: 'none', color: 'danger' },
      { type: 'stat',  title: 'Carbon Dioxide (CO₂)', metric: 'co2',   groupBy: 'none', color: 'primary' },
      { type: 'stat',  title: 'Total VOC',           metric: 'tvoc',  groupBy: 'none', color: 'info' },
      { type: 'stat',  title: 'Ambient Temperature', metric: 't',     groupBy: 'none', color: 'success' },
      { type: 'area',  title: '24h PM2.5 Trend',      metric: 'pm25',  groupBy: 'none', color: 'danger' },
      { type: 'line',  title: 'CO₂ Concentration',   metric: 'co2',   groupBy: 'none', color: 'primary' },
      { type: 'gauge', title: 'Relative Humidity',   metric: 'rh',    groupBy: 'none', color: 'info' },
      { type: 'stat',  title: 'Smoke Index (SK)',    metric: 'sk',    groupBy: 'none', color: 'neutral' },
    ],
  },
  {
    id: 'aqms-gases',
    name: 'Toxic & Ambient Gases Analysis',
    systemType: 'aqms',
    description: 'Monitor CO, NO₂, NH₃, Ozone, SO₂, and hydrocarbon concentrations',
    widgets: [
      { type: 'stat',  title: 'Carbon Monoxide (CO)', metric: 'co',   groupBy: 'none', color: 'danger' },
      { type: 'stat',  title: 'Nitrogen Dioxide (NO₂)', metric: 'no2', groupBy: 'none', color: 'primary' },
      { type: 'stat',  title: 'Ozone (O₃)',           metric: 'oz',   groupBy: 'none', color: 'info' },
      { type: 'stat',  title: 'Sulfur Dioxide (SO₂)', metric: 'so2',  groupBy: 'none', color: 'neutral' },
      { type: 'line',  title: 'CO Concentration Trend', metric: 'co', groupBy: 'none', color: 'danger' },
      { type: 'line',  title: 'NO₂ Trend',            metric: 'no2',  groupBy: 'none', color: 'primary' },
      { type: 'stat',  title: 'Methane (CH₄)',        metric: 'ch4',  groupBy: 'none', color: 'warning' },
      { type: 'stat',  title: 'Ammonia (NH₃)',        metric: 'nh3',  groupBy: 'none', color: 'success' },
    ],
  },
  // Soil Moisture Templates
  {
    id: 'soil-irrigation',
    name: 'Soil Moisture & Irrigation Health',
    systemType: 'soil',
    description: 'Subsurface probe moisture, root zone temperature, and atmospheric indicators',
    widgets: [
      { type: 'stat',  title: 'Soil Moisture',    metric: 'moisture',    groupBy: 'none', color: 'info' },
      { type: 'stat',  title: 'Soil Temperature', metric: 'soilTemp',    groupBy: 'none', color: 'primary' },
      { type: 'stat',  title: 'Air Moisture',     metric: 'airMoisture', groupBy: 'none', color: 'success' },
      { type: 'stat',  title: 'Air Temperature',  metric: 'airTemp',     groupBy: 'none', color: 'danger' },
      { type: 'area',  title: 'Soil Moisture Trend', metric: 'moisture', groupBy: 'none', color: 'info' },
      { type: 'line',  title: 'Soil Temp vs Air Temp', metric: 'soilTemp', groupBy: 'none', color: 'primary' },
      { type: 'gauge', title: 'Root Zone Moisture Level', metric: 'moisture', groupBy: 'none', color: 'info' },
    ],
  },
  // Weather Station Templates
  {
    id: 'weather-overview',
    name: 'Meteorological Summary Station',
    systemType: 'weatherstation',
    description: 'Automated weather station tracking temp, humidity, pressure, wind, and rain',
    widgets: [
      { type: 'stat',  title: 'Air Temperature',     metric: 't1',  groupBy: 'none', color: 'primary' },
      { type: 'stat',  title: 'Relative Humidity',   metric: 'rh1', groupBy: 'none', color: 'info' },
      { type: 'stat',  title: 'Wind Speed',          metric: 'ws',  groupBy: 'none', color: 'success' },
      { type: 'stat',  title: 'Rainfall Intensity',  metric: 'r',   groupBy: 'none', color: 'info' },
      { type: 'line',  title: 'Temperature & Wind Trend', metric: 't1', groupBy: 'none', color: 'primary' },
      { type: 'area',  title: 'Barometric Pressure', metric: 'p',   groupBy: 'none', color: 'neutral' },
      { type: 'gauge', title: 'Solar Light Intensity', metric: 'l1', groupBy: 'none', color: 'primary' },
      { type: 'stat',  title: 'VOC Index',           metric: 'voc', groupBy: 'none', color: 'danger' },
    ],
  },
]

export function widgetTypeMeta(type) {
  return WIDGET_TYPES.find(w => w.type === type) || WIDGET_TYPES[0]
}
