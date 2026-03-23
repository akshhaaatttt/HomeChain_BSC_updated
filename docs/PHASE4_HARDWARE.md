# **Phase 4: Hardware Layer (ESP32) - Complete Guide**

## **Table of Contents**
1. [Hardware Overview](#hardware-overview)
2. [Components & Wiring](#components--wiring)
3. [ESP32 Setup](#esp32-setup)
4. [Arduino Code](#arduino-code)
5. [GPIO Mapping](#gpio-mapping)
6. [WiFi & MQTT Configuration](#wifi--mqtt-configuration)
7. [Relay Control Logic](#relay-control-logic)
8. [Flashing & Testing](#flashing--testing)

---

## **Hardware Overview**

The **ESP32** is the final link in the chain. It:
- 📡 Connects to your home WiFi
- 🔔 Subscribes to MQTT topics
- 📥 Receives JSON messages from Go middleware
- ⚡ Toggles GPIO pins to control relays
- 💡 Physically switches AC loads (lights, fans, etc.)

### **Why ESP32?**
- ✅ Built-in WiFi & Bluetooth
- ✅ Multiple GPIO pins (30+)
- ✅ Low power consumption
- ✅ Arduino-compatible
- ✅ Cheap (~$10-20)

### **Hardware Bill of Materials**

| Component | Quantity | Cost | Purpose |
|-----------|----------|------|---------|
| **ESP32 Dev Board** | 1 | $12 | Microcontroller |
| **Yuyihon 8-Ch Relay Module** | 1 | $10 | AC switching |
| **Hi-Link HLK-5M05** | 1 | $8 | AC→5V DC converter |
| **Micro USB Cable** | 1 | $3 | Programming |
| **Jumper Wires (40pcs)** | 1 | $3 | Connections |
| **Breadboard** | 1 | $4 | Testing |
| **AC Extension Cord** | 1 | $5 | Power input |
| **Light Bulbs/Relays** | 2+ | $10+ | Loads to switch |
| **Total** | - | **~$55+** | - |

---

## **Components & Wiring**

### **1. ESP32 Pinout**

```
ESP32 DEV BOARD
┌───────────────────────────────────────────┐
│                                           │
│  GND  D23 D22 TX0  RX0 D21 D19 D18        │  Top
│  3V3  D5  D17 D16  D4  D0  D35 D34        │
│  EN   D25 D26 D27  D14 D12 D13 D15 GND    │
│  SB   D32 D33 D25  D26 D27 D14 D12 D13    │  Bottom
│                                           │
└───────────────────────────────────────────┘

Recommended GPIO for Relays:
- Relay CH1: GPIO 14 (D14)
- Relay CH2: GPIO 15 (D15)
- Relay CH3: GPIO 16 (D16)
- Relay CH4: GPIO 17 (D17)
- Relay CH5: GPIO 18 (D18)
- Relay CH6: GPIO 19 (D19)
- Relay CH7: GPIO 21 (D21)
- Relay CH8: GPIO 22 (D22)
```

### **2. Yuyihon Relay Module Pinout**

```
Yuyihon 8-Channel Relay Module
┌─────────────────────────┐
│ IN1 IN2 IN3 IN4 IN5 IN6 IN7 IN8  (Input pins)
│ COM NO  COM NO  COM NO  COM NO    (Contact pins)
│ +5V GND (Power)                   (Power pins)
└─────────────────────────┘

Each relay has:
- COM: Common contact
- NO: Normally Open (switches when energized)
- NC: Normally Closed (switches when de-energized)
```

### **3. Hi-Link HLK-5M05 Power Module**

```
Hi-Link HLK-5M05 AC→5V DC Converter
┌─────────┐
│ L  N  ⏚ │  Input (AC Line, Neutral, Earth)
│ +5V GND │  Output (5V DC)
└─────────┘

INPUT:  AC 85-265V
OUTPUT: 5V DC 1A
```

### **Wiring Diagram**

```
AC Mains (220V)
│
├─ Hi-Link HLK-5M05 ───→ 5V DC
│                      ├─ ESP32 5V
│                      └─ Relay Module +5V
│
└─ Relay Module GND ←──── ESP32 GND

ESP32 GPIO Pins → Relay Module IN Pins
┌──────────────────────────┐
│ ESP32      Relay Module  │
├──────────────────────────┤
│ GPIO14 (D14) → IN1       │
│ GPIO15 (D15) → IN2       │
│ GPIO16 (D16) → IN3       │
│ GPIO17 (D17) → IN4       │
│ GPIO18 (D18) → IN5       │
│ GPIO19 (D19) → IN6       │
│ GPIO21 (D21) → IN7       │
│ GPIO22 (D22) → IN8       │
│ GND → GND                │
└──────────────────────────┘

Relay Module COM → AC Load
Relay Module NO  → AC Neutral (for load)
```

### **Physical Connections**

```
AC Outlet
  ↓
Hi-Link Power Module (AC in)
  ↓
5V DC out → [ESP32 5V pin] & [Relay +5V]
GND → [ESP32 GND] & [Relay GND]

GPIO14-22 → Relay IN1-IN8

Relay COM → Light Socket (Hot)
Relay NO  → Light Bulb
Relay NO  → Light Socket (Neutral)
```

---

## **ESP32 Setup**

### **1. Install Arduino IDE**

```bash
# Download from:
# https://www.arduino.cc/en/software

# Or via Homebrew (Mac)
brew install arduino-ide

# Or via apt (Linux)
sudo apt install arduino-ide
```

### **2. Add ESP32 Board**

1. **Arduino IDE → Settings → Additional Boards Manager URLs**
2. Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. **Tools → Board Manager → Search "ESP32" → Install by Espressif**
4. **Tools → Board → Select "ESP32 Dev Module"**

### **3. Install Libraries**

```
Arduino IDE → Sketch → Include Library → Manage Libraries

Search and install:
- PubSubClient (by Nick O'Leary) - MQTT
- ArduinoJson (by Benoit Blanchon) - JSON parsing
```

Or via command line:
```bash
# If using Arduino CLI
arduino-cli lib install PubSubClient
arduino-cli lib install ArduinoJson
```

### **4. Connect ESP32 via USB**

1. Plug ESP32 into laptop/Pi via Micro USB
2. **Tools → Port → Select /dev/ttyUSB0 (Linux/Pi) or COM3 (Windows)**
3. **Tools → Upload Speed → 115200**
4. **Tools → Monitor Speed → 115200** (for serial debugging)

---

## **Arduino Code**

### **mqtt_controller.ino** - Complete Firmware

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ============ CONFIGURATION ============

// WiFi
const char* SSID = "YOUR_WIFI_SSID";
const char* PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT
const char* MQTT_BROKER = "192.168.1.100";  // Raspberry Pi IP
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "homechain-esp32-01";
const char* MQTT_TOPIC_PREFIX = "home/room/";

// GPIO Pins (Relay Module Input Pins)
const int RELAY_PINS[] = {14, 15, 16, 17, 18, 19, 21, 22};
const int NUM_RELAYS = 8;

// Room ID this ESP32 controls
const int ROOM_ID = 0;  // Change if multiple ESP32s

// ============ GLOBALS ============

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
char mqttTopic[50];

// ============ SETUP ============

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n🚀 HomeChain ESP32 Controller Starting...");
  
  // Initialize GPIO pins as OUTPUT
  for (int i = 0; i < NUM_RELAYS; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], HIGH);  // Default OFF (active-low)
    Serial.printf("✅ GPIO %d initialized as output\n", RELAY_PINS[i]);
  }
  
  // Connect WiFi
  connectWiFi();
  
  // Setup MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMQTTMessage);
  connectMQTT();
  
  // Subscribe to room topic
  snprintf(mqttTopic, sizeof(mqttTopic), "%s%d", MQTT_TOPIC_PREFIX, ROOM_ID);
  Serial.printf("📡 Subscribing to: %s\n", mqttTopic);
  mqttClient.subscribe(mqttTopic);
}

// ============ MAIN LOOP ============

void loop() {
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected, reconnecting...");
    connectWiFi();
  }
  
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    Serial.println("❌ MQTT disconnected, reconnecting...");
    connectMQTT();
  }
  
  // Process MQTT messages
  mqttClient.loop();
  
  delay(1000);
}

// ============ WiFi CONNECTION ============

void connectWiFi() {
  Serial.printf("📶 Connecting to WiFi: %s\n", SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ Failed to connect to WiFi!");
  }
}

// ============ MQTT CONNECTION ============

void connectMQTT() {
  Serial.printf("🔌 Connecting to MQTT broker: %s:%d\n", MQTT_BROKER, MQTT_PORT);
  
  if (mqttClient.connect(MQTT_CLIENT_ID)) {
    Serial.println("✅ MQTT connected!");
    
    // Subscribe to room topic
    char topic[50];
    snprintf(topic, sizeof(topic), "%s%d", MQTT_TOPIC_PREFIX, ROOM_ID);
    mqttClient.subscribe(topic);
    Serial.printf("✅ Subscribed to: %s\n", topic);
  } else {
    Serial.printf("❌ MQTT connection failed. Code: %d\n", mqttClient.state());
    delay(5000);
  }
}

// ============ MQTT MESSAGE HANDLER ============

void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
  Serial.printf("\n📨 Message received on topic: %s\n", topic);
  
  // Convert payload to string
  char payloadStr[256];
  strncpy(payloadStr, (char*)payload, length);
  payloadStr[length] = '\0';
  
  Serial.printf("📄 Payload: %s\n", payloadStr);
  
  // Parse JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payloadStr);
  
  if (error) {
    Serial.printf("❌ JSON parse error: %s\n", error.c_str());
    return;
  }
  
  // Extract data
  uint16_t pin = doc["pin"];
  uint8_t mode = doc["mode"];
  bool isMultistate = doc["ismultistate"];
  uint16_t multistate = doc["multistate"];
  uint16_t roomId = doc["roomId"];
  uint16_t applianceId = doc["applianceId"];
  
  Serial.printf("🔍 Decoded: pin=%d, mode=%d, multistate=%d, room=%d, appliance=%d\n",
                pin, mode, multistate, roomId, applianceId);
  
  // Check if pin is valid
  bool pinFound = false;
  int pinIndex = -1;
  for (int i = 0; i < NUM_RELAYS; i++) {
    if (RELAY_PINS[i] == pin) {
      pinFound = true;
      pinIndex = i;
      break;
    }
  }
  
  if (!pinFound) {
    Serial.printf("⚠️  Pin %d not configured on this ESP32\n", pin);
    return;
  }
  
  // Control relay
  if (isMultistate) {
    // Variable device (fan speed, dimmer brightness)
    Serial.printf("🎚️  Setting pin %d to PWM value: %d\n", pin, multistate);
    
    // Map 0-100 to 0-255
    uint8_t pwmValue = map(multistate, 0, 100, 0, 255);
    analogWrite(pin, pwmValue);
  } else {
    // Binary device (ON/OFF)
    if (mode == 1) {
      // ON - Set LOW (active-low relay)
      digitalWrite(pin, LOW);
      Serial.printf("💡 PIN %d SET TO LOW (RELAY ON)\n", pin);
    } else {
      // OFF - Set HIGH (active-low relay)
      digitalWrite(pin, HIGH);
      Serial.printf("⚫ PIN %d SET TO HIGH (RELAY OFF)\n", pin);
    }
  }
  
  // Debug output
  Serial.printf("✅ Relay action completed!\n\n");
}

// ============ HELPER FUNCTIONS ============

// Check WiFi signal strength
void printWiFiStatus() {
  Serial.printf("📊 WiFi Status:\n");
  Serial.printf("  SSID: %s\n", WiFi.SSID().c_str());
  Serial.printf("  IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("  Signal: %d dBm\n", WiFi.RSSI());
  Serial.printf("  MAC: %s\n", WiFi.macAddress().c_str());
}

// Monitor relay status
void printRelayStatus() {
  Serial.println("📋 Relay Status:");
  for (int i = 0; i < NUM_RELAYS; i++) {
    int state = digitalRead(RELAY_PINS[i]);
    Serial.printf("  Pin %d (Relay %d): %s\n", 
                  RELAY_PINS[i], i+1, state == LOW ? "ON" : "OFF");
  }
}
```

---

## **GPIO Mapping**

### **Configuration for HomeChain**

```cpp
// Update these arrays based on your setup

// Mapping: Smart home appliance to GPIO pin
const int APPLIANCE_PINS[] = {
  14,  // Appliance 0: Living Room Light → GPIO 14
  15,  // Appliance 1: Living Room Fan → GPIO 15
  16,  // Appliance 2: Kitchen Light → GPIO 16
  17,  // Appliance 3: Kitchen AC → GPIO 17
  // Add more...
};

// Or create a struct for clarity
struct Appliance {
  int pin;
  const char* name;
  bool isMultistate;
};

Appliance appliances[] = {
  {14, "Living Room Light", false},
  {15, "Living Room Fan", true},
  {16, "Kitchen Light", false},
  {17, "Bedroom AC", true},
};
```

### **Example: Living Room Setup**

```
Room ID: 0
├─ Appliance 0: Main Light (GPIO 14)
├─ Appliance 1: Ceiling Fan (GPIO 15, variable speed)
└─ Appliance 2: AC Unit (GPIO 16)

Room ID: 1
├─ Appliance 0: Bedroom Light (GPIO 17)
└─ Appliance 1: Bedroom Fan (GPIO 18, variable)
```

---

## **WiFi & MQTT Configuration**

### **Connect to WiFi**

Edit the firmware:
```cpp
const char* SSID = "YOUR_WIFI_NETWORK";
const char* PASSWORD = "YOUR_WIFI_PASSWORD";
```

### **Find MQTT Broker IP**

```bash
# On Raspberry Pi, find its IP
hostname -I
# Output: 192.168.1.100

# Update in firmware
const char* MQTT_BROKER = "192.168.1.100";
```

### **Test MQTT Connection**

```bash
# On Pi, monitor MQTT messages
mosquitto_sub -h localhost -t "home/#" -v

# Output:
# home/room/0 {"pin":14,"mode":1,...}
```

---

## **Relay Control Logic**

### **Active-Low vs Active-High**

Most relay modules are **active-low**, meaning:
- **GPIO = LOW** → Relay coil energizes → Contact closes → AC circuit completes → Device ON
- **GPIO = HIGH** → Relay de-energizes → Contact opens → Device OFF

```cpp
// For active-low relays (Yuyihon standard)
if (mode == 1) {
  digitalWrite(pin, LOW);   // Device ON
} else {
  digitalWrite(pin, HIGH);  // Device OFF
}
```

### **Variable Devices (PWM)**

For dimmers, fans with speed control:

```cpp
// Map 0-100 (multistate) to 0-255 (PWM)
uint8_t pwmValue = map(multistate, 0, 100, 0, 255);
analogWrite(pin, pwmValue);

// Example:
// multistate = 50 (50% speed) → pwmValue = 127 (50% duty cycle)
// multistate = 100 (100% speed) → pwmValue = 255 (100% duty cycle)
```

---

## **Flashing & Testing**

### **1. Upload Firmware**

```
Arduino IDE:
1. Sketch → Upload (or press Ctrl+U)
2. Wait for "Upload successful"
3. Output: "Leaving... Hard resetting via RTS pin..."
```

### **2. Monitor Serial Output**

```
Tools → Serial Monitor (or Ctrl+Shift+M)
Speed: 115200 baud

Expected output:
🚀 HomeChain ESP32 Controller Starting...
✅ GPIO 14 initialized as output
✅ GPIO 15 initialized as output
...
📶 Connecting to WiFi: MY_SSID
✅ WiFi connected! IP: 192.168.1.101
🔌 Connecting to MQTT broker: 192.168.1.100:1883
✅ MQTT connected!
✅ Subscribed to: home/room/0
```

### **3. Test MQTT Message**

```bash
# From laptop/Pi, publish a test message
mosquitto_pub -h 192.168.1.100 -t "home/room/0" -m '{
  "pin": 14,
  "mode": 1,
  "ismultistate": false,
  "multistate": 0,
  "roomId": 0,
  "applianceId": 0,
  "contract": "0x5FbDB...",
  "timestamp": 1234567890
}'

# Watch ESP32 serial monitor:
# 📨 Message received on topic: home/room/0
# 🔍 Decoded: pin=14, mode=1, ...
# 💡 PIN 14 SET TO LOW (RELAY ON)
```

### **4. Physical Test**

1. **Power on relay module** (5V from Hi-Link)
2. **Watch LED on relay board light up** when GPIO is set LOW
3. **Listen for relay clicking sound** (electromagnet energizing)
4. **Check AC load** (bulb should turn on)

---

## **Troubleshooting**

### **Issue: "Upload failed"**
```
→ Check USB cable connection
→ Tools → Port → Select correct serial port
→ Restart Arduino IDE
→ Reset ESP32 (press EN button)
```

### **Issue: "WiFi not connecting"**
```
→ Check SSID and password
→ Check Pi is on same network
→ Restart WiFi router
```

### **Issue: "MQTT not connecting"**
```
→ Check MQTT_BROKER IP (must be Pi's IP, not localhost)
→ Check Mosquitto is running: sudo systemctl status mosquitto
→ Test connection: mosquitto_pub -h 192.168.1.100 -t "test" -m "hello"
```

### **Issue: "Relay not clicking"**
```
→ Check GPIO pin is correctly configured
→ Verify relay module is powered (5V)
→ Check signal LED on relay module lights up
→ Try pushing IN button manually to test relay
```

---

**Version:** 1.0  
**Last Updated:** January 27, 2026
