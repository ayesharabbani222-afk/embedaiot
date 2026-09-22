import { processIncomingTelemetry } from '../iot/mqttSubscriber.js'
import { isConnected } from '../config/db.js'

let simulatorInterval = null

export function startDeviceSimulator(intervalMs = 3000) {
  if (simulatorInterval) return
  console.log(`[Simulator] Starting real-time IoT device simulation (interval: ${intervalMs}ms)...`)

  let tick = 0

  simulatorInterval = setInterval(async () => {
    tick++
    const sinWave = Math.sin(tick * 0.1)

    // Device 1 & 2: Main Wapda & CF Smart Panel (EMS 3-Phase)
    const baseVoltage = 225 + sinWave * 6
    const baseCurrent = 15 + Math.cos(tick * 0.1) * 4
    const power = (baseVoltage * baseCurrent * 0.95 * 3).toFixed(1)
    const powerFactor = (0.92 + sinWave * 0.05).toFixed(2)

    const emsTelemetry = {
      deviceId: 2,
      variables: {
        voltageA: parseFloat(baseVoltage.toFixed(1)),
        voltageB: parseFloat((baseVoltage - 1.5).toFixed(1)),
        voltageC: parseFloat((baseVoltage + 2.1).toFixed(1)),
        currentA: parseFloat(baseCurrent.toFixed(2)),
        power: parseFloat(power),
        powerFactor: parseFloat(powerFactor),
        energyConsumption: Math.floor(12450 + tick * 0.2),
      },
    }

    // Device 200: AFL - AQMS Ground Floor (Air Quality Station - 24 Variables)
    const aqmsTelemetry = {
      deviceId: 200,
      variables: {
        time1: new Date().toTimeString().split(' ')[0],
        id: 'AQMS-01',
        tx: 1420 + tick * 3,
        t: parseFloat((25.4 + sinWave * 2).toFixed(1)),
        rh: parseFloat((54.2 + Math.cos(tick * 0.05) * 6).toFixed(1)),
        sk: parseFloat((0.08 + Math.abs(sinWave) * 0.05).toFixed(2)),
        oz: Math.floor(28 + Math.abs(sinWave) * 12),
        so2: Math.floor(12 + Math.abs(sinWave) * 8),
        du: Math.floor(45 + Math.abs(sinWave) * 20),
        pm1: parseFloat((12.4 + sinWave * 3).toFixed(1)),
        pm25: parseFloat((24.8 + sinWave * 6).toFixed(1)),
        pm10: parseFloat((42.5 + sinWave * 8).toFixed(1)),
        co2: Math.floor(435 + Math.abs(sinWave) * 65),
        tvoc: Math.floor(145 + Math.abs(sinWave) * 40),
        co: parseFloat((0.85 + Math.abs(sinWave) * 0.4).toFixed(2)),
        no2: Math.floor(18 + Math.abs(sinWave) * 9),
        nh3: parseFloat((0.42 + Math.abs(sinWave) * 0.15).toFixed(2)),
        c3h8: parseFloat((0.12 + Math.abs(sinWave) * 0.06).toFixed(2)),
        c4h10: parseFloat((0.10 + Math.abs(sinWave) * 0.05).toFixed(2)),
        ch4: parseFloat((1.45 + Math.abs(sinWave) * 0.35).toFixed(2)),
        h2: parseFloat((0.08 + Math.abs(sinWave) * 0.04).toFixed(2)),
        c2h50h: parseFloat((0.15 + Math.abs(sinWave) * 0.08).toFixed(2)),
        b: 98,
        mic_v: parseFloat((48.2 + Math.abs(sinWave) * 6.5).toFixed(1)),
      },
    }

    // Device 202: AFL - Soil Probe Field A (4 Variables: moisture, soilTemp, airMoisture, airTemp)
    const soilTelemetry = {
      deviceId: 202,
      variables: {
        moisture: parseFloat((58.4 + sinWave * 4.5).toFixed(1)),
        soilTemp: parseFloat((22.4 + Math.cos(tick * 0.08) * 1.5).toFixed(1)),
        airMoisture: parseFloat((48.2 + Math.sin(tick * 0.06) * 5.0).toFixed(1)),
        airTemp: parseFloat((26.8 + Math.cos(tick * 0.05) * 2.0).toFixed(1)),
      },
    }

    // Device 212: AFL - Weather Station Alpha (13 Variables)
    const weatherTelemetry = {
      deviceId: 212,
      variables: {
        time: new Date().toTimeString().split(' ')[0],
        id: 'WS-01',
        tx: 2180 + tick * 3,
        t1: parseFloat((27.2 + sinWave * 2.5).toFixed(1)),
        rh1: parseFloat((62.5 + Math.cos(tick * 0.05) * 7).toFixed(1)),
        l1: Math.floor(18500 + Math.sin(tick * 0.04) * 5000),
        co: parseFloat((0.62 + Math.abs(sinWave) * 0.25).toFixed(2)),
        voc: Math.floor(115 + Math.abs(sinWave) * 35),
        p: Math.floor(1012 + sinWave * 3),
        ws: parseFloat((4.6 + Math.abs(sinWave) * 2.8).toFixed(1)),
        wd: Math.floor((180 + tick * 5) % 360),
        r: parseFloat((0.0 + (tick % 10 === 0 ? 1.2 : 0)).toFixed(1)),
        b: 96,
      },
    }

    try {
      await processIncomingTelemetry('sim/ems', emsTelemetry)
      await processIncomingTelemetry('sim/aqms', aqmsTelemetry)
      await processIncomingTelemetry('sim/soil', soilTelemetry)
      await processIncomingTelemetry('sim/weatherstation', weatherTelemetry)
    } catch (err) {
      // ignore in tick
    }
  }, intervalMs)
}

export function stopDeviceSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval)
    simulatorInterval = null
    console.log('[Simulator] Stopped real-time IoT device simulation.')
  }
}
