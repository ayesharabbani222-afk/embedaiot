import http from 'http'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import { testDbConnection } from './config/db.js'
import { initWebSocketServer } from './websocket/socketServer.js'
import { initMqttSubscriber } from './iot/mqttSubscriber.js'
import { startDeviceSimulator } from './simulator/deviceSimulator.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// Route Imports
import authRoutes from './modules/auth/authRoutes.js'
import orgRoutes from './modules/orgs/orgRoutes.js'
import userRoutes from './modules/users/userRoutes.js'
import gatewayRoutes from './modules/gateways/gatewayRoutes.js'
import deviceRoutes from './modules/devices/deviceRoutes.js'
import templateRoutes from './modules/templates/templateRoutes.js'
import facilityRoutes from './modules/facility/facilityRoutes.js'
import alarmRoutes from './modules/alarms/alarmRoutes.js'
import dashboardRoutes from './modules/dashboards/dashboardRoutes.js'
import telemetryRoutes from './modules/telemetry/telemetryRoutes.js'
import bridgeRoutes from './modules/bridges/bridgeRoutes.js'
import { initAllBridges } from './modules/bridges/bridgeManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5000

// ── Global Middlewares ──
app.use(cors({
  origin: '*', // Allows Vite frontend on localhost:5173
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Embed AIoT (CF Smart EMS) API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── API Routes ──
app.use('/api/auth', authRoutes)
app.use('/api/organizations', orgRoutes)
app.use('/api/users', userRoutes)
app.use('/api/gateways', gatewayRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/facility', facilityRoutes)
app.use('/api/alarms', alarmRoutes)
app.use('/api/dashboards', dashboardRoutes)
app.use('/api/telemetry', telemetryRoutes)
app.use('/api/bridges', bridgeRoutes)

// ── Error Handlers ──
app.use(notFoundHandler)
app.use(errorHandler)

// ── Server Bootstrap ──
async function bootstrap() {
  console.log('=====================================================')
  console.log('  Embed AIoT — Industrial EMS Production Backend     ')
  console.log('=====================================================')

  // 1. Initialize WebSockets
  const io = initWebSocketServer(server)

  // 2. Test PostgreSQL / TimescaleDB Connection
  await testDbConnection()

  // 3. Initialize MQTT Broker Connection
  initMqttSubscriber()

  // 4. Initialize Active In-Dashboard MQTT Bridges
  await initAllBridges(io)

  // 5. Start Background IoT Simulator (if enabled)
  if (process.env.ENABLE_DEVICE_SIMULATOR !== 'false') {
    const interval = parseInt(process.env.SIMULATOR_INTERVAL_MS || '3000', 10)
    startDeviceSimulator(interval)
  }

  // 5. Start Listening
  server.listen(PORT, () => {
    console.log(`[HTTP Server] Listening on http://localhost:${PORT}`)
    console.log(`[API Ready] Health check at: http://localhost:${PORT}/api/health`)
  })
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
