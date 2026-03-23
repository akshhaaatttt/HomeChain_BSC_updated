# **Troubleshooting Guide**

## **🔴 Critical Issues**

### **Issue: "Anvil Connection Refused"**

**Symptoms:**
```
Error: Failed to connect to RPC: connection refused
Error: getaddrinfo ENOTFOUND 192.168.1.100
```

**Cause:** Anvil not running on Pi, wrong IP, or firewall blocking

**Solution:**
```bash
# 1. Check if Anvil is running
ssh pi@192.168.1.100
ps aux | grep anvil

# 2. If not running, start it
anvil --fork-url https://binance.llamarpc.com --host 0.0.0.0

# 3. Test connectivity from laptop
curl -X POST http://192.168.1.100:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Expected response:
{"jsonrpc":"2.0","result":"0x7a69","id":1}  # 0x7a69 = 31337 in hex

# 4. If still failing, check firewall
sudo ufw status
sudo ufw allow 8545/tcp
```

---

### **Issue: "MQTT Connection Refused"**

**Symptoms:**
```
Error: MQTT connection failed. Code: -4
Error: Connection refused
```

**Cause:** Mosquitto not running, wrong broker IP, port blocked

**Solution:**
```bash
# 1. Check Mosquitto status
sudo systemctl status mosquitto

# 2. Start or restart
sudo systemctl restart mosquitto

# 3. Verify broker is listening
sudo netstat -tuln | grep 1883
# Output: tcp  0  0 127.0.0.1:1883  0.0.0.0:*  LISTEN

# 4. Test from Go service (on Pi)
mosquitto_pub -h localhost -t "test" -m "hello"
mosquitto_sub -h localhost -t "test"

# 5. If using remote connection, check Pi firewall
sudo ufw allow 1883/tcp

# 6. Update main.go to use correct broker
const MQTT_BROKER = "tcp://127.0.0.1:1883"  # For local (Pi)
// Or for remote:
const MQTT_BROKER = "tcp://192.168.1.100:1883"
```

---

### **Issue: "Smart Contract Not Deploying"**

**Symptoms:**
```
Error: sender has 0 BNB, insufficient balance for gas
Error: Failed to send transaction
```

**Cause:** Account has no funds, or Anvil needs to be restarted

**Solution:**
```bash
# 1. Check account balance
cast balance 0x1234... --rpc-url http://192.168.1.100:8545

# 2. If balance is 0, use correct account from Anvil output
# Use Account #0 which has 10,000 tBNB

# 3. Restart Anvil to reset state
pkill -f anvil
anvil --fork-url https://binance.llamarpc.com --host 0.0.0.0

# 4. Deploy again with correct private key
forge script script/Deploy.s.sol \
  --rpc-url http://192.168.1.100:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded46b5b72f1663d23b3b2
```

---

### **Issue: "MetaMask Stuck on Connecting"**

**Symptoms:**
```
MetaMask spinning loading icon
Network shows "Anvil" but won't connect
```

**Cause:** RPC URL unreachable, wrong chain ID, or network mismatch

**Solution:**
```
1. MetaMask Settings → Networks → Anvil
2. Verify:
   - RPC URL: http://192.168.1.100:8545  (Check IP!)
   - Chain ID: 31337
   - Currency: BNB
3. Delete network and re-add manually
4. Switch to different network, then back to Anvil
5. Restart browser
6. Check Anvil is running:
   ssh pi@192.168.1.100 && ps aux | grep anvil
```

---

## **🟠 Middleware Issues**

### **Issue: "No Events Detected"**

**Symptoms:**
```
Go middleware running but no "📡 New event detected" logs
Even when toggling appliance on dashboard
```

**Cause:** Event filtering wrong, contract address mismatch, or ABI incorrect

**Solution:**
```bash
# 1. Verify contract address in main.go matches deployed
# Get deployed address:
cast deployed --rpc-url http://192.168.1.100:8545
# Or from deployment output: "Deployed to: 0x..."

# 2. Manually trigger event to test
cast send 0x5FbDB... "changeState(uint256,uint256)" 0 0 \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974...

# 3. Check Go logs
# Should see: "📡 New event detected in block X"

# 4. If still no events, check ABI
# Regenerate and compare:
forge build
jq '.abi' out/HomeAutomation.sol/HomeAutomation.json

# 5. Restart Go service
pkill -f homechain-middleware
cd middleware && go run main.go
```

---

