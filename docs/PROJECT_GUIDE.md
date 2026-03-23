# **HomeChain - Complete Project Documentation**

## **Table of Contents**
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [System Requirements](#system-requirements)
5. [Quick Start](#quick-start)
6. [Detailed Setup](#detailed-setup)
7. [Project Structure](#project-structure)
8. [Workflow](#workflow)

---

## **Project Overview**

**HomeChain** is a **blockchain-based home automation system** that combines Solidity smart contracts, Go middleware, Next.js frontend, and ESP32 hardware to create a decentralized, role-based smart home control platform.

### **Key Features**
- ✅ Decentralized access control via blockchain
- ✅ Role-based permissions (SuperAdmin, Room Owner, Guest)
- ✅ Time-bound guest access with Unix timestamps
- ✅ Real-time MQTT-driven hardware control
- ✅ Instant blockchain transactions on local Anvil fork
- ✅ Responsive Next.js dashboard
- ✅ Immutable audit trail of all state changes

### **Use Case**
A homeowner can grant temporary, time-limited access to appliances (lights, fans, AC) to guests or family members. Each access control decision is enforced by the blockchain, making it impossible for any central server to override permissions.

---

## **Architecture**

### **High-Level System Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                          │
│  (Next.js 14 Dashboard + Wagmi + Mantine)                           │
│  - Wallet Connection (MetaMask, WalletConnect)                      │
│  - Appliance Control UI                                              │
│  - Permission Management                                             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Web3 RPC Calls (read/write)
                           │ (Contract Address: stored in config)
┌──────────────────────────▼──────────────────────────────────────────┐
│                     BLOCKCHAIN LAYER                                 │
│  (Solidity Smart Contract on Anvil Fork @ PI_IP:8545)              │
│  - HomeAutomation.sol                                                │
│  - Role-Based Access Control (RBAC)                                  │
│  - Room & Appliance Management                                       │
│  - Time-Locked Guest Access                                          │
│  - Emits: stateChange(roomId, applianceId, state)                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Event Emission (logs)
                           │ (Go middleware listens)
┌──────────────────────────▼──────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                                  │
│  (Go Service on Raspberry Pi)                                        │
│  - Connects to Anvil RPC @ http://PI_IP:8545                        │
│  - Listens for stateChange events                                    │
│  - Decodes event logs (roomId, applianceId, state)                  │
│  - Constructs MQTT payload: {"pin": X, "mode": Y}                   │
│  - Publishes to Mosquitto broker @ localhost:1883                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ MQTT Publish (JSON message)
                           │ Topic: home/room/<roomId>
┌──────────────────────────▼──────────────────────────────────────────┐
│                  MQTT BROKER LAYER                                   │
│  (Mosquitto on Raspberry Pi)                                         │
│  - Central message hub                                               │
│  - Forwards messages to subscribers                                  │
│  - Retains last message for QoS                                      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ MQTT Subscribe
                           │ (WiFi over local network)
┌──────────────────────────▼──────────────────────────────────────────┐
│                   HARDWARE LAYER                                     │
│  (ESP32 Microcontroller)                                             │
│  - Subscribes to MQTT topic home/room/<roomId>                      │
│  - Parses JSON: extracts pin & mode                                  │
│  - Sets GPIO pin HIGH/LOW                                            │
│  - Triggers relay board                                              │
│  - Power: Hi-Link HLK-5M05 (AC → 5V DC)                             │
│  - Yuyihon Relays: Toggle lights, fans, AC                           │
└─────────────────────────────────────────────────────────────────────┘
```

### **Data Flow Example: User Toggles Light ON**

```
1. USER CLICKS TOGGLE
   └─> Browser: MetaMask pops up for confirmation

2. WALLET SIGNS & BROADCASTS
   └─> Transaction: changeState(roomId=0, applianceId=2)

3. ANVIL MINES BLOCK (~1 second)
   └─> Smart Contract: Updates data[0][2].state = true
   └─> Emits: stateChange(0, 2, true)

4. GO MIDDLEWARE DETECTS EVENT
   └─> Filters transaction logs
   └─> Decodes: roomId=0, applianceId=2, state=true

5. GO READS ON-CHAIN STATE
   └─> Calls: getSwitchState(0, 2) → true
   └─> Calls: getPinNo(0, 2) → 14
   └─> Calls: checkIsMultiparams(0, 2) → false

6. GO PUBLISHES TO MQTT
   └─> Topic: home/room/0
   └─> Payload: {"pin": 14, "mode": 1, "state": true}

7. MOSQUITTO FORWARDS MESSAGE
   └─> Broadcasts to all subscribers on topic

8. ESP32 RECEIVES & PARSES
   └─> Extracts: pin=14, mode=1
   └─> Calls: digitalWrite(14, LOW)  // active-low relay

9. RELAY ACTUATES
   └─> GPIO pin pulled to ground
   └─> Relay coil energizes
   └─> Relay contacts close
   └─> AC circuit completes
   └─> LIGHT TURNS ON PHYSICALLY

10. FRONTEND UPDATES (Optional)
    └─> Polls contract state or listens to events
    └─> Shows: "Light is ON" with green toggle
```

---

## **Technology Stack**

| Layer | Component | Technology | Version | Purpose |
|-------|-----------|-----------|---------|---------|
| **Smart Contract** | Blockchain | Solidity | ^0.8.19 | Contract logic, RBAC, state mgmt |
| | Framework | Foundry | Latest | Compile, deploy, test contracts |
| | Testnet | Anvil (BSC Fork) | - | Local dev environment (10k BNB) |
| **Middleware** | Language | Go | 1.21+ | High-concurrency event listener |
| | Blockchain Client | go-ethereum (geth) | Latest | RPC communication |
| | Messaging | MQTT (Paho) | 1.4.3 | Pub/sub for hardware commands |
| | Broker | Mosquitto | 2.0+ | MQTT message server |
| **Frontend** | Framework | Next.js | 14.x | React app router, SSR |
| | Web3 Library | Wagmi | 2.x | Wallet hooks & contract calls |
| | Ethereum Library | Viem | Latest | Low-level blockchain operations |
| | Wallet UI | Web3Modal | 5.x | Wallet connection UI |
| | Component Library | Mantine | 7.x | Pre-built UI components |
| | Styling | Tailwind CSS | 3.x | Utility-first CSS |
| | State Management | React Query | 5.x | Server state caching |
| **Hardware** | Microcontroller | ESP32 | - | WiFi + GPIO control |
| | Single Board PC | Raspberry Pi | 3B+/4 | Anvil + Go + Mosquitto host |
| | Relay Board | Yuyihon | 8-Channel | AC switching via GPIO |
| | Power Supply | Hi-Link HLK-5M05 | 5W | AC→DC conversion |

---

## **System Requirements**

### **Minimum Hardware**
- **Raspberry Pi 3B+** (2GB RAM, 32GB microSD)
- **ESP32 Development Board**
- **Yuyihon 8-Channel Relay Module**
- **Hi-Link HLK-5M05 Power Module**
- **Micro USB cables** (Pi + ESP32)
- **Jumper wires** & breadboard

### **Network**
- **Local Network:** Pi and ESP32 on same WiFi/Ethernet
- **RPC Access:** Anvil accessible at `http://PI_IP:8545`
- **MQTT Broker:** Mosquitto on Pi (port 1883)

### **Software on Pi**
- **OS:** Raspberry Pi OS (Bullseye or newer)
- **Anvil:** Installed (via Foundry)
- **Go:** 1.21+
- **Mosquitto:** 2.0+

### **Development Machine**
- **Node.js:** 18+ (for Next.js frontend)
- **Foundry:** Latest (for smart contract)
- **Arduino IDE:** Latest (for ESP32 firmware)
- **MetaMask:** Browser extension (for testing)

---

## **Quick Start**

### **Step 1: Setup Raspberry Pi**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
~/.foundry/bin/foundryup

# Install Go
wget https://go.dev/dl/go1.21.0.linux-armv6l.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-armv6l.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Mosquitto
sudo apt install mosquitto mosquitto-clients -y
sudo systemctl enable mosquitto

# Verify installations
anvil --version
go version
mosquitto -v
```

### **Step 2: Launch Anvil**

```bash
# On Pi, start Anvil fork
anvil --fork-url https://binance.llamarpc.com --host 0.0.0.0

# Output will show:
# Listening on 0.0.0.0:8545
# Note the 10 test accounts with private keys
```

**Save Anvil Output:**
```
Account #0: 0x1234...5678 (private key: 0xabcd...ef01)
...
Listening on 0.0.0.0:8545
```

### **Step 3: Deploy Smart Contract**

```bash
# On development machine
cd smart-contracts
forge create src/HomeAutomation.sol:HomeAutomation \
  --rpc-url http://PI_IP:8545 \
  --private-key 0xabc... (from Anvil account #0)

# Output:
# Deployed to: 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae
# Save this address in config.js
```

### **Step 4: Start Go Middleware**

```bash
# On Pi
cd middleware
go mod init home-automation
go get github.com/ethereum/go-ethereum/ethclient
go get github.com/eclipse/paho.mqtt.golang
go run main.go

# Should output:
# Connected to RPC: http://127.0.0.1:8545
# Subscribed to HomeAutomation events
# MQTT broker: tcp://localhost:1883
```

### **Step 5: Launch Next.js Dashboard**

```bash
# On development machine
cd frontend
npm install
npm run dev

# Open http://localhost:3000
# Connect MetaMask to Anvil chain (chainId 31337)
# Import test account from Anvil
```

### **Step 6: Flash ESP32**

```bash
# In Arduino IDE
1. Board: ESP32 Dev Module
2. Load firmware from hardware/esp32/mqtt_controller.ino
3. Set WiFi SSID, password, Broker IP
4. Upload to ESP32
5. Monitor Serial @ 115200 baud
```

### **Step 7: Test End-to-End**

```bash
# In Next.js dashboard
1. Click "Connect Wallet" → MetaMask
2. Switch to Anvil (chainId 31337)
3. Click appliance toggle
4. Watch Go middleware logs for event
5. Check ESP32 serial for MQTT message
6. Relay should toggle (LED/relay board LED lights up)
```

---

## **Detailed Setup**

### **Raspberry Pi Network Configuration**

**Find Pi's IP:**
```bash
# On Pi
hostname -I
# Output: 192.168.1.100 (example)

# Or from laptop
nmap -sn 192.168.1.0/24 | grep -i raspberry
```

**Use in commands:**
```bash
# Replace PI_IP with actual IP
# Example: 192.168.1.100

anvil --fork-url https://binance.llamarpc.com --host 0.0.0.0
# Access from laptop at: http://192.168.1.100:8545
```

### **Foundry Configuration**

Create `foundry.toml`:
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.19"

# For deployment
[rpc_endpoints]
local = "http://192.168.1.100:8545"
bsc_testnet = "https://data-seed-prebsc-1-s1.binance.org:8545"

[etherscan]
bsc = { key = "", chain = 97 }
```

### **MetaMask Custom Network Setup**

1. Open MetaMask → Settings → Networks → Add Network
2. **Network Name:** Anvil Local
3. **RPC URL:** `http://192.168.1.100:8545`
4. **Chain ID:** 31337
5. **Currency Symbol:** BNB
6. **Block Explorer:** (Leave blank for local)
7. Click Save

### **Import Anvil Test Account**

1. MetaMask → Settings → Accounts → Import Account
2. **Type:** Private Key
3. **Paste:** `0x...` from Anvil output (Account #0)
4. Click Import
5. You now have 10,000 BNB on this account

---

## **Project Structure**

```
homechain_bsc/
│
├── docs/                          # Documentation (YOU ARE HERE)
│   ├── PROJECT_GUIDE.md           # Overview & setup
│   ├── PHASE1_SMARTCONTRACT.md   # Smart contract details
│   ├── PHASE2_MIDDLEWARE.md      # Go service details
│   ├── PHASE3_FRONTEND.md        # Next.js details
│   ├── PHASE4_HARDWARE.md        # ESP32 details
│   ├── QUICK_REFERENCE.md        # Checklists & snippets
│   ├── TROUBLESHOOTING.md        # Common issues
│   └── API_REFERENCE.md          # Function signatures
│
├── smart-contracts/               # Phase 1
│   ├── src/
│   │   └── HomeAutomation.sol    # Main contract
│   ├── test/
│   │   └── HomeAutomation.t.sol  # Foundry tests
│   ├── script/
│   │   └── Deploy.s.sol          # Deployment script
│   ├── foundry.toml
│   └── .env.example
│
├── middleware/                    # Phase 2
│   ├── main.go                   # Event listener + MQTT
│   ├── go.mod
│   ├── go.sum
│   └── .env.example
│
├── frontend/                      # Phase 3
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── login/page.jsx
│   │   ├── dashboard/page.jsx
│   │   ├── room/[roomid]/page.jsx
│   │   └── abi/abi.js
│   ├── components/
│   ├── context/
│   ├── config.js
│   ├── package.json
│   ├── next.config.mjs
│   └── .env.local.example
│
├── hardware/                      # Phase 4
│   └── esp32/
│       └── mqtt_controller.ino   # Arduino firmware
│
└── README.md                      # Quick reference
```

---

## **Workflow**

### **Development Workflow**

```
┌─ SMART CONTRACT CHANGES
│  ├─ Edit src/HomeAutomation.sol
│  ├─ Run: forge test
│  ├─ Run: forge build
│  └─ Run: forge script Deploy.s.sol --rpc-url http://PI_IP:8545 --broadcast
│
├─ MIDDLEWARE CHANGES
│  ├─ Edit middleware/main.go
│  ├─ Run: go build
│  ├─ Run: ./main
│  └─ Check logs for event listener
│
├─ FRONTEND CHANGES
│  ├─ Edit frontend/app/page.js (or components)
│  ├─ npm run dev
│  └─ Reload browser @ http://localhost:3000
│
└─ HARDWARE CHANGES
   ├─ Edit hardware/esp32/mqtt_controller.ino
   ├─ Upload via Arduino IDE
   └─ Monitor Serial @ 115200 baud

FULL END-TO-END TEST:
1. Dashboard toggle appliance
2. MetaMask confirms tx
3. Go middleware logs event
4. MQTT publishes message
5. ESP32 receives & parses
6. GPIO triggers relay
7. Physical device changes state
```

### **Common Tasks**

| Task | Command/Steps |
|------|---------------|
| Deploy contract | `forge script Deploy.s.sol --rpc-url http://PI_IP:8545 --broadcast --private-key 0x...` |
| Start Go service | `cd middleware && go run main.go` |
| View Anvil state | `cast call 0x... "getRoomCount()" --rpc-url http://PI_IP:8545` |
| Add room on-chain | Use dashboard UI or: `cast send 0x... "addRoom(string)" "Living Room" --rpc-url http://PI_IP:8545 --private-key 0x...` |
| Restart Mosquitto | `sudo systemctl restart mosquitto` |
| Monitor MQTT | `mosquitto_sub -h localhost -t "home/#" -v` |
| Flash ESP32 | Arduino IDE → Upload |

---

## **Next Steps**

1. **Read Phase 1:** [PHASE1_SMARTCONTRACT.md](./PHASE1_SMARTCONTRACT.md) — Smart contract architecture & deployment
2. **Read Phase 2:** [PHASE2_MIDDLEWARE.md](./PHASE2_MIDDLEWARE.md) — Go middleware event listener
3. **Read Phase 3:** [PHASE3_FRONTEND.md](./PHASE3_FRONTEND.md) — Next.js dashboard setup
4. **Read Phase 4:** [PHASE4_HARDWARE.md](./PHASE4_HARDWARE.md) — ESP32 firmware & wiring
5. **Troubleshoot:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Common issues & fixes
6. **Quick Ref:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) — Checklists & snippets

---

**Version:** 1.0  
**Last Updated:** January 27, 2026  
**Author:** HomeChain Development Team
