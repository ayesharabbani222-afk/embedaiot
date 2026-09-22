import { Router } from 'express'
import {
  getDashboards,
  getDashboardById,
  saveDashboard,
  deleteDashboard,
} from './dashboardController.js'
import { verifyToken } from '../../middleware/auth.js'

const router = Router()

router.use(verifyToken)

router.get('/', getDashboards)
router.get('/:id', getDashboardById)
router.post('/', saveDashboard)
router.put('/:id', saveDashboard)
router.delete('/:id', deleteDashboard)

export default router