### **Issue: "MQTT Message Not Publishing"**

**Symptoms:**
```
Go logs show: "📡 New event detected"
But no MQTT message received on Pi
```

**Cause:** MQTT connection dropped, broker not accepting, or publish failed

**Solution:**
```bash
# 1. Monitor MQTT in real-time on Pi
mosquitto_sub -h localhost -t "home/#" -v

# 2. Check Go logs for MQTT errors
# Look for: "❌ MQTT publish failed"

# 3. Restart MQTT broker
sudo systemctl restart mosquitto

# 4. Test MQTT manually
# From Pi:
mosquitto_pub -h localhost -t "home/room/0" -m '{"pin":14,"mode":1}'
mosquitto_sub -h localhost -t "home/room/0" -v

# Expected:
# home/room/0 {"pin":14,"mode":1}

# 5. If publish works but Go doesn't, check Go MQTT code
# Verify: client.Publish() returns successfully
```

---

### **Issue: "Failed to Decode Log"**

**Symptoms:**
```
Go logs: "❌ Failed to decode log: invalid type"
```

**Cause:** Event data doesn't match ABI, or wrong event type

**Solution:**
```bash
# 1. Regenerate ABI from contract
cd smart-contracts
forge build
jq '.abi' out/HomeAutomation.sol/HomeAutomation.json > abi.json

# 2. Compare ABI in main.go with actual contract
# Event definition should match:
# "name": "stateChange",
# "inputs": [
#   {"name": "roomId", "type": "uint256"},
#   {"name": "applianceId", "type": "uint256"},
#   {"name": "state", "type": "bool"}
# ]

# 3. Update CONTRACT_ABI string in main.go

# 4. Rebuild and restart
go build
./homechain-middleware
```

---

## **🟡 Frontend Issues**

### **Issue: "Dashboard Shows 'No Rooms Owned'"**

**Symptoms:**
```
Frontend loads but shows: "No rooms owned by this address."
Even though rooms exist on-chain
```

**Cause:** Wrong contract address, wrong chain, or user not owner

**Solution:**
```bash
# 1. Check contract address
echo $NEXT_PUBLIC_CONTRACT_ADDRESS
# Should match deployed address: 0x5FbDB...

# 2. Check MetaMask is on Anvil network
# Network should show "Anvil (Local BSC Fork)"
# Chain ID should be 31337

# 3. Verify user is room owner
cast call 0x5FbDB... "owner(uint256,address)" 0 0x1234... \
  --rpc-url http://192.168.1.100:8545
# Should return: true

# 4. If false, make user a room owner
cast send 0x5FbDB... "addRoomOwner(uint256,address)" 0 0x1234... \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974...  # SuperAdmin key

# 5. Refresh frontend
```

---

### **Issue: "Cannot Perform Transactions - Need to Switch Network"**

**Symptoms:**
```
Dashboard shows error: "Wrong network"
Or: "Please switch to Anvil"
```

**Cause:** MetaMask on wrong network

**Solution:**
```
1. Open MetaMask
2. Click network dropdown (top-left)
3. Select "Anvil (Local BSC Fork)"
4. Should show chain ID 31337
5. Refresh dashboard (F5)
6. Try toggle again
```

---

### **Issue: "Gas Estimation Failed"**

**Symptoms:**
```
MetaMask error: "Gas estimation failed"
Or: "Failed to execute transaction"
```

**Cause:** Contract call invalid, wrong parameters, or insufficient gas

**Solution:**
```bash
# 1. Test call manually with cast
cast call 0x5FbDB... "getRoomCount()" \
  --rpc-url http://192.168.1.100:8545
# If this fails, contract address is wrong

# 2. Check parameters in frontend
// For changeState(roomId, applianceId)
// Both should be BigInt
args: [BigInt(roomId), BigInt(applianceId)]

# 3. Verify appliance exists
cast call 0x5FbDB... "getApplianceCount(uint256)" 0 \
  --rpc-url http://192.168.1.100:8545
# Should return count > applianceId

# 4. Check user has permission
cast call 0x5FbDB... "checkAllowedAddress(uint256,uint256,address)" \
  0 0 0x1234... \
  --rpc-url http://192.168.1.100:8545
# Should return: true

# 5. Increase gas limit in MetaMask
# MetaMask → Settings → Experimental → Advanced gas controls
```

---

### **Issue: "ABI Function Not Found"**

**Symptoms:**
```
Frontend error: "Function changeState not found in ABI"
```

