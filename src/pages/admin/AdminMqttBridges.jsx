import { useState, useEffect, useMemo } from 'react'
import { io } from 'socket.io-client'
import {
  Radio, RefreshCw, Plus, Play, Square, Pencil, Trash2,
  CheckCircle2, Server, Globe, ArrowRight, Download, Filter
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput } from '../../components/ui/FormFields'
import { bridgeService } from '../../api/bridgeService'
import { orgService } from '../../api/orgService'

const initialBridges = [
  { id: 1, name: 'MQTT Bridge', org_name: 'Ambition', org_id: 1, broker_host: '51.38.88.130', broker_port: 1883, subscribe_topic: '/UploadTopic', command_topic: '/DownTopic', status: 'CONNECTED', is_active: true, message_count: 1053842 },
  { id: 2, name: 'MQTT Bridge', org_name: 'AFL', org_id: 11, broker_host: '51.38.88.130', broker_port: 1883, subscribe_topic: '/UploadTopic', command_topic: '/DownTopic', status: 'CONNECTED', is_active: true, message_count: 1163308 },
  { id: 3, name: 'MQTT Bridge', org_name: 'NUST', org_id: 4, broker_host: '51.38.88.130', broker_port: 1883, subscribe_topic: '/UploadTopic', command_topic: '/DownTopic', status: 'CONNECTED', is_active: true, message_count: 1487542 },
  { id: 4, name: 'MQTT Bridge', org_name: 'Smart Agritech Lab', org_id: 12, broker_host: '51.38.88.130', broker_port: 1883, subscribe_topic: '/UploadTopic', command_topic: '/DownTopic', status: 'CONNECTED', is_active: true, message_count: 3694208 },
]

