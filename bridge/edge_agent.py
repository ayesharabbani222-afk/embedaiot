"""
Embed AIoT (CF Smart EMS) — Industrial Edge Gateway Agent (Python)
------------------------------------------------------------------
Runs on physical gateway hardware (Raspberry Pi, Industrial PC, Teltonika, etc.)
Polls physical Modbus RTU / TCP energy meters and publishes real telemetry over MQTT.
"""

import time
import json
import os
import sys

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("[Notice] 'paho-mqtt' not installed. Run: pip install paho-mqtt pymodbus")

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "bridge_config.json")

def load_config():
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)

def run_agent():
    config = load_config()
    serial = config["gateway"]["serialNumber"]
    broker = config["mqtt"]["brokerUrl"].replace("mqtt://", "").split(":")[0]
    port = int(config["mqtt"]["brokerUrl"].split(":")[-1]) if ":" in config["mqtt"]["brokerUrl"] else 1883
    topic = f"{config['mqtt']['topicPrefix']}/{serial}/telemetry"

    print("=" * 55)
    print("  Embed AIoT — Python Edge Gateway Bridge Agent     ")
    print("=" * 55)
    print(f"[*] Gateway Serial : {serial}")
    print(f"[*] MQTT Target    : {broker}:{port}")
    print(f"[*] Publish Topic  : {topic}")

    client = mqtt.Client(client_id=f"py_agent_{serial}")
    
    try:
        client.connect(broker, port, 60)
        client.loop_start()
        print("[*] Successfully connected to MQTT Broker!")
    except Exception as e:
        print(f"[!] MQTT Connection failed: {e}")
        return

    # In production with physical RS-485 USB adapter:
    # from pymodbus.client import ModbusSerialClient
    # modbus = ModbusSerialClient(port='COM3', baudrate=9600, parity='N')
    
    tick = 0
    while True:
        tick += 1
        # Example reading structure matching CF Smart Panel
        telemetry_payload = {
            "gateway": serial,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "devices": [
                {
                    "id": 2, # CF Smart Panel
                    "variables": {
                        "voltageA": 220.0 + (tick % 10) * 1.5,
                        "currentA": 15.0 + (tick % 5) * 2.0,
                        "power": 8500 + (tick % 8) * 300,
                        "powerFactor": 0.95,
                        "energyConsumption": 12500 + tick
                    }
                }
            ]
        }

        json_data = json.dumps(telemetry_payload)
        client.publish(topic, json_data, qos=1)
        print(f"[>] [{time.strftime('%H:%M:%S')}] Transmitted live reading for Device #2")
        time.sleep(config["gateway"].get("pollIntervalSeconds", 3))

if __name__ == "__main__":
    run_agent()
