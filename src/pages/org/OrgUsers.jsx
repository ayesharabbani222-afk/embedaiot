import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { TextInput, SelectInput, CheckboxInput } from '../../components/ui/FormFields'
import { Plus, Pencil, Trash2, LogIn, Boxes } from 'lucide-react'
import { users as initialData, organizations } from '../../data/dummy'
import { useAuth, ROLES } from '../../context/AuthContext'
import { DEVICE_TYPES } from '../../data/deviceTypes'

const EMPTY_FORM = { name: '', email: '', phone: '', role: 'Customer', status: 'Active', deviceTypes: [] }

export default function OrgUsers() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const orgName = user?.name || 'Ambition'

  const [allUsers, setAllUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('cf-ems-users')
      return saved ? JSON.parse(saved) : initialData
    } catch {
      return initialData
    }
  })

  useEffect(() => {
    localStorage.setItem('cf-ems-users', JSON.stringify(allUsers))
  }, [allUsers])

  // Only this organization's users are shown/managed here
  const orgUsers = useMemo(() => allUsers.filter(u => u.org === orgName), [allUsers, orgName])

  // The device/product types available to designate to users are limited to
  // whatever this organization itself was registered with (Admin > Organizations).
  const orgDeviceTypes = useMemo(() => {
    let orgList = organizations
    try {
      const saved = localStorage.getItem('cf-ems-organizations')
      if (saved) orgList = JSON.parse(saved)
    } catch { /* ignore */ }
    const org = orgList.find(o => o.name === orgName)
    return org?.deviceTypes?.length ? org.deviceTypes : ['ems']
  }, [orgName])

  const [modal, setModal]       = useState(null) // 'add' | 'edit' | null
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)

  const openAdd  = () => { setForm({ ...EMPTY_FORM, deviceTypes: [...orgDeviceTypes] }); setModal('add') }
  const openEdit = (row) => {
    setSelected(row)
    setForm({
      name: row.name, email: row.email, phone: row.phone, role: row.role, status: row.status,
      deviceTypes: row.deviceTypes?.length ? row.deviceTypes : [...orgDeviceTypes],
    })
    setModal('edit')
  }
  const close = () => { setModal(null); setSelected(null) }

  const toggleDeviceType = (id) => {
    setForm(f => {
      const has = f.deviceTypes.includes(id)
      const next = has ? f.deviceTypes.filter(t => t !== id) : [...f.deviceTypes, id]
      return { ...f, deviceTypes: next }
    })
  }

  // Reuses the same "login as user" mechanism as the Admin Users page —
  // switches the session into that user's dashboard.
  const handleLoginAsUser = (row) => {
    login(ROLES.USER, { name: row.name, email: row.email })
    navigate('/user')
  }

  const handleSave = () => {
    if (modal === 'add') {
      setAllUsers(d => [...d, { id: Date.now(), org: orgName, ...form, createdAt: new Date().toISOString().slice(0, 10) }])
    } else {
      setAllUsers(d => d.map(r => r.id === selected.id ? { ...r, ...form } : r))
    }
    close()
  }

  const handleDelete = (row) => {
    if (confirm(`Delete user "${row.name}"?`)) setAllUsers(d => d.filter(r => r.id !== row.id))
  }

  const columns = [
    { key: 'name',  label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'role',  label: 'Role', render: v => <span className="badge badge-info">{v}</span> },
    {
      key: 'deviceTypes', label: 'Designated Devices',
      render: (v) => (
        <div className="flex flex-wrap gap-1">
          {(v?.length ? v : orgDeviceTypes).map(id => {
            const dt = DEVICE_TYPES.find(d => d.id === id)
            return dt ? <span key={id} className="badge badge-neutral">{dt.shortName}</span> : null
          })}
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: v => <span className={`badge ${v === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
    { key: 'createdAt', label: 'Creation Time' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="breadcrumb">Organization / Users</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add User
        </button>
      </div>

      <DataTable
        columns={columns}
        data={orgUsers}
        searchPlaceholder="Search users..."
        emptyMessage={`No users yet for ${orgName}. Add one to get started.`}
        actions={(row) => (
          <>
            <button className="btn-ghost p-1.5" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
            <button className="btn-danger p-1.5" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={14} /></button>
            <button
              className="btn-ghost p-1.5 text-primary-600 hover:text-primary-300"
              onClick={() => handleLoginAsUser(row)}
              title="Go to User Dashboard"
            >
              <LogIn size={14} />
            </button>
          </>
        )}
      />

      {/* Note about Operations column */}
      <p className="text-xs text-surface-600 mt-3">
        <LogIn size={11} className="inline mr-1" />
        The <span className="text-primary-600">Go to User Dashboard</span> action opens that user's dashboard (Operations column).
      </p>

      {/* Add / Edit Modal */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={close}
        title={modal === 'add' ? 'Add User' : 'Edit User'}
        footer={
          <>
            <button className="btn-secondary" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>
              {modal === 'add' ? 'Create' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Full Name" required placeholder="e.g. Miss Maryam"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextInput label="Phone Number" placeholder="+92-300-0000000"
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <TextInput label="Email Address" required type="email" placeholder="user@example.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <SelectInput label="Role" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              options={['Admin', 'Customer']} />
            <SelectInput label="Status" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={['Active', 'Inactive']} />
          </div>

          <div className="pt-3 border-t border-surface-100">
            <div className="flex items-center gap-2 mb-1.5">
              <Boxes size={14} className="text-primary-600" />
              <label className="text-xs font-bold text-surface-800 uppercase tracking-wide">Designated Devices</label>
            </div>
            <p className="text-xs text-surface-500 mb-3">
              Which of {orgName}'s device/product types should this user see first after login?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEVICE_TYPES.filter(dt => orgDeviceTypes.includes(dt.id)).map(dt => (
                <label
                  key={dt.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-left ${
                    form.deviceTypes.includes(dt.id) ? 'border-primary-500 bg-primary-100/40' : 'border-surface-200 hover:bg-surface-50'
                  }`}
                >
                  <CheckboxInput
                    checked={form.deviceTypes.includes(dt.id)}
                    onChange={() => toggleDeviceType(dt.id)}
                  />
                  <p className="text-xs font-bold text-surface-800 truncate">{dt.name}</p>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
