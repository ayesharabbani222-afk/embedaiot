import { createContext, useContext, useState } from 'react'
import { organizations, users } from '../data/dummy'
import { DEFAULT_DEVICE_TYPES } from '../data/deviceTypes'

const AuthContext = createContext(null)

export const ROLES = {
  ADMIN: 'admin',
  ORG:   'org',
  USER:  'user',
}

const ACTIVE_DEVICE_TYPE_KEY = 'cf-ems-active-device-type'

// Looks up which device/product types a logging-in org or user has been
// assigned, checking localStorage first (so Admin/Org edits made in this
// session are respected) and falling back to the dummy data / defaults.
function resolveDeviceTypes(role, profile) {
  if (role === ROLES.ORG) {
    let orgList = organizations
    try {
      const saved = localStorage.getItem('cf-ems-organizations')
      if (saved) orgList = JSON.parse(saved)
    } catch { /* ignore, fall back to dummy data */ }
    const org = orgList.find(o => o.name === profile.name)
    return org?.deviceTypes?.length ? org.deviceTypes : DEFAULT_DEVICE_TYPES
  }
  if (role === ROLES.USER) {
    let userList = users
    try {
      const saved = localStorage.getItem('cf-ems-users')
      if (saved) userList = JSON.parse(saved)
    } catch { /* ignore, fall back to dummy data */ }
    const match = userList.find(u => u.email === profile.email)
    if (match?.deviceTypes?.length) return match.deviceTypes
    // Fall back to the parent org's device types if the user has none set
    if (match?.org) {
      let orgList = organizations
      try {
        const saved = localStorage.getItem('cf-ems-organizations')
        if (saved) orgList = JSON.parse(saved)
      } catch { /* ignore */ }
      const org = orgList.find(o => o.name === match.org)
      if (org?.deviceTypes?.length) return org.deviceTypes
    }
    return DEFAULT_DEVICE_TYPES
  }
  return []
}

export function AuthProvider({ children }) {
  const getBuildUser = () => {
    if (typeof window !== 'undefined' && window.__BONEYARD_BUILD) {
      const path = window.location.pathname
      if (path.startsWith('/admin')) {
        return { name: 'App Admin', email: 'appadmin@yopmail.com', role: ROLES.ADMIN }
      }
      if (path.startsWith('/org')) {
        return { name: 'Ambition', email: 'org@cfsmartems.com', role: ROLES.ORG }
      }
      if (path.startsWith('/user')) {
        return { name: 'Miss Maryam', email: 'maryam@delicia.com', role: ROLES.USER }
      }
    }
    return null
  }

  const [user, setUser] = useState(() => {
    const built = getBuildUser()
    if (!built) return null
    return { ...built, deviceTypes: resolveDeviceTypes(built.role, built) }
  })

  const [activeDeviceType, setActiveDeviceTypeState] = useState(() => {
    try { return localStorage.getItem(ACTIVE_DEVICE_TYPE_KEY) || null } catch { return null }
  })

  const setActiveDeviceType = (deviceTypeId) => {
    setActiveDeviceTypeState(deviceTypeId)
    try {
      if (deviceTypeId) localStorage.setItem(ACTIVE_DEVICE_TYPE_KEY, deviceTypeId)
      else localStorage.removeItem(ACTIVE_DEVICE_TYPE_KEY)
    } catch { /* ignore */ }
  }

  const login = (role, overrideProfile) => {
    const profiles = {
      [ROLES.ADMIN]: { name: 'App Admin',       email: 'appadmin@yopmail.com', role: ROLES.ADMIN },
      [ROLES.ORG]:   { name: 'Ambition', email: 'org@cfsmartems.com',  role: ROLES.ORG   },
      [ROLES.USER]:  { name: 'Miss Maryam',     email: 'maryam@delicia.com',    role: ROLES.USER  },
    }
    const profile = overrideProfile ? { ...profiles[role], ...overrideProfile, role } : profiles[role]
    const deviceTypes = resolveDeviceTypes(role, profile)
    setUser({ ...profile, deviceTypes })
    // Force the Device/Product Selection screen again on every fresh login
    setActiveDeviceType(null)
  }

  const logout = () => {
    setUser(null)
    setActiveDeviceType(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, activeDeviceType, setActiveDeviceType }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
