# **Quick Reference & Checklists**

## **🚀 Quick Start Commands**

### **Raspberry Pi Setup (First Time)**
```bash
# SSH into Pi
ssh pi@192.168.1.100

# Update system
sudo apt update && sudo apt upgrade -y

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
~/.foundry/bin/foundryup

# Install Go
wget https://go.dev/dl/go1.21.0.linux-armv6l.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-armv6l.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

# Install Mosquitto
sudo apt install mosquitto mosquitto-clients -y
sudo systemctl enable mosquitto

# Verify
anvil --version && go version && mosquitto -v
```

### **Launch Anvil (Development)**
```bash
anvil --fork-url https://binance.llamarpc.com --host 0.0.0.0
# Accessible at: http://192.168.1.100:8545
```

### **Deploy Contract**
```bash
cd smart-contracts
forge script script/Deploy.s.sol \
  --rpc-url http://192.168.1.100:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded46b5b72f1663d23b3b2
```

### **Run Go Middleware**
```bash
cd middleware
go mod init homeautomation
go get github.com/ethereum/go-ethereum/ethclient
go get github.com/eclipse/paho.mqtt.golang
go run main.go
```

### **Start Next.js Frontend**
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### **Flash ESP32**
```
Arduino IDE:
1. Tools → Board → ESP32 Dev Module
2. Tools → Port → /dev/ttyUSB0
3. Upload (Ctrl+U)
4. Monitor (Ctrl+Shift+M)
```

---

## **📋 Configuration Checklist**

### **Before First Run**

- [ ] **Raspberry Pi IP:** `192.168.1.100` (update all configs with actual IP)
- [ ] **Contract Address:** `0x5FbDB2315678afccb33d7d144aca41937d0cf6ae` (save after deployment)
- [ ] **Chain ID:** `31337` (Anvil chain)
- [ ] **RPC URL:** `http://192.168.1.100:8545`
- [ ] **MQTT Broker:** `tcp://192.168.1.100:1883`
- [ ] **WiFi SSID & Password:** Updated in ESP32 firmware
- [ ] **MetaMask:** Custom network added (Anvil)
- [ ] **MetaMask Account:** Imported test account from Anvil
- [ ] **ABI:** Copied to `frontend/app/abi/abi.js`

### **Smart Contract Deployment**

- [ ] Anvil running on Pi
- [ ] Foundry installed on development machine
- [ ] Contract ABI extracted
- [ ] Contract deployed to Anvil
- [ ] Contract address saved to config
- [ ] Initial room added via dashboard or CLI

### **Middleware Setup**

- [ ] Go 1.21+ installed on Pi
- [ ] `paho.mqtt.golang` and `go-ethereum` packages installed
- [ ] Contract address in main.go
- [ ] RPC URL pointing to Pi's Anvil
- [ ] MQTT broker running on Pi
- [ ] Go service running (test with `go run main.go`)

### **Frontend Setup**

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` configured with:
  - `NEXT_PUBLIC_RPC_URL=http://192.168.1.100:8545`
  - `NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB...`
  - `NEXT_PUBLIC_CHAIN_ID=31337`
- [ ] Dashboard accessible at `http://localhost:3000`
- [ ] MetaMask connected & showing BNB balance

### **Hardware Setup**

- [ ] ESP32 connected via USB
- [ ] PubSubClient library installed in Arduino IDE
- [ ] ArduinoJson library installed
- [ ] Firmware uploaded to ESP32
- [ ] WiFi credentials in firmware match home WiFi
- [ ] Relay module connected to GPIO pins (14, 15, 16, 17, 18, 19, 21, 22)
- [ ] Hi-Link power module connected
- [ ] GPIO pin initialization successful (check serial monitor)

---

## **🔗 Key Addresses & IPs**

```
NETWORK ADDRESSES:
├── Raspberry Pi IP: 192.168.1.100
├── Pi SSH: ssh pi@192.168.1.100
├── Anvil RPC: http://192.168.1.100:8545
├── MQTT Broker: tcp://192.168.1.100:1883
└── Frontend: http://localhost:3000 (on dev machine)

SMART CONTRACT:
├── Contract Address: 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae
├── Chain ID: 31337 (Anvil fork)
├── Network: Binance Smart Chain (forked locally)
└── Explorer: http://192.168.1.100:8545 (no built-in)

ANVIL TEST ACCOUNTS (from anvil output):
├── Account #0: 0x1234... (has 10,000 tBNB)
│   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded46b5b72f1663d23b3b2
├── Account #1-9: (other test accounts with 10,000 tBNB each)
└── Note: All accounts funded in development only

ESP32 DETAILS:
├── Board Type: ESP32 Dev Module
├── Upload Speed: 115200
├── Serial Monitor Speed: 115200
├── Room ID: 0 (configurable)
└── Relay Pins: GPIO 14-22 (8 relays)
```

---

## **⚙️ Common Operations**

### **Add New Room**
```bash
# Via CLI (as SuperAdmin)
cast send 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "addRoom(string)" "Bedroom" \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974...

# Via Dashboard
1. Connect wallet
2. (Admin panel - add room button)
```

### **Grant Room Ownership**
```bash
# CLI
cast send 0x5FbDB... \
  "addRoomOwner(uint256,address)" 0 0x742d35Cc6634C0532925a3b844Bc5e8aF6b0d3f4 \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974...
```

