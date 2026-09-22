import apiClient from './client'
import { historicalData as fallbackHistory, adminStats as fallbackStats } from '../data/dummy'

export const telemetryService = {
  async getHistory(deviceId, variableKey, dateFrom, dateTo) {
    try {
      const res = await apiClient.get('/telemetry/history', {
        params: { deviceId, variableKey, dateFrom, dateTo },
      })
      return res.data?.length ? res.data : fallbackHistory
    } catch (err) {
      console.warn('[TelemetryService] Falling back to historical mockup:', err.message)
      return fallbackHistory
    }
  },

  async getLatest(deviceId) {
    try {
      const res = await apiClient.get(`/telemetry/latest/${deviceId}`)
      return res.data
    } catch (err) {
      return null
    }
  },

  async getStats() {
    try {
      const res = await apiClient.get('/telemetry/stats')
      return res.data
    } catch (err) {
      return fallbackStats
    }
  },
}
