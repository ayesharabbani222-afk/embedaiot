import apiClient from './client'

const fallbackBridges = [
  { id: 1, name: 'MQTT Bridge', org_name: 'Ambition', broker_host: '51.38.88.130', broker_port: 1883, subscribe_topic: '/UploadTopic', status: 'CONNECTED', is_active: true, message_count: 1053842 },
  { id: 2, name: 'MQTT Bridge', org_name: 'AFL', broker_host: '51.38.88.130', broker_port: 1883, subscribe_topic: '/UploadTopic', status: 'CONNECTED', is_active: true, message_count: 1163308 },
  { id: 3, name: 'MQTT Bridge', org_name: 'NUST', broker_host: '51.38.88.130', broker_port: 1883, subscribe_topic: '/UploadTopic', status: 'CONNECTED', is_active: true, message_count: 1487542 },
  { id: 4, name: 'MQTT Bridge', org_name: 'Smart Agritech Lab', broker_host: '51.38.88.130', broker_port: 1883, subscribe_topic: '/UploadTopic', status: 'CONNECTED', is_active: true, message_count: 3694208 },
]

export const bridgeService = {
  async getAll() {
    try {
      const res = await apiClient.get('/bridges')
      return res.data?.length ? res.data : fallbackBridges
    } catch (err) {
      console.warn('[BridgeService] Using fallback data:', err.message)
      return fallbackBridges
    }
  },

  async create(data) {
    const res = await apiClient.post('/bridges', data)
    return res.data
  },

  async update(id, data) {
    const res = await apiClient.put(`/bridges/${id}`, data)
    return res.data
  },

  async delete(id) {
    const res = await apiClient.delete(`/bridges/${id}`)
    return res.data
  },

  async toggle(id) {
    const res = await apiClient.post(`/bridges/${id}/toggle`)
    return res.data
  },
}
