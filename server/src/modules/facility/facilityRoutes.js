import { Router } from 'express'
import { getFacilityTree, syncFacilityTree } from './facilityController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = Router()

router.use(verifyToken)

router.get('/', getFacilityTree)
router.post('/sync', requireRole('admin', 'org'), syncFacilityTree)

export default router
