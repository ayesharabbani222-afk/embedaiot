import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import OrgDashboard from './OrgDashboard'
import GenericDeviceDashboard from '../../components/devices/GenericDeviceDashboard'

// Renders the correct dashboard at /org based on which device/product type
// was chosen on the post-login Device Selection screen. EMS keeps using the
// existing, untouched OrgDashboard exactly as it was; every other type uses
// the shared GenericDeviceDashboard with its own metric set.
export default function OrgDeviceDashboardRouter() {
  const { activeDeviceType } = useAuth()

  if (!activeDeviceType) return <Navigate to="/org/select-device" replace />
  if (activeDeviceType === 'ems') return <OrgDashboard />
  return <GenericDeviceDashboard deviceTypeId={activeDeviceType} scope="org" />
}
