import { Router } from 'express'
import {
  getTemplates,
  getTemplateDetail,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  addSlave,
  saveSlaveVariables,
} from './templateController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = Router()

router.use(verifyToken)

router.get('/', getTemplates)
router.get('/:id', getTemplateDetail)
router.post('/', requireRole('admin', 'org'), createTemplate)
router.put('/:id', requireRole('admin', 'org'), updateTemplate)
router.delete('/:id', requireRole('admin', 'org'), deleteTemplate)

// Slaves & Variables sub-routes
router.post('/:templateId/slaves', requireRole('admin', 'org'), addSlave)
router.post('/slaves/:slaveId/variables', requireRole('admin', 'org'), saveSlaveVariables)

export default router
