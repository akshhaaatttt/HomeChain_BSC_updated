# **Phase 2: Middleware Layer (Go Service) - Complete Guide**

## **Table of Contents**
1. [Middleware Overview](#middleware-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Code Walkthrough](#code-walkthrough)
5. [Event Listening](#event-listening)
6. [MQTT Publishing](#mqtt-publishing)
7. [Configuration](#configuration)
8. [Running & Monitoring](#running--monitoring)
9. [Troubleshooting](#troubleshooting)

---

## **Middleware Overview**

The **Go middleware** is the critical bridge between your blockchain and physical hardware. It:

1. **Listens** to the smart contract's blockchain events
2. **Decodes** transaction data to extract room/appliance/state info
3. **Reads** on-chain state (GPIO pins, multi-param values)
4. **Publishes** MQTT messages to trigger hardware actions

### **Why Go?**
- ✅ **High concurrency:** Handle many connections simultaneously
- ✅ **Fast:** Low latency between event detection and MQTT publish
- ✅ **Efficient:** Minimal memory footprint (perfect for Raspberry Pi)
- ✅ **Reliable:** Built-in error handling and goroutines

### **Technology Stack**
- **go-ethereum (geth):** Blockchain RPC client
- **eclipse/paho.mqtt.golang:** MQTT publisher
- **Go 1.21+**

---

## **Architecture**

### **Data Flow in Middleware**

```
┌─────────────────────────┐
│   Anvil RPC             │
│ (http://PI_IP:8545)     │
└────────────┬────────────┘
             │ WebSocket subscription
             │ (SubscribeFilterLogs)
             │
┌────────────▼────────────────────────┐
│  Go Middleware Service              │
│                                     │
│  1. Listen to blockchain events   │
│  2. Filter by function selector    │
│  3. Decode event logs              │
│  4. Read contract state (view calls) │
│  5. Construct MQTT payload         │
│  6. Publish to broker              │
└────────────┬────────────────────────┘
             │ MQTT Publish (JSON)
             │ (Mosquitto @ localhost:1883)
             │
┌────────────▼────────────────────────┐
│  Mosquitto MQTT Broker              │
│  (On same Pi)                       │
│                                     │
│  Topics: home/room/0, home/room/1   │
│  Messages retained for QoS          │
└────────────┬────────────────────────┘
             │ MQTT Subscribe
             │
┌────────────▼────────────────────────┐
│  ESP32 Microcontroller (WiFi)       │
│  - Receives MQTT message            │
│  - Parses JSON payload              │
│  - Sets GPIO pin                    │
│  - Triggers relay                   │
└────────────────────────────────────┘
```

---

## **Setup & Installation**

### **Step 1: Install Go**

```bash
# On Raspberry Pi
wget https://go.dev/dl/go1.21.0.linux-armv6l.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-armv6l.tar.gz

# Add to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version
# Output: go version go1.21.0 linux/arm
```

### **Step 2: Install Dependencies**

```bash
# Create project directory
mkdir -p ~/homechain/middleware
cd ~/homechain/middleware

# Initialize Go module
go mod init homeautomation

# Get required packages
go get github.com/ethereum/go-ethereum/ethclient
go get github.com/ethereum/go-ethereum/common
go get github.com/ethereum/go-ethereum/accounts/abi
go get github.com/eclipse/paho.mqtt.golang

# Verify go.mod
cat go.mod
```

### **Step 3: Create .env File**

```bash
cat > .env << 'EOF'
# Blockchain
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afccb33d7d144aca41937d0cf6ae

# MQTT
MQTT_BROKER=tcp://localhost:1883
MQTT_CLIENT_ID=homechain-middleware
MQTT_TOPIC_PREFIX=home/room

# Logging
LOG_LEVEL=INFO
EOF
```

---

## **Code Walkthrough**

### **Complete main.go Example**

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Configuration
const (
	// Anvil fork RPC (on Raspberry Pi)
	RPC_URL = "http://127.0.0.1:8545"

	// Smart contract address (deployed on Anvil)
	CONTRACT_ADDRESS = "0x5FbDB2315678afccb33d7d144aca41937d0cf6ae"

	// MQTT broker on same Pi
	MQTT_BROKER = "tcp://localhost:1883"
	MQTT_CLIENT_ID = "homechain-middleware"
)

// Contract ABI (from HomeAutomation.sol)
const CONTRACT_ABI = `[
	{
		"type": "function",
		"name": "changeState",
		"inputs": [
			{"type": "uint256", "name": "_roomid"},
			{"type": "uint256", "name": "_applianceId"}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "event",
		"name": "stateChange",
		"inputs": [
			{"type": "uint256", "name": "roomId", "indexed": false},
			{"type": "uint256", "name": "applianceId", "indexed": false},
			{"type": "bool", "name": "state", "indexed": false}
		]
	},
	{
		"type": "function",
		"name": "getSwitchState",
		"inputs": [
			{"type": "uint256", "name": "_roomid"},
			{"type": "uint256", "name": "_applianceId"}
		],
		"outputs": [{"type": "bool"}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "getPinNo",
		"inputs": [
			{"type": "uint256", "name": "_roomid"},
			{"type": "uint256", "name": "_applianceId"}
		],
		"outputs": [{"type": "uint256"}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "checkIsMultiparams",
		"inputs": [
			{"type": "uint256", "name": "_roomid"},
			{"type": "uint256", "name": "_applianceId"}
		],
		"outputs": [{"type": "bool"}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "getMultiparamsState",
		"inputs": [
			{"type": "uint256", "name": "_roomid"},
			{"type": "uint256", "name": "_applianceId"}
		],
		"outputs": [{"type": "uint256"}],
		"stateMutability": "view"
	}
]`

// MQTT Message structure
type MQTTMessage struct {
	Pin            uint64 `json:"pin"`
	Mode           int    `json:"mode"`              // 0 or 1 for binary; 0-255 for variable
	IsMultistate   bool   `json:"ismultistate"`
	MultiState     uint64 `json:"multistate"`
	RoomID         uint64 `json:"roomId"`
	ApplianceID    uint64 `json:"applianceId"`
	ContractAddr   string `json:"contract"`
	Timestamp      int64  `json:"timestamp"`
}

func main() {
	log.Println("🚀 Starting HomeChain Middleware...")

	// Connect to Ethereum RPC
	client, err := ethclient.Dial(RPC_URL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to RPC: %v", err)
	}
	defer client.Close()
	log.Println("✅ Connected to RPC:", RPC_URL)

	// Verify connection
	chainID, err := client.ChainID(context.Background())
	if err != nil {
		log.Fatalf("❌ Failed to get chain ID: %v", err)
	}
	log.Printf("✅ Chain ID: %d (Anvil fork)\n", chainID)

	// Connect to MQTT broker
	mqttClient := connectMQTT()
	defer mqttClient.Disconnect(250)

	// Parse contract ABI
	parsedABI, err := abi.JSON(strings.NewReader(CONTRACT_ABI))
	if err != nil {
		log.Fatalf("❌ Failed to parse ABI: %v", err)
	}
	log.Println("✅ ABI parsed successfully")

	// Setup event filter
	contractAddr := common.HexToAddress(CONTRACT_ADDRESS)
	
	// Get the event signature for "stateChange(uint256,uint256,bool)"
	stateChangeEvent := parsedABI.Events["stateChange"]
	
	query := ethereum.FilterQuery{
		Addresses: []common.Address{contractAddr},
		Topics:    [][]common.Hash{{stateChangeEvent.ID}},
	}

	// Create channel for logs
	logs := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Fatalf("❌ Failed to subscribe to logs: %v", err)
	}
	defer sub.Unsubscribe()
	log.Printf("✅ Listening for events from contract: %s\n", CONTRACT_ADDRESS)

	// Event loop
	for {
		select {
		case err := <-sub.Err():
			log.Printf("❌ Subscription error: %v\n", err)
		case vLog := <-logs:
			handleEvent(client, parsedABI, vLog, mqttClient)
		}
	}
}

// connectMQTT sets up MQTT connection
func connectMQTT() mqtt.Client {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(MQTT_BROKER)
	opts.SetClientID(MQTT_CLIENT_ID)
	opts.SetAutoReconnect(true)

	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Fatalf("❌ MQTT connection failed: %v", token.Error())
	}
	log.Println("✅ Connected to MQTT broker:", MQTT_BROKER)
	return client
}

// handleEvent processes a stateChange event
func handleEvent(client *ethclient.Client, parsedABI abi.ABI, vLog types.Log, mqttClient mqtt.Client) {
	log.Printf("\n📡 New event detected in block %d\n", vLog.BlockNumber)

	// Decode log data
	var roomID, applianceID *big.Int
	var state bool

	if err := parsedABI.UnpackIntoInterface(
		[]interface{}{&roomID, &applianceID, &state},
		"stateChange",
		vLog.Data,
	); err != nil {
		log.Printf("❌ Failed to decode log: %v\n", err)
		return
	}

	log.Printf("📋 Decoded: roomID=%d, applianceID=%d, state=%v\n",
		roomID, applianceID, state)

	// Read pin number from contract
	pinResult, err := callContractView(client, parsedABI, "getPinNo", roomID, applianceID)
	if err != nil {
		log.Printf("❌ Failed to get pin: %v\n", err)
		return
	}
	pin := pinResult.(*big.Int).Uint64()
	log.Printf("📌 Pin number: %d\n", pin)

	// Check if multi-parameter device
	isMultiResult, err := callContractView(client, parsedABI, "checkIsMultiparams", roomID, applianceID)
	if err != nil {
		log.Printf("❌ Failed to check multi-params: %v\n", err)
		return
	}
	isMulti := isMultiResult.(bool)

	// Read multi-state if applicable
	var multiState uint64 = 0
	if isMulti {
		multiStateResult, err := callContractView(client, parsedABI, "getMultiparamsState", roomID, applianceID)
		if err != nil {
			log.Printf("⚠️  Failed to get multi-state: %v\n", err)
		} else {
			multiState = multiStateResult.(*big.Int).Uint64()
			log.Printf("🎚️  Multi-state value: %d\n", multiState)
		}
	}

	// Construct MQTT message
	mode := 0
	if state {
		mode = 1
	}

	msg := MQTTMessage{
		Pin:          pin,
		Mode:         mode,
		IsMultistate: isMulti,
		MultiState:   multiState,
		RoomID:       roomID.Uint64(),
		ApplianceID:  applianceID.Uint64(),
		ContractAddr: CONTRACT_ADDRESS,
		Timestamp:    int64(vLog.BlockNumber), // or use current timestamp
	}

	// Publish to MQTT
	publishMQTT(mqttClient, msg)
}

// callContractView calls a read-only contract function
func callContractView(client *ethclient.Client, parsedABI abi.ABI, 
	funcName string, roomID, applianceID *big.Int) (interface{}, error) {
	
	contractAddr := common.HexToAddress(CONTRACT_ADDRESS)

	// Pack function arguments
	input, err := parsedABI.Pack(funcName, roomID, applianceID)
	if err != nil {
		return nil, fmt.Errorf("failed to pack %s: %v", funcName, err)
	}

	// Call contract
	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contractAddr,
		Data: input,
	}, nil)
	if err != nil {
		return nil, fmt.Errorf("call failed: %v", err)
	}

	// Unpack result based on function
	switch funcName {
	case "getPinNo":
		var pinNo *big.Int
		if err := parsedABI.UnpackIntoInterface(&pinNo, funcName, result); err != nil {
			return nil, err
		}
		return pinNo, nil

	case "checkIsMultiparams":
		var isMulti bool
		if err := parsedABI.UnpackIntoInterface(&isMulti, funcName, result); err != nil {
			return nil, err
		}
		return isMulti, nil

	case "getMultiparamsState":
		var multiState *big.Int
		if err := parsedABI.UnpackIntoInterface(&multiState, funcName, result); err != nil {
			return nil, err
		}
		return multiState, nil

	default:
		return nil, fmt.Errorf("unknown function: %s", funcName)
	}
}

// publishMQTT publishes a message to MQTT broker
func publishMQTT(client mqtt.Client, msg MQTTMessage) {
	// Convert to JSON
	jsonData, err := json.MarshalIndent(msg, "", "  ")
	if err != nil {
		log.Printf("❌ Failed to marshal JSON: %v\n", err)
		return
	}

	// Publish to topic: home/room/<roomID>
	topic := fmt.Sprintf("home/room/%d", msg.RoomID)
	token := client.Publish(topic, 1, true, string(jsonData))
	token.Wait()

	if token.Error() != nil {
		log.Printf("❌ MQTT publish failed: %v\n", token.Error())
		return
	}

	log.Printf("✅ Published to %s:\n%s\n", topic, string(jsonData))
}
```

### **Minimal Starter Template**

If the above is too detailed, here's a minimal version:

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"strings"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/ethclient"
)

const (
	RPC_URL = "http://127.0.0.1:8545"
	MQTT_BROKER = "tcp://localhost:1883"
)

func main() {
	client, _ := ethclient.Dial(RPC_URL)
	mqttClient := mqtt.NewClient(mqtt.NewClientOptions().AddBroker(MQTT_BROKER))
	mqttClient.Connect()

	log.Println("Middleware running...")
	// Listen for events...
}
```

---

## **Event Listening**

### **What is an Event?**

When the smart contract executes `changeState()`, it emits a `stateChange` event:

```solidity
event stateChange(uint roomId, uint applianceId, bool state);
```

**Event signature (Keccak256 hash):**
```
keccak256("stateChange(uint256,uint256,bool)")
= 0x...
```

### **How Middleware Listens**

```go
// Step 1: Parse ABI to get event ID
stateChangeEvent := parsedABI.Events["stateChange"]
eventID := stateChangeEvent.ID  // Keccak256 hash

// Step 2: Create filter
query := ethereum.FilterQuery{
    Addresses: []common.Address{contractAddr},
    Topics:    [][]common.Hash{{eventID}},  // Filter by event type
}

// Step 3: Subscribe
logs := make(chan types.Log)
sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)

// Step 4: Loop and handle
for vLog := range logs {
    // vLog contains:
    // - vLog.Data: Event parameters (roomID, applianceID, state)
    // - vLog.BlockNumber: Block where event occurred
    // - vLog.TxHash: Transaction hash
}
```

### **Decoding Log Data**

```go
var roomID, applianceID *big.Int
var state bool

// Unpack the log data using ABI
abi.UnpackIntoInterface(
    []interface{}{&roomID, &applianceID, &state},
    "stateChange",
    vLog.Data,
)

// Now you have:
// roomID = 0, applianceID = 2, state = true
```

---

## **MQTT Publishing**

### **Message Format**

Middleware publishes to topic `home/room/<roomID>`:

```json
{
  "pin": 14,
  "mode": 1,
  "ismultistate": false,
  "multistate": 0,
  "roomId": 0,
  "applianceId": 2,
  "contract": "0x5FbDB2315678afccb33d7d144aca41937d0cf6ae",
  "timestamp": 12345678
}
```

### **Topic Structure**

```
home/room/0       ← All appliances in room 0
home/room/1       ← All appliances in room 1
...
```

ESP32 subscribes to specific topics:
```cpp
// ESP32 code
client.subscribe("home/room/0");  // Subscribe to room 0
```

### **Publishing Code**

```go
func publishMQTT(client mqtt.Client, msg MQTTMessage) {
    jsonData, _ := json.Marshal(msg)
    topic := fmt.Sprintf("home/room/%d", msg.RoomID)
    
    client.Publish(topic, 1, true, string(jsonData))
    log.Printf("Published to %s\n", topic)
}
```

---

## **Configuration**

### **Environment Variables**

Create `.env`:
```bash
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afccb33d7d144aca41937d0cf6ae
MQTT_BROKER=tcp://localhost:1883
MQTT_CLIENT_ID=homechain-middleware
LOG_LEVEL=INFO
```

### **Loading .env** (Optional package)

```bash
go get github.com/joho/godotenv

# In main.go
import "github.com/joho/godotenv"

func init() {
    godotenv.Load()  // Load .env file
}

rpcURL := os.Getenv("RPC_URL")
```

---

## **Running & Monitoring**

### **Build & Run**

```bash
# Compile
go build -o homechain-middleware main.go

# Run
./homechain-middleware

# Output should show:
# ✅ Connected to RPC: http://127.0.0.1:8545
# ✅ Connected to MQTT broker: tcp://localhost:1883
# ✅ Listening for events from contract: 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae
```

### **Run as Systemd Service** (Permanent)

```bash
# Create service file
sudo nano /etc/systemd/system/homechain-middleware.service
```

```ini
[Unit]
Description=HomeChain Middleware
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/homechain/middleware
ExecStart=/home/pi/homechain/middleware/homechain-middleware
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable homechain-middleware
sudo systemctl start homechain-middleware

# Monitor logs
journalctl -u homechain-middleware -f
```

### **Monitoring**

```bash
# Check if service is running
systemctl status homechain-middleware

# View real-time logs
journalctl -u homechain-middleware -f

# Check MQTT messages
mosquitto_sub -h localhost -t "home/#" -v

# Example output:
# home/room/0 {"pin":14,"mode":1,"ismultistate":false, ...}
```

---

## **Troubleshooting**

### **Issue: "Failed to connect to RPC"**
```bash
# Check Anvil is running on Pi
ssh pi@192.168.1.100
ps aux | grep anvil

# If not running, start it:
anvil --fork-url https://binance.llamarpc.com --host 0.0.0.0
```

### **Issue: "MQTT connection failed"**
```bash
# Check Mosquitto is running
sudo systemctl status mosquitto

# Restart broker
sudo systemctl restart mosquitto

# Test connection from Pi
mosquitto_pub -h localhost -t "test" -m "hello"
mosquitto_sub -h localhost -t "test"
```

### **Issue: "No events detected"**
```bash
# Verify contract address is correct
cast call 0x5FbDB... "getRoomCount()" --rpc-url http://PI_IP:8545

# Manually trigger event via CLI
cast send 0x5FbDB... "changeState(uint256,uint256)" 0 0 --rpc-url http://PI_IP:8545 --private-key 0x...

# Watch Go logs for event
# Should see: "📡 New event detected in block X"
```

### **Issue: "Failed to decode log"**
```bash
# Ensure ABI matches deployed contract
# Re-copy ABI from:
forge build
jq '.abi' out/HomeAutomation.sol/HomeAutomation.json
```

---

**Version:** 1.0  
**Last Updated:** January 27, 2026