**Cause:** Wrong or incomplete ABI file

**Solution:**
```bash
# 1. Regenerate ABI
cd smart-contracts
forge build
jq '.abi' out/HomeAutomation.sol/HomeAutomation.json > abi.json

# 2. Copy to frontend
cp abi.json ../frontend/app/abi/abi.js

# 3. Update format if needed
# Frontend expects: export const abi = [...]
echo "export const abi = $(cat out/HomeAutomation.sol/HomeAutomation.json | jq '.abi');" > ../frontend/app/abi/abi.js

# 4. Restart frontend
cd ../frontend
npm run dev
```

---

## **🟢 Hardware Issues**

### **Issue: "ESP32 Upload Failed"**

**Symptoms:**
```
Arduino IDE error: "esptool.py error: Failed to connect"
Or: "Timed out waiting for packet"
```

**Cause:** USB cable disconnected, wrong COM port, or driver missing

**Solution:**
```
1. Physically reconnect USB cable
2. Arduino IDE → Tools → Port → Check correct port
   Linux/Pi: /dev/ttyUSB0 or /dev/ttyACM0
   Windows: COM3, COM4, etc.
3. If port not showing:
   - Restart Arduino IDE
   - Reinstall CH340 drivers (USB-to-Serial chip on ESP32)
   - Try different USB cable
4. Reset ESP32:
   - Press EN button while uploading
   - Or hold BOOT button during upload
5. Check baud rate:
   Tools → Upload Speed → 115200
```

---

### **Issue: "Serial Monitor Shows Garbage"**

**Symptoms:**
```
✍️ ✍️ ✍️ ✍️ (weird characters)
Or: Nothing appears in serial monitor
```

**Cause:** Wrong baud rate or serial connection issue

**Solution:**
```
1. Tools → Monitor Speed → 115200
2. Disconnect and reconnect USB
3. Reset ESP32 (press EN button)
4. If still nothing:
   - Check Tools → Port is correct
   - Restart Arduino IDE
   - Try: Tools → Serial Monitor → ???? → Reset
```

---

### **Issue: "GPIO Pin Not Responding / Relay Not Clicking"**

**Symptoms:**
```
Serial monitor shows: "💡 PIN 14 SET TO LOW"
But relay doesn't click, LED doesn't light
```

**Cause:** GPIO not initialized, relay not powered, or active-low logic reversed

**Solution:**
```cpp
// 1. Verify GPIO initialization in setup()
pinMode(14, OUTPUT);
digitalWrite(14, HIGH);  // Default OFF

// 2. Check relay module is powered
// Look for red LED on relay module - should be ON
// If OFF: check 5V connection from Hi-Link

// 3. Verify active-low logic
// For Yuyihon relays:
// GPIO = LOW → Relay ON (contact closes)
// GPIO = HIGH → Relay OFF (contact opens)

// 4. Test relay manually
// Arduino IDE → Tools → Serial Monitor
// Type: digitalWrite 14 0  (if using custom commands)
// Or add test code:
void testRelay() {
  digitalWrite(14, LOW);   // Turn ON
  delay(1000);
  digitalWrite(14, HIGH);  // Turn OFF
  delay(1000);
}
// Call in setup(): testRelay();

// 5. Check wiring
// Pin → Relay IN
// GND → Relay GND
// 5V → Relay +5V
```

---

### **Issue: "ESP32 WiFi Won't Connect"**

**Symptoms:**
```
Serial monitor shows: "📶 Connecting to WiFi: MY_SSID"
Then: ".............." (keeps waiting)
Then: "❌ Failed to connect to WiFi!"
```

**Cause:** Wrong SSID/password, WiFi out of range, or authentication failure

**Solution:**
```cpp
// 1. Verify SSID and password in firmware
const char* SSID = "YOUR_WIFI_SSID";
const char* PASSWORD = "YOUR_WIFI_PASSWORD";

// 2. Check spelling (case-sensitive)
// 3. Ensure no special characters causing issues
// 4. Test WiFi with another device to confirm it's working

// 5. If using 5GHz WiFi, switch to 2.4GHz
// ESP32 may not support 5GHz depending on firmware

// 6. Add debug output
void connectWiFi() {
  Serial.printf("Connecting to: %s (password: %s)\n", SSID, PASSWORD);
  Serial.println("WiFi scan results:");
  int networks = WiFi.scanNetworks();
  for (int i = 0; i < networks; i++) {
    Serial.printf("  %d: %s (signal: %d dBm)\n", 
                  i, WiFi.SSID(i).c_str(), WiFi.RSSI(i));
  }
}

// 7. If network appears in scan but won't connect:
// - Try forgetting network on phone and reconnecting
// - Reboot WiFi router
// - Try ESP32 on different WiFi
```

