import { Router } from 'express'
import {
  getBridges,
  createBridge,
  updateBridge,
  deleteBridge,
  toggleBridge,
} from './bridgeController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = Router()

router.use(verifyToken)

router.get('/', getBridges)
router.post('/', requireRole('admin'), createBridge)
router.put('/:id', requireRole('admin'), updateBridge)
router.delete('/:id', requireRole('admin'), deleteBridge)
router.post('/:id/toggle', requireRole('admin'), toggleBridge)

export default router
