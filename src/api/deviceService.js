import apiClient from './client'
import { devices as fallbackDevices } from '../data/dummy'

export const deviceService = {
  async getAll() {
    try {
      const res = await apiClient.get('/devices')
      return res.data
    } catch (err) {
      console.warn('[DeviceService] Falling back to local data:', err.message)
      const saved = localStorage.getItem('cf-ems-devices')
      return saved ? JSON.parse(saved) : fallbackDevices
    }
  },

  async getById(id) {
    const res = await apiClient.get(`/devices/${id}`)
    return res.data
  },

  async create(data) {
    const res = await apiClient.post('/devices', data)
    return res.data
  },

  async update(id, data) {
    const res = await apiClient.put(`/devices/${id}`, data)
    return res.data
  },

  async delete(id) {
    const res = await apiClient.delete(`/devices/${id}`)
    return res.data
  },

  async toggleSwitch(id, switchOn) {
    const res = await apiClient.post(`/devices/${id}/switch`, { switchOn })
    return res.data
  },
}
