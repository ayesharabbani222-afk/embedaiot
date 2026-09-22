import { createContext, useContext, useState, useEffect } from 'react'
import { organizations, users } from '../data/dummy'
import { DEFAULT_DEVICE_TYPES } from '../data/deviceTypes'
import { authService } from '../api/authService'

const AuthContext = createContext(null)

export const ROLES = {
  ADMIN: 'admin',
  ORG:   'org',
  USER:  'user',
}

const ACTIVE_DEVICE_TYPE_KEY = 'cf-ems-active-device-type'
const USER_SESSION_KEY = 'cf-ems-user-session'

function resolveDeviceTypes(role, profile) {
  if (profile?.deviceTypes?.length) return profile.deviceTypes
  if (role === ROLES.ORG) {
    let orgList = organizations
    try {
      const saved = localStorage.getItem('cf-ems-organizations')
      if (saved) orgList = JSON.parse(saved)
    } catch { /* ignore */ }
    const org = orgList.find(o => o.name === profile?.name)
    return org?.deviceTypes?.length ? org.deviceTypes : DEFAULT_DEVICE_TYPES
  }
  if (role === ROLES.USER) {
    let userList = users
    try {
      const saved = localStorage.getItem('cf-ems-users')
      if (saved) userList = JSON.parse(saved)
    } catch { /* ignore */ }
    const match = userList.find(u => u.email === profile?.email)
    if (match?.deviceTypes?.length) return match.deviceTypes
    return DEFAULT_DEVICE_TYPES
  }
  return DEFAULT_DEVICE_TYPES
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_SESSION_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
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

  // Fast demo / role-based login (keeps existing instant-demo cards working)
  const login = (role, overrideProfile) => {
    const profiles = {
      [ROLES.ADMIN]: { name: 'App Admin',       email: 'appadmin@yopmail.com', role: ROLES.ADMIN },
      [ROLES.ORG]:   { name: 'Ambition', email: 'org@cfsmartems.com',  role: ROLES.ORG   },
      [ROLES.USER]:  { name: 'Miss Maryam',     email: 'maryam@delicia.com',    role: ROLES.USER  },
    }
    const profile = overrideProfile ? { ...profiles[role], ...overrideProfile, role } : profiles[role]
    const deviceTypes = resolveDeviceTypes(role, profile)
    const finalUser = { ...profile, deviceTypes }
    setUser(finalUser)
    try { localStorage.setItem(USER_SESSION_KEY, JSON.stringify(finalUser)) } catch {}
    setActiveDeviceType(null)
  }

  // Real backend authentication (JWT + PostgreSQL verify)
  const loginWithCredentials = async (email, password) => {
    try {
      const data = await authService.login(email, password)
      const userProfile = {
        ...data.user,
        deviceTypes: data.user.deviceTypes?.length ? data.user.deviceTypes : DEFAULT_DEVICE_TYPES,
      }
      setUser(userProfile)
      try { localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userProfile)) } catch {}
      setActiveDeviceType(null)
      return { success: true, user: userProfile }
    } catch (err) {
      // If backend is not running, fallback to demo check
      if (password === 'password123') {
        if (email.includes('admin')) { login(ROLES.ADMIN); return { success: true } }
        if (email.includes('org')) { login(ROLES.ORG); return { success: true } }
        login(ROLES.USER); return { success: true }
      }
      throw err
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setActiveDeviceType(null)
    try {
      localStorage.removeItem(USER_SESSION_KEY)
      localStorage.removeItem(ACTIVE_DEVICE_TYPE_KEY)
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, login, loginWithCredentials, logout, activeDeviceType, setActiveDeviceType }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
