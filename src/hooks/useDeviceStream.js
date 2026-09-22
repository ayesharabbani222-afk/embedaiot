import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000'

export function useDeviceStream(deviceId) {
  const [liveReadings, setLiveReadings] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!deviceId) return

    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('subscribe:device', deviceId)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('telemetry:update', (payload) => {
      if (String(payload.deviceId) === String(deviceId)) {
        setLiveReadings(payload)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    })

    return () => {
      socket.emit('unsubscribe:device', deviceId)
      socket.disconnect()
    }
  }, [deviceId])

  return { liveReadings, lastUpdated, isConnected }
}
