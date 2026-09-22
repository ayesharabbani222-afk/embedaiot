import { Router } from 'express'
import {
  getHistoricalTelemetry,
  getLatestTelemetry,
  getDashboardStats,
  ingestTelemetry,
} from './telemetryController.js'
import { verifyToken } from '../../middleware/auth.js'

const router = Router()

// Direct HTTP ingest can be authenticated or unauthenticated from internal network
router.post('/ingest', ingestTelemetry)

router.use(verifyToken)

router.get('/history', getHistoricalTelemetry)
router.get('/latest/:deviceId', getLatestTelemetry)
router.get('/stats', getDashboardStats)

export default router
