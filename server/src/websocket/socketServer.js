import { Server } from 'socket.io'

let io = null

export function initWebSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow all origins in development or process.env.CLIENT_ORIGIN
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`)

    // Subscribe to a specific device's telemetry stream
    socket.on('subscribe:device', (deviceId) => {
      const room = `device:${deviceId}`
      socket.join(room)
      console.log(`[WebSocket] Socket ${socket.id} joined room: ${room}`)
    })

    socket.on('unsubscribe:device', (deviceId) => {
      const room = `device:${deviceId}`
      socket.leave(room)
      console.log(`[WebSocket] Socket ${socket.id} left room: ${room}`)
    })

    // Subscribe to org-level alarms and status events
    socket.on('subscribe:org', (orgId) => {
      const room = `org:${orgId}`
      socket.join(room)
      console.log(`[WebSocket] Socket ${socket.id} joined room: ${room}`)
    })

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`)
    })
  })

  console.log('[WebSocket] Server initialized successfully.')
  return io
}

export function broadcastTelemetry(deviceId, data) {
  if (!io) return
  io.to(`device:${deviceId}`).emit('telemetry:update', {
    deviceId,
    ...data,
    timestamp: new Date().toISOString(),
  })
}

export function broadcastAlarm(orgId, alarmEvent) {
  if (!io) return
  io.to(`org:${orgId}`).emit('alarm:triggered', alarmEvent)
  io.emit('alarm:global', alarmEvent) // broadcast to superadmins
}

export function broadcastDeviceStatus(deviceId, statusData) {
  if (!io) return
  io.to(`device:${deviceId}`).emit('device:status', {
    deviceId,
    ...statusData,
    timestamp: new Date().toISOString(),
  })
}
