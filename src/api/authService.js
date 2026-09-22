import apiClient from './client'

export const authService = {
  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password })
    if (res.data.token) {
      localStorage.setItem('cf-ems-token', res.data.token)
    }
    return res.data
  },

  async getMe() {
    const res = await apiClient.get('/auth/me')
    return res.data
  },

  async impersonate(targetUserId, targetOrgId) {
    const res = await apiClient.post('/auth/impersonate', { targetUserId, targetOrgId })
    if (res.data.token) {
      localStorage.setItem('cf-ems-token', res.data.token)
    }
    return res.data
  },

  logout() {
    localStorage.removeItem('cf-ems-token')
  },
}
