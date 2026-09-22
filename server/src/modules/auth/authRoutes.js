import { Router } from 'express'
import { login, getMe, impersonate } from './authController.js'
import { verifyToken } from '../../middleware/auth.js'

const router = Router()

router.post('/login', login)
router.get('/me', verifyToken, getMe)
router.post('/impersonate', verifyToken, impersonate)

export default router
