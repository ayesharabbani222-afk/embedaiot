import { Router } from 'express'
import { getUsers, createUser, updateUser, deleteUser } from './userController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = Router()

router.use(verifyToken)

router.get('/', getUsers)
router.post('/', requireRole('admin', 'org'), createUser)
router.put('/:id', requireRole('admin', 'org'), updateUser)
router.delete('/:id', requireRole('admin', 'org'), deleteUser)

export default router