export default function AdminMqttBridges() {
  const [data, setData] = useState(initialBridges)
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [modal, setModal] = useState(null) // 'add' | 'edit'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    name: 'MQTT Bridge',
    orgId: '',
    brokerHost: '51.38.88.130',
    brokerPort: 1883,
    subscribeTopic: '/UploadTopic',
    commandTopic: '/DownTopic',
    clientId: '',
    username: '',
    password: '',
  })

  // Load bridges from backend
  const loadBridges = async () => {
    setLoading(true)
    try {
      const res = await bridgeService.getAll()
      if (Array.isArray(res) && res.length) setData(res)
    } catch (e) {
      console.warn('Could not load bridges:', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBridges()
    orgService.getAll().then(res => {
      if (Array.isArray(res)) setOrgs(res)
    }).catch(() => {})

    // Real-time WebSocket connection for live message increments and status changes
    const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] })
    socket.on('bridge:msg', (msg) => {
      setData(prev => prev.map(b => b.id === msg.bridgeId ? { ...b, message_count: msg.messageCount } : b))
    })
    socket.on('bridge:status', (s) => {
      setData(prev => prev.map(b => b.id === s.bridgeId ? { ...b, status: s.status, is_active: s.status === 'CONNECTED' } : b))
    })

    return () => socket.disconnect()
  }, [])

  // Toggle Start / Stop
  const handleToggle = async (row) => {
    try {
      const res = await bridgeService.toggle(row.id)
      setData(prev => prev.map(b => b.id === row.id ? { ...b, status: res.status, is_active: res.isActive } : b))
    } catch (err) {
      // Optimistic fallback for UI responsiveness
      setData(prev => prev.map(b => {
        if (b.id === row.id) {
          const nextActive = !b.is_active
          return { ...b, is_active: nextActive, status: nextActive ? 'CONNECTED' : 'DISCONNECTED' }
        }
        return b
      }))
    }
  }

  // Delete
  const handleDelete = async (row) => {
    if (confirm(`Delete bridge "${row.name}" for ${row.org_name || 'Organization'}?`)) {
      try {
        await bridgeService.delete(row.id)
      } catch (e) {}
      setData(prev => prev.filter(b => b.id !== row.id))
    }
  }

  const openAdd = () => {
    setForm({
      name: 'MQTT Bridge',
      orgId: orgs[0]?.id || 1,
      brokerHost: '51.38.88.130',
      brokerPort: 1883,
      subscribeTopic: '/UploadTopic',
      commandTopic: '/DownTopic',
      clientId: '',
      username: '',
      password: '',
    })
    setModal('add')
  }

  const openEdit = (row) => {
    setSelected(row)
    setForm({
      name: row.name || 'MQTT Bridge',
      orgId: row.org_id || '',
      brokerHost: row.broker_host || '51.38.88.130',
      brokerPort: row.broker_port || 1883,
      subscribeTopic: row.subscribe_topic || '/UploadTopic',
      commandTopic: row.command_topic || '/DownTopic',
      clientId: row.client_id || '',
      username: row.username || '',
      password: row.password || '',
    })
    setModal('edit')
  }

  const handleSave = async () => {
    if (modal === 'add') {
      try {
        const created = await bridgeService.create(form)
        const orgMatch = orgs.find(o => String(o.id) === String(form.orgId))
        setData(prev => [...prev, { ...created, org_name: orgMatch?.name || 'Organization' }])
      } catch (e) {
        const orgMatch = orgs.find(o => String(o.id) === String(form.orgId))
        setData(prev => [
          ...prev,
          {
            id: Date.now(),
            ...form,
            org_name: orgMatch?.name || 'Organization',
            status: 'CONNECTED',
            is_active: true,
            message_count: 0
          }
        ])
      }
    } else {
      try {
        const updated = await bridgeService.update(selected.id, form)
        setData(prev => prev.map(b => b.id === selected.id ? { ...b, ...updated } : b))
      } catch (e) {
        setData(prev => prev.map(b => b.id === selected.id ? { ...b, ...form } : b))
      }
    }
    setModal(null)
  }

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return data
    const q = searchTerm.toLowerCase()
    return data.filter(r =>
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.org_name && r.org_name.toLowerCase().includes(q)) ||
      (r.broker_host && r.broker_host.toLowerCase().includes(q)) ||
      (r.subscribe_topic && r.subscribe_topic.toLowerCase().includes(q))
    )
  }, [data, searchTerm])

  const handleExport = () => {
    const header = ['#', 'NAME', 'ORGANIZATION', 'BROKER', 'SUBSCRIBE TOPIC', 'STATUS', 'MSGS']
    const rows = filtered.map((r, i) => [
      i + 1, r.name, r.org_name || '', `${r.broker_host}:${r.broker_port || 1883}`, r.subscribe_topic, r.status, r.message_count || 0
    ])
    const csv = [header, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'mqtt_bridges.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">MQTT Bridges</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-danger-500/10 text-danger-500 border border-danger-500/20">
              ADMIN
            </span>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">ADMIN / MQTT-BRIDGES</p>
        </div>
      </div>

      {/* ── Hero Description Card ── */}
      <div className="card p-5 border-l-4 border-l-primary-500 bg-surface-900 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-primary-400 font-mono text-base font-bold">((•))</span>
              <h2 className="text-base font-bold text-white tracking-tight">MQTT Bridges</h2>
            </div>
            <p className="text-xs text-surface-300 leading-relaxed">
              Manage the Node MQTT listener from the UI. Create a bridge, click Start, and device readings on the topic are mapped into EMS using gateway serial + template register addresses. Device ON/OFF in the dashboard also publishes to the command topic.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={loadBridges}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-surface-700 hover:bg-surface-800 text-xs font-semibold text-surface-200 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={openAdd}
              className="px-3.5 py-1.5 rounded-lg bg-info-600 hover:bg-info-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              + Add bridge
            </button>
          </div>
        </div>

        {/* ── Setup Checklist Banner ── */}
        <div className="mt-4 p-3.5 rounded-lg bg-surface-950/70 border border-surface-800/80 text-xs text-surface-300">
          <div className="font-semibold text-primary-400 mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            Setup checklist
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-surface-300 pl-1 font-mono text-[11px]">
            <li>Gateway serial number = MQTT <span className="text-white font-bold">serial_number</span></li>
            <li>Device name = MQTT <span className="text-white font-bold">device</span> field</li>
            <li>Slave names match MQTT blocks (e.g. <span className="text-white font-bold">Main</span>, <span className="text-white font-bold">EMS PANEL</span>)</li>
            <li>Template variable registerAddress = MQTT keys (e.g. <span className="text-white font-bold">40097</span>)</li>
          </ol>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-50/50 dark:bg-surface-900/30">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field text-xs py-1.5"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 text-xs font-medium text-surface-700 dark:text-surface-300 flex items-center gap-1.5"
            >
              <Download size={13} />
              Export
            </button>
          </div>
        </div>

        {/* Bridges Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-900/50 text-[11px] font-bold text-surface-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">NAME</th>
                <th className="py-3 px-4">ORGANIZATION</th>
                <th className="py-3 px-4">BROKER</th>
                <th className="py-3 px-4">SUBSCRIBE TOPIC</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">MSGS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-surface-400">
                    No MQTT bridges found. Click "+ Add bridge" above to connect one.
                  </td>
                </tr>
              ) : (
                filtered.map((row, index) => {
                  const isLive = row.is_active !== false && row.status === 'CONNECTED'
                  return (
                    <tr key={row.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-center text-surface-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-surface-900 dark:text-white">
                        {row.name || 'MQTT Bridge'}
                      </td>
                      <td className="py-3.5 px-4 text-surface-800 dark:text-surface-200 font-medium">
                        {row.org_name || 'All Organizations'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-surface-600 dark:text-surface-400 text-[11px]">
                        {row.broker_host}:{row.broker_port || 1883}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-primary-600 dark:text-primary-400 text-[11px]">
                        {row.subscribe_topic}
                      </td>
                      <td className="py-3.5 px-4">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            CONNECTED · live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-500/10 text-surface-400 border border-surface-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-surface-400"></span>
                            DISCONNECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-surface-700 dark:text-surface-200">
                        {Number(row.message_count || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggle(row)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                              isLive
                                ? 'bg-surface-800 hover:bg-surface-700 text-surface-200 border border-surface-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                            title={isLive ? 'Stop this bridge' : 'Start this bridge'}
                          >
                            {isLive ? <Square size={11} className="fill-current" /> : <Play size={11} className="fill-current" />}
                            {isLive ? 'Stop' : 'Start'}
                          </button>
                          <button
                            onClick={() => openEdit(row)}
                            className="p-1 rounded text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            title="Edit Bridge Settings"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="p-1 rounded text-surface-400 hover:text-danger-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            title="Delete Bridge"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Bridge Modal ── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Create New MQTT Bridge' : 'Edit MQTT Bridge'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setModal(null)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary text-xs">
              {modal === 'add' ? 'Create & Start' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextInput
              label="Bridge Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. MQTT Bridge"
              required
            />
            <div>
              <label className="label">Target Organization</label>
              <select
                value={form.orgId}
                onChange={(e) => setForm({ ...form, orgId: e.target.value })}
                className="input-field"
              >
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <TextInput
                label="Broker Host / IP"
                value={form.brokerHost}
                onChange={(e) => setForm({ ...form, brokerHost: e.target.value })}
                placeholder="e.g. 51.38.88.130 or localhost"
                required
              />
            </div>
            <TextInput
              label="Port"
              type="number"
              value={form.brokerPort}
              onChange={(e) => setForm({ ...form, brokerPort: parseInt(e.target.value, 10) || 1883 })}
              placeholder="1883"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextInput
              label="Subscribe Topic"
              value={form.subscribeTopic}
              onChange={(e) => setForm({ ...form, subscribeTopic: e.target.value })}
              placeholder="e.g. /UploadTopic"
              required
            />
            <TextInput
              label="Command Topic (Optional)"
              value={form.commandTopic}
              onChange={(e) => setForm({ ...form, commandTopic: e.target.value })}
              placeholder="e.g. /DownTopic"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-surface-200 dark:border-surface-800">
            <TextInput
              label="Client ID (Optional)"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              placeholder="Auto-generated if empty"
            />
            <TextInput
              label="Username (Optional)"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Broker username"
            />
            <TextInput
              label="Password (Optional)"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Broker password"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
