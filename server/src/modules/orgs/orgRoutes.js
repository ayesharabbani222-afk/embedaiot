import { Router } from 'express'
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from './orgController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = Router()

router.use(verifyToken)

router.get('/', getOrganizations)
router.get('/:id', getOrganizationById)
router.post('/', requireRole('admin'), createOrganization)
router.put('/:id', requireRole('admin', 'org'), updateOrganization)
router.delete('/:id', requireRole('admin'), deleteOrganization)

export default router
