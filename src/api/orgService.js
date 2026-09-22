import apiClient from './client'
import { organizations as fallbackOrgs } from '../data/dummy'

export const orgService = {
  async getAll() {
    try {
      const res = await apiClient.get('/organizations')
      return res.data
    } catch (err) {
      console.warn('[OrgService] Falling back to local/cached data:', err.message)
      const saved = localStorage.getItem('cf-ems-organizations')
      return saved ? JSON.parse(saved) : fallbackOrgs
    }
  },

  async getById(id) {
    const res = await apiClient.get(`/organizations/${id}`)
    return res.data
  },

  async create(data) {
    const res = await apiClient.post('/organizations', data)
    return res.data
  },

  async update(id, data) {
    const res = await apiClient.put(`/organizations/${id}`, data)
    return res.data
  },

  async delete(id) {
    const res = await apiClient.delete(`/organizations/${id}`)
    return res.data
  },
}
