import { Router } from 'express'
import {
  getGateways,
  createGateway,
  updateGateway,
  deleteGateway,
  gatewayHeartbeat,
} from './gatewayController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = Router()

// Heartbeat can be called unauthenticated by edge gateway using serial
router.post('/:serial/heartbeat', gatewayHeartbeat)

router.use(verifyToken)

router.get('/', getGateways)
router.post('/', requireRole('admin', 'org'), createGateway)
router.put('/:id', requireRole('admin', 'org'), updateGateway)
router.delete('/:id', requireRole('admin', 'org'), deleteGateway)

export default router
