import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import UserDashboard from './UserDashboard'
import GenericDeviceDashboard from '../../components/devices/GenericDeviceDashboard'

// Renders the correct dashboard at /user based on which device/product type
// was chosen on the post-login Device Selection screen. EMS keeps using the
// existing, untouched UserDashboard exactly as it was; every other type uses
// the shared GenericDeviceDashboard with its own metric set.
export default function UserDeviceDashboardRouter() {
  const { activeDeviceType } = useAuth()

  if (!activeDeviceType) return <Navigate to="/user/select-device" replace />
  if (activeDeviceType === 'ems') return <UserDashboard />
  return <GenericDeviceDashboard deviceTypeId={activeDeviceType} scope="user" />
}
