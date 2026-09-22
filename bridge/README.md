# Embed AIoT (CF Smart EMS) — Industrial MQTT Bridge Guide

## What is this folder?
The `bridge/` folder contains the **MQTT Bridge scripts** that connect physical hardware, smart meters, or external devices to your live database and dashboard.

---

## 1. Quick Test: Send Live Real Data on Demand

You can send real live data right now using the `send_live_data.js` script:

```bash
# Syntax: node bridge/send_live_data.js <Voltage> <Current> <PowerKW>
node bridge/send_live_data.js 240 25 15.2
```

This immediately:
1. Connects to your live EMQX broker (`localhost:1883`).
2. Publishes the exact reading for **CF Smart Panel (Device #2)**.
3. Records the reading into **TimescaleDB** (`telemetry_data` hypertable).
4. Broadcasts it in real time over WebSockets to your dashboard on `http://localhost:5173`.

---

## 2. Running the Continuous MQTT Bridge Service

Start the full bridge service:

```bash
node bridge/mqtt_bridge.js
```

The bridge provides:
* **Automatic Gateway Heartbeats**: Keeps gateway `SN-10021` marked "Online" in your admin portal.
* **HTTP Webhook Ingestion (`http://localhost:8088/ingest`)**: Any smart meter, Wi-Fi smart plug (Shelly/Sonoff), or mobile app on your local network can send an HTTP POST with JSON data, and the bridge instantly converts it to an MQTT packet and sends it to the dashboard.

Example HTTP POST from any device or curl:
```bash
curl -X POST http://localhost:8088/ingest \
  -H "Content-Type: application/json" \
  -d '{"deviceId": 2, "variables": {"voltageA": 235.4, "currentA": 19.1, "power": 12.8}}'
```

---

## 3. Connecting to Physical Field Meters (Modbus RTU / TCP)

### On a Raspberry Pi / Gateway in the Factory:
1. Wire the meter's RS-485 port ($A+$, $B-$) to the gateway's USB RS-485 adapter.
2. Edit `bridge/bridge_config.json` with the meter's register map and COM/serial port.
3. Run the Python edge agent:
   ```bash
   python bridge/edge_agent.py
   ```
4. The agent reads the physical voltage and current directly from the copper wires every 3 seconds and streams it live into your cloud dashboard.
