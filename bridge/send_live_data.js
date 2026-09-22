import mqtt from 'mqtt'

// Connect to local EMQX broker
const client = mqtt.connect('mqtt://localhost:1883')

const args = process.argv.slice(2)
const voltage = parseFloat(args[0]) || 235.5
const current = parseFloat(args[1]) || 18.2
const power   = parseFloat(args[2]) || (voltage * current * 0.95 * 3 / 1000).toFixed(2)

const payload = {
  gateway: 'SN-10021',
  timestamp: new Date().toISOString(),
  devices: [
    {
      id: 2, // CF Smart Panel
      variables: {
        voltageA: voltage,
        voltageB: parseFloat((voltage - 1.2).toFixed(1)),
        voltageC: parseFloat((voltage + 1.8).toFixed(1)),
        currentA: current,
        power: parseFloat(power),
        powerFactor: 0.94,
        energyConsumption: 12500,
      },
    },
  ],
}

client.on('connect', () => {
  const topic = 'ems/gateways/SN-10021/telemetry'
  client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
    if (!err) {
      console.log('----------------------------------------------------')
      console.log('✓ REAL LIVE PACKET SENT TO MQTT BROKER & DASHBOARD!')
      console.log(`Topic   : ${topic}`)
      console.log(`Voltage : ${voltage} V`)
      console.log(`Current : ${current} A`)
      console.log(`Power   : ${power} kW`)
      console.log('----------------------------------------------------')
    } else {
      console.error('Failed to send:', err)
    }
    client.end()
  })
})
