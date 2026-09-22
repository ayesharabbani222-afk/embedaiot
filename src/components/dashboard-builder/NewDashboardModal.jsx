import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import { LayoutTemplate, Cpu, Layers, Activity, Wind, Sprout, Zap, Globe } from 'lucide-react'
import { DASHBOARD_TEMPLATES, SYSTEM_TYPES } from '../../data/widgetCatalog'
import { devices as allDevices } from '../../data/dummy'
import { useCustomDashboards } from '../../context/CustomDashboardContext'

const SYSTEM_ICONS = {
  ems: Zap,
  aqms: Activity,
  soil: Sprout,
  weatherstation: Wind,
  unified: Globe,
}

export default function NewDashboardModal({ open, onClose, onCreate }) {
  const [systemType, setSystemType] = useState('ems')
  const [templateId, setTemplateId] = useState('blank')
  const [name, setName] = useState('')
  const [targetDevice, setTargetDevice] = useState('')
  
  // Resolve orgKey from our custom dashboards context
  const { orgKey } = useCustomDashboards()

  // Filter devices belonging to this organization and matching system if applicable
  const orgDevices = useMemo(() => {
    const orgFiltered = allDevices.filter(d => d.org === orgKey)
    if (systemType === 'unified' || systemType === 'all') return orgFiltered
    const matching = orgFiltered.filter(d => d.deviceType === systemType)
    return matching.length > 0 ? matching : orgFiltered
  }, [orgKey, systemType])

  // Filter templates matching the chosen system type
  const availableTemplates = useMemo(() => {
    return DASHBOARD_TEMPLATES.filter(t => t.systemType === 'all' || t.systemType === systemType)
  }, [systemType])

  function handleSystemSelect(type) {
    setSystemType(type)
    setTemplateId('blank')
    setTargetDevice('')
  }

  function handleCreate() {
    onCreate(templateId, name.trim(), targetDevice || null, systemType)
    setName('')
    setSystemType('ems')
    setTemplateId('blank')
    setTargetDevice('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New Custom Dashboard" size="lg" footer={
      <>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={handleCreate}>Create Dashboard</button>
      </>
    }>
      <div className="space-y-5">
        {/* Desired Dashboard / System Type Selector */}
        <div>
          <label className="label flex items-center gap-1.5">
            <Layers size={14} className="text-primary-600" />
            <span>Desired Dashboard / Target System</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {SYSTEM_TYPES.map(sys => {
              const Icon = SYSTEM_ICONS[sys.id] || Layers
              const active = systemType === sys.id
              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => handleSystemSelect(sys.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20 shadow-sm'
                      : 'border-surface-200 dark:border-surface-750 hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'} />
                  <span className="text-xs font-bold leading-tight">{sys.shortName}</span>
                  <span className="text-[10px] text-surface-400 leading-none">{sys.id === 'unified' ? 'Cross-System' : 'System'}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-surface-400 mt-1.5">
            Select your desired system to filter available widgets, starter templates, and associated device nodes.
          </p>
        </div>

        <div>
          <label className="label">Dashboard Name</label>
          <input
            className="input"
            placeholder={`e.g. ${systemType.toUpperCase()} Facilities Overview`}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <Cpu size={14} className="text-primary-600" />
            <span>Target Device / Asset Association</span>
            <span className="text-[10px] text-surface-400 font-normal ml-1">(Optional)</span>
          </label>
          <select
            className="select"
            value={targetDevice}
            onChange={e => setTargetDevice(e.target.value)}
          >
            <option value="">All Devices / Shared Portfolio Dashboard</option>
            {orgDevices.map(d => (
              <option key={d.id} value={d.name}>
                {d.name} ({d.gateway || d.deviceType || 'Node'} — {d.status})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-surface-400 mt-1 leading-relaxed">
            Link this dashboard to a specific {systemType.toUpperCase()} device. Widgets will automatically filter and display telemetry data for this node.
          </p>
        </div>

        <div>
          <label className="label">Start From a Template ({availableTemplates.length})</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableTemplates.map(t => {
              const active = templateId === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    active ? 'border-primary-500 bg-primary-100/40 dark:bg-primary-950/30' : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <LayoutTemplate size={14} className={active ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'} />
                    <span className="text-xs font-bold text-surface-800 dark:text-surface-200">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-relaxed line-clamp-2">{t.description}</p>
                  <p className="text-[10px] text-surface-400 mt-1.5 font-semibold uppercase tracking-wide">{t.widgets.length} widgets</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
