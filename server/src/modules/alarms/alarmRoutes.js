import { Router } from 'express'
import {
  getAlarmContacts,
  createAlarmContact,
  updateAlarmContact,
  deleteAlarmContact,
  getAlarmRules,
  createAlarmRule,
  getAlarmEvents,
  resolveAlarmEvent,
} from './alarmController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = Router()

router.use(verifyToken)

// Contacts
router.get('/contacts', getAlarmContacts)
router.post('/contacts', requireRole('admin', 'org'), createAlarmContact)
router.put('/contacts/:id', requireRole('admin', 'org'), updateAlarmContact)
router.delete('/contacts/:id', requireRole('admin', 'org'), deleteAlarmContact)

// Rules
router.get('/rules', getAlarmRules)
router.post('/rules', requireRole('admin', 'org'), createAlarmRule)

// Events / History
router.get('/events', getAlarmEvents)
router.put('/events/:id/resolve', resolveAlarmEvent)

export default router