### **Add Appliance to Room**
```bash
# CLI (room owner)
cast send 0x5FbDB... \
  "addAppliances(uint256,string,uint256,address[],tuple[],bool,uint8[5])" \
  0 "Main Light" 14 "[]" "[]" false "[0,0,0,0,0]" \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0x...
```

### **Check Room Count**
```bash
cast call 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "getRoomCount()" \
  --rpc-url http://192.168.1.100:8545
# Output: 1
```

### **Check Appliance State**
```bash
cast call 0x5FbDB... \
  "getSwitchState(uint256,uint256)" 0 0 \
  --rpc-url http://192.168.1.100:8545
# Output: true (ON) or false (OFF)
```

### **Monitor MQTT Messages**
```bash
# On Pi
mosquitto_sub -h localhost -t "home/#" -v

# Example output:
# home/room/0 {"pin":14,"mode":1,"ismultistate":false,...}
```

### **Restart MQTT Broker**
```bash
sudo systemctl restart mosquitto
sudo systemctl status mosquitto
```

### **Restart Go Middleware**
```bash
# Kill process
pkill -f homechain-middleware

# Restart
cd middleware && go run main.go
```

### **Check WiFi on Pi**
```bash
iwconfig                    # Show WiFi status
ifconfig                    # Show network interfaces
ping 8.8.8.8               # Test internet
```

### **Reboot ESP32**
```
Arduino IDE Serial Monitor:
Type: restart
Then press Enter

Or:
Physically press the "EN" button on ESP32
```

---

## **📊 Topology Diagram**

```
HOME NETWORK (192.168.1.0/24)
│
├─ RASPBERRY PI (192.168.1.100)
│  ├─ Anvil Fork (http://192.168.1.100:8545)
│  │  └─ SmartContract (0x5FbDB...)
│  ├─ Go Middleware (listening to events)
│  │  └─ Connects to Anvil & MQTT
│  └─ Mosquitto MQTT Broker (tcp://localhost:1883)
│
├─ DEVELOPMENT MACHINE (192.168.1.50)
│  ├─ Next.js Frontend (http://localhost:3000)
│  │  └─ Connects to Anvil RPC on Pi
│  └─ MetaMask Wallet
│       └─ Chain: Anvil (31337)
│
└─ ESP32 MICROCONTROLLER (192.168.1.101)
   ├─ Connects to WiFi
   ├─ Subscribes to MQTT (home/room/0)
   └─ Relay Board
       └─ AC Loads (lights, fans, AC)
```

---

## **🛠️ File Locations**

```
Smart Contract Deployment:
~/homechain/smart-contracts/
├── foundry.toml
├── src/HomeAutomation.sol
├── test/HomeAutomation.t.sol
├── script/Deploy.s.sol
└── out/HomeAutomation.sol/HomeAutomation.json  (ABI after build)

Go Middleware:
~/homechain/middleware/
├── main.go
├── go.mod
├── go.sum
└── .env

Frontend:
~/homechain/frontend/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── abi/abi.js
│   └── room/[roomid]/page.jsx
├── config.js
├── package.json
└── .env.local

Hardware:
~/Arduino/
└── sketches/
    └── mqtt_controller.ino

Documentation:
~/homechain/docs/
├── PROJECT_GUIDE.md
├── PHASE1_SMARTCONTRACT.md
├── PHASE2_MIDDLEWARE.md
├── PHASE3_FRONTEND.md
├── PHASE4_HARDWARE.md
├── QUICK_REFERENCE.md  (YOU ARE HERE)
├── TROUBLESHOOTING.md
└── API_REFERENCE.md
```

---

## **🔑 Private Keys & Secrets**

⚠️ **KEEP THESE SAFE! NEVER commit to GitHub!**

```
Anvil Account #0 Private Key:
0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded46b5b72f1663d23b3b2

WiFi Password: (Your home WiFi)

MQTT Credentials: (If enabled, set in Mosquitto config)

MetaMask Import:
Type: Private Key
Paste: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded46b5b72f1663d23b3b2
```

---

## **📞 Support Checklist**

If something breaks:

1. **Check Logs**
   - Anvil: Console output
   - Go: `journalctl -u homechain-middleware -f`
   - ESP32: Arduino Serial Monitor
   - Frontend: Browser DevTools (F12)

2. **Verify Connectivity**
   - Pi online: `ping 192.168.1.100`
   - Anvil running: `curl http://192.168.1.100:8545`
   - MQTT: `mosquitto_pub -h 192.168.1.100 -t "test" -m "hello"`

3. **Test Manually**
   - Call contract: `cast call 0x... "getRoomCount()" --rpc-url http://192.168.1.100:8545`
   - Publish MQTT: `mosquitto_pub -h 192.168.1.100 -t "home/room/0" -m '{...}'`
   - Check relay: Watch LED on relay module or listen for click

4. **Restart Everything**
   ```bash
   sudo systemctl restart mosquitto
   pkill -f anvil && anvil --fork-url https://binance.llamarpc.com --host 0.0.0.0 &
   pkill -f homechain-middleware && cd middleware && go run main.go &
   ```

---

**Version:** 1.0  
**Last Updated:** January 27, 2026
