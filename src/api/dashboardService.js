// ─────────────────────────────────────────────────────────────────────────────
// Custom Dashboards API Client Service
// Integrates React frontend with PostgreSQL backend via Express /api/dashboards
// Provides automatic fallback to localStorage when backend is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = '/api/dashboards'

function getAuthHeader() {
  try {
    const token = localStorage.getItem('cf-ems-token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export async function fetchRemoteDashboards(orgId = null, dashboardType = null) {
  try {
    const params = new URLSearchParams()
    if (orgId) params.append('orgId', orgId)
    if (dashboardType && dashboardType !== 'all') params.append('dashboardType', dashboardType)

    const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })

    if (!res.ok) {
      return null
    }
    const data = await res.json()
    return Array.isArray(data) ? data : null
  } catch {
    // Network offline / fallback
    return null
  }
}

export async function fetchRemoteDashboardById(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function persistRemoteDashboard(dashboard) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        id: dashboard.id,
        title: dashboard.name,
        description: dashboard.description,
        dashboardType: dashboard.dashboardType || 'ems',
        targetDevice: dashboard.targetDevice || null,
        layoutConfig: dashboard.layout || [],
        widgets: dashboard.widgets || [],
        isDefault: !!dashboard.isDefault,
        orgId: dashboard.orgId || undefined,
      }),
    })

    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function deleteRemoteDashboard(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    })
    return res.ok
  } catch {
    return false
  }
}
