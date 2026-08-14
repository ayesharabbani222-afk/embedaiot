import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { DEVICE_TYPES } from '../data/deviceTypes'
import { ArrowRight, ChevronRight, LogOut, Sun, Moon } from 'lucide-react'

export default function DeviceTypeSelection() {
  const { user, activeDeviceType, setActiveDeviceType, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const assignedIds = user?.deviceTypes?.length ? user.deviceTypes : ['ems']
  const options = DEVICE_TYPES.filter(dt => assignedIds.includes(dt.id))
  const role = user?.role || 'org'

  const handleSelect = (deviceTypeId) => {
    setActiveDeviceType(deviceTypeId)
    navigate(`/${role}`)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col transition-colors duration-200">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-150 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white dark:bg-surface-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden p-1 shadow-sm border border-surface-200 dark:border-surface-800">
            <img src="/embedaiot_logo.svg" alt="Embed AIoT" className="w-full h-full object-contain" />
          </div>
          <p className="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-wide uppercase">
            Embed AIoT
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-surface-800 dark:hover:text-surface-100 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600 mb-2">
              {user?.name}
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
              Select a device/product to continue
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-2 max-w-xl mx-auto">
              {role === 'org'
                ? "These are the device categories registered to your organization. Choose one to open its dashboard."
                : 'These are the device categories designated to you. Choose one to open its dashboard.'}
            </p>
          </div>

          {options.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-surface-300 dark:border-surface-700 rounded-2xl">
              <p className="text-sm text-surface-500">
                No device types have been assigned yet. Contact your administrator.
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 ${options.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {options.map(dt => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => handleSelect(dt.id)}
                  className={`group text-left p-5 rounded-2xl border bg-white dark:bg-surface-900 hover:shadow-floating transition-all duration-150 active:scale-[0.98] ${
                    activeDeviceType === dt.id
                      ? 'border-primary-500 ring-2 ring-primary-500/20'
                      : 'border-surface-200 dark:border-surface-800 hover:border-primary-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-primary-100/50 border border-primary-500/20 text-primary-600`}>
                      <dt.icon size={20} />
                    </div>
                    <ChevronRight size={16} className="text-surface-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                  <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 leading-tight">
                    {dt.name}
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1.5 leading-relaxed">
                    {dt.description}
                  </p>
                  {dt.provisional && (
                    <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wide text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">
                      Coming soon
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary-600 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open dashboard <ArrowRight size={12} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
