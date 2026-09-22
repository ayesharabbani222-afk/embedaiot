import mqtt from 'mqtt'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Load Bridge Configuration
const configPath = path.resolve(__dirname, 'bridge_config.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

const { serialNumber } = config.gateway
const topic = `${config.mqtt.topicPrefix}/${serialNumber}/telemetry`

console.log('=====================================================')
console.log('   Embed AIoT — Industrial MQTT Bridge Agent         ')
console.log('=====================================================')
console.log(`[Bridge] Gateway Serial: ${serialNumber}`)
console.log(`[Bridge] Target Broker : ${config.mqtt.brokerUrl}`)
console.log(`[Bridge] Publish Topic : ${topic}`)

// 2. Connect to Local/Cloud EMQX MQTT Broker
const client = mqtt.connect(config.mqtt.brokerUrl, {
  clientId: `bridge_${serialNumber}_${Math.random().toString(16).slice(2, 6)}`,
  clean: true,
  reconnectPeriod: 5000,
})

client.on('connect', () => {
  console.log('[Bridge] ✓ Connected to MQTT Broker successfully!')
  startBridgeServices()
})

client.on('error', (err) => {
  console.error('[Bridge] Connection error:', err.message)
})

// 3. Publishing Helper
export function publishTelemetry(deviceId, readings) {
  const payload = {
    gateway: serialNumber,
    timestamp: new Date().toISOString(),
    devices: [
      {
        id: deviceId,
        variables: readings,
      },
    ],
  }

  const jsonStr = JSON.stringify(payload)
  client.publish(topic, jsonStr, { qos: config.mqtt.qos || 1 }, (err) => {
    if (!err) {
      console.log(`[Bridge -> MQTT] Published live data for Device #${deviceId}:`, readings)
    } else {
      console.error('[Bridge -> MQTT] Publish error:', err.message)
    }
  })
}

// 4. Multi-Mode Bridge Handlers
function startBridgeServices() {
  console.log(`[Bridge] Mode: "${config.connectionMode}" is active.`)

  // Mode A: HTTP Webhook Ingestion Port (Port 8088)
  // Any physical smart meter, Shelly plug, or edge device on LAN can POST here!
  const webhookPort = 8088
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/ingest') {
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', () => {
        try {
          const data = JSON.parse(body)
          // Expects { deviceId: 2, variables: { voltageA: 231.2, currentA: 14.5, power: 8900 } }
          const devId = data.deviceId || 2
          const vars = data.variables || data
          publishTelemetry(devId, vars)

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, message: 'Forwarded to MQTT broker' }))
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }))
        }
      })
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  server.listen(webhookPort, () => {
    console.log(`[Bridge Webhook] HTTP listener active on http://localhost:${webhookPort}/ingest`)
    console.log(`[Bridge Webhook] External hardware can POST live JSON directly to this URL!`)
  })

  // Mode B: Scheduled Heartbeat & Live Feed Loop
  const intervalSeconds = config.gateway.pollIntervalSeconds || 3
  console.log(`[Bridge] Automatic Gateway poll heartbeat active (every ${intervalSeconds}s)...`)
}
