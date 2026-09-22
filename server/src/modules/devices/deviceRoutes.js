import { Router } from 'express'
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  toggleDeviceSwitch,
} from './deviceController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = Router()

router.use(verifyToken)

router.get('/', getDevices)
router.get('/:id', getDeviceById)
router.post('/', requireRole('admin', 'org'), createDevice)
router.put('/:id', requireRole('admin', 'org'), updateDevice)
router.delete('/:id', requireRole('admin', 'org'), deleteDevice)
router.post('/:id/switch', requireRole('admin', 'org'), toggleDeviceSwitch)

export default router