---

### **Issue: "MQTT Subscription Failed"**

**Symptoms:**
```
Serial monitor shows: "✅ WiFi connected!"
But: "❌ MQTT connection failed. Code: -4"
```

**Cause:** MQTT broker IP wrong, port blocked, or broker down

**Solution:**
```cpp
// 1. Verify broker IP and port
const char* MQTT_BROKER = "192.168.1.100";  // Check this!
const int MQTT_PORT = 1883;

// 2. Test connectivity from ESP32
// Add ping test before MQTT:
void testConnection() {
  Serial.printf("Pinging %s...\n", MQTT_BROKER);
  if (WiFi.ping(192, 168, 1, 100) > 0) {
    Serial.println("✅ Broker reachable!");
  } else {
    Serial.println("❌ Cannot reach broker!");
  }
}

// 3. Check broker is running on Pi
// SSH into Pi:
ssh pi@192.168.1.100
sudo systemctl status mosquitto

// 4. Check firewall allows port 1883
sudo ufw allow 1883/tcp

// 5. Try connecting from laptop first
mosquitto_sub -h 192.168.1.100 -t "home/#"
# If this fails, broker not accessible

// 6. Restart Mosquitto
sudo systemctl restart mosquitto
```

---

### **Issue: "No MQTT Messages Received"**

**Symptoms:**
```
Serial monitor shows: "✅ MQTT connected!"
And: "✅ Subscribed to: home/room/0"
But no messages appear
```

**Cause:** Topic mismatch, message not published, or message format wrong

**Solution:**
```bash
# 1. Monitor ESP32 by publishing test message
# From Pi:
mosquitto_pub -h localhost -t "home/room/0" -m '{"pin":14,"mode":1,"ismultistate":false,"multistate":0,"roomId":0,"applianceId":0,"contract":"0x5FbDB...","timestamp":0}'

# 2. Watch ESP32 serial monitor for:
# 📨 Message received on topic: home/room/0
# 📄 Payload: {...}

# 3. If no message:
// Check topic subscription
char topic[50];
snprintf(topic, sizeof(topic), "%s%d", MQTT_TOPIC_PREFIX, ROOM_ID);
Serial.printf("Subscribing to: %s\n", topic);
mqttClient.subscribe(topic);

// Verify MQTT_TOPIC_PREFIX matches
// Should be: "home/room/"

// 4. Check message callback is defined
void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
  Serial.println("📨 Got message!");
}
mqttClient.setCallback(onMQTTMessage);

// 5. Restart everything
// Restart Go middleware → publishes message
// Should propagate through MQTT → ESP32 receives
```

---

## **🔵 Multi-Layer Debugging**

### **End-to-End Test Procedure**

```bash
# STEP 1: Verify Anvil
ssh pi@192.168.1.100
anvil --fork-url https://binance.llamarpc.com --host 0.0.0.0
# Should show: "Listening on 0.0.0.0:8545"

# STEP 2: Deploy Contract
forge script script/Deploy.s.sol --rpc-url http://192.168.1.100:8545 --broadcast --private-key 0xac0974...
# Note deployed address

# STEP 3: Start Go Middleware
cd middleware && go run main.go
# Should show: "✅ Connected to RPC", "✅ MQTT connected", "✅ Listening for events"

# STEP 4: Start Dashboard
cd frontend && npm run dev
# Should show: "ready - started server on 0.0.0.0:3000"

# STEP 5: Test in Dashboard
# 1. Connect MetaMask (Account #0)
# 2. Add room (if none)
# 3. Add appliance to room
# 4. Click toggle

# STEP 6: Monitor Go Logs
# Should see: "📡 New event detected", "✅ Published to home/room/X"

# STEP 7: Monitor MQTT
mosquitto_sub -h localhost -t "home/#" -v
# Should see: home/room/0 {...json payload...}

# STEP 8: Check ESP32 Serial Monitor
# Should show: "📨 Message received on topic: home/room/0"

# If any step fails, go back and debug that layer
```

---

**Version:** 1.0  
**Last Updated:** January 27, 2026
