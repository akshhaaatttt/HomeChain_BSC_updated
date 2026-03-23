# **API Reference**

## **Smart Contract API (Solidity)**

### **Data Structures**

#### **Room**
```solidity
struct Room {
    uint256 roomId;           // Unique identifier (0-based)
    string roomName;          // User-friendly name
    uint256 noOfAppliances;   // Number of appliances in this room
}
```

#### **Appliance**
```solidity
struct Appliance {
    uint256 roomId;              // Parent room ID
    uint256 applianceId;         // Unique per room (0-based)
    uint8 pinNo;                 // GPIO pin (1-255)
    bool state;                  // Current state (true=ON, false=OFF)
    string details;              // Name/description
    bool ismultiparameters;      // Multi-parameter support flag
    uint8[] multiparams;         // Array of multi-param values (e.g., [0-100] for brightness)
    uint8[] multiparamPinNo;     // Array of pins for each multi-param
}
```

#### **AllowedAddresses**
```solidity
struct AllowedAddresses {
    bool isallowed;    // Is address allowed?
    uint256 startTime; // Unix timestamp (0 = no restriction)
    uint256 endTime;   // Unix timestamp (0 = no restriction)
}
```

---

### **Events**

#### **stateChange**
Emitted when a single appliance state changes
```solidity
event stateChange(
    uint256 indexed roomId,
    uint256 indexed applianceId,
    bool state
);
```
**Parameters:**
- `roomId`: Room containing appliance
- `applianceId`: Appliance within room
- `state`: New state (true=ON, false=OFF)

**Example JSON (MQTT):**
```json
{
  "pin": 14,
  "mode": 1,
  "ismultistate": false,
  "multistate": 0,
  "roomId": 0,
  "applianceId": 0,
  "contract": "0x5FbDB2315678afccb333f6a5c07ee7ba7e22",
  "timestamp": 1704067200
}
```

---

#### **multiStateChange**
Emitted when multi-parameter appliance changes
```solidity
event multiStateChange(
    uint256 indexed roomId,
    uint256 indexed applianceId,
    uint8[] multistate
);
```
**Parameters:**
- `roomId`: Room containing appliance
- `applianceId`: Appliance within room
- `multistate`: Array of new values

**Example JSON (MQTT):**
```json
{
  "pin": 15,
  "mode": 1,
  "ismultistate": true,
  "multistate": [75, 255, 128],
  "roomId": 0,
  "applianceId": 1,
  "contract": "0x5FbDB2315678afccb333f6a5c07ee7ba7e22",
  "timestamp": 1704067200
}
```

---

#### **AddRoomOwner**
Emitted when address is made room owner
```solidity
event AddRoomOwner(address indexed owner, uint256 indexed roomId);
```

#### **RemoveApplianceAccess**
Emitted when guest access is revoked
```solidity
event RemoveApplianceAccess(
    address indexed guestAddress,
    uint256 indexed roomId,
    uint256 indexed applianceId
);
```

---

### **State-Changing Functions**

#### **addRoom(string memory roomName) → uint256**
Add a new room
```solidity
// Returns: roomId (auto-incremented)
// Restrictions: Only SuperAdmin
// Gas: ~50,000

// Example (Cast):
cast send 0x5FbDB... "addRoom(string)" "Living Room" \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974...

// JS/Wagmi:
await writeContract({
  address: CONTRACT_ADDRESS,
  abi: contractAbi,
  functionName: 'addRoom',
  args: ['Living Room']
})
```

---

#### **addAppliances(uint256 roomId, string[] memory details, uint8[] memory pinNo, bool[] memory ismultiparams) → uint256**
Add appliances to a room
```solidity
// Parameters:
// - roomId: Target room ID
// - details: Array of appliance names ["Light", "Fan"]
// - pinNo: Array of GPIO pins [14, 15]
// - ismultiparams: Array of multi-param flags [false, true]

// Returns: Count of appliances added
// Restrictions: Room owner
// Gas: ~150,000

// Example (Cast):
cast send 0x5FbDB... \
  "addAppliances(uint256,string[],uint8[],bool[])" \
  0 \
  '["Bulb","Dimmer"]' \
  '[14,15]' \
  '[false,true]' \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0x...

// JS/Wagmi:
await writeContract({
  functionName: 'addAppliances',
  args: [
    0,  // roomId
    ['Bulb', 'Dimmer'],  // details
    [14, 15],  // pinNo
    [false, true]  // ismultiparams
  ]
})
```

---

#### **editAppliances(uint256 roomId, uint256 applianceId, string memory newName, uint8 newPin) → bool**
Update appliance details
```solidity
// Parameters:
// - roomId: Room ID
// - applianceId: Appliance ID within room
// - newName: New description
// - newPin: New GPIO pin

// Returns: true if successful
// Restrictions: Room owner
// Gas: ~30,000

// Example (Cast):
cast send 0x5FbDB... \
  "editAppliances(uint256,uint256,string,uint8)" \
  0 0 "Main Light" 14 \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0x...
```

---

#### **changeState(uint256 roomId, uint256 applianceId)**
Toggle single-parameter appliance ON/OFF
```solidity
// Parameters:
// - roomId: Room ID
// - applianceId: Appliance ID within room

// Returns: nothing
// Restrictions: Owner or allowed address with valid time
// Gas: ~35,000
// Emits: stateChange event

// Example (Cast):
cast send 0x5FbDB... "changeState(uint256,uint256)" 0 0 \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0x...

// JS/Wagmi:
const hash = await writeContract({
  functionName: 'changeState',
  args: [BigInt(roomId), BigInt(applianceId)]
})

// Wait for confirmation
await waitForTransactionReceipt({ hash })
```

---

#### **changeState(uint256 roomId, uint256 applianceId, uint8[] memory newMultistate)**
Change multi-parameter appliance
```solidity
// Parameters:
// - roomId: Room ID
// - applianceId: Appliance ID within room
// - newMultistate: Array of new values [0-100, 0-255, etc.]

// Returns: nothing
// Restrictions: Owner or allowed address with valid time
// Gas: ~40,000-60,000
// Emits: multiStateChange event

// Example (Cast):
cast send 0x5FbDB... \
  "changeState(uint256,uint256,uint8[])" \
  0 1 \
  '[75,200,50]' \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0x...

// JS/Wagmi:
await writeContract({
  functionName: 'changeState',
  args: [
    BigInt(roomId),
    BigInt(applianceId),
    [75, 200, 50]  // Multi-params
  ]
})
```

---

#### **addRoomOwner(uint256 roomId, address newOwner) → bool**
Add co-owner to room
```solidity
// Parameters:
// - roomId: Room ID
// - newOwner: Address to make owner

// Returns: true if successful
// Restrictions: Current room owner or SuperAdmin
// Gas: ~25,000
// Emits: AddRoomOwner event

// Example (Cast):
cast send 0x5FbDB... \
  "addRoomOwner(uint256,address)" \
  0 0x1234567890123456789012345678901234567890 \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0x...
```

---

#### **allowGuestAccess(uint256 roomId, uint256 applianceId, address guestAddress, uint256 startTime, uint256 endTime) → bool**
Grant time-limited access to guest
```solidity
// Parameters:
// - roomId: Room ID
// - applianceId: Appliance ID (optional, all=255)
// - guestAddress: Guest address
// - startTime: Unix timestamp (0 = immediate)
// - endTime: Unix timestamp (0 = permanent)

// Returns: true if successful
// Restrictions: Room owner
// Gas: ~35,000

// Example (Cast):
# Give access today (2025-01-27) until tomorrow
cast send 0x5FbDB... \
  "allowGuestAccess(uint256,uint256,address,uint256,uint256)" \
  0 0 0x1234... 1706313600 1706400000 \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0x...

// JS/Wagmi:
const now = Math.floor(Date.now() / 1000);
const tomorrow = now + 86400;
await writeContract({
  functionName: 'allowGuestAccess',
  args: [
    BigInt(roomId),
    BigInt(applianceId),
    guestAddress,
    BigInt(now),
    BigInt(tomorrow)
  ]
})
```

---

#### **removeApplianceAccess(uint256 roomId, uint256 applianceId, address guestAddress) → bool**
Revoke guest access
```solidity
// Parameters:
// - roomId: Room ID
// - applianceId: Appliance ID
// - guestAddress: Guest to revoke

// Returns: true if successful
// Restrictions: Room owner
// Gas: ~20,000
// Emits: RemoveApplianceAccess event

// Example (Cast):
cast send 0x5FbDB... \
  "removeApplianceAccess(uint256,uint256,address)" \
  0 0 0x1234... \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0x...
```

---

### **View Functions (Read-Only)**

#### **getRoomCount() → uint256**
Get total number of rooms
```solidity
// Returns: Count (0-based indexing)
// Gas: ~100 (call, not tx)

// Example (Cast):
cast call 0x5FbDB... "getRoomCount()" \
  --rpc-url http://192.168.1.100:8545
# Output: 3

// JS/Wagmi:
const count = await readContract({
  functionName: 'getRoomCount',
  args: []
})
```

---

#### **getRoom(uint256 roomId) → Room**
Get room details
```solidity
// Returns: Room struct {roomId, roomName, noOfAppliances}
// Gas: ~500

// Example (Cast):
cast call 0x5FbDB... "getRoom(uint256)" 0 \
  --rpc-url http://192.168.1.100:8545
# Output: 0 "Living Room" 2

// JS/Wagmi:
const room = await readContract({
  functionName: 'getRoom',
  args: [BigInt(roomId)]
})
// Returns: {roomId: 0n, roomName: "Living Room", noOfAppliances: 2n}
```

---

#### **getApplianceCount(uint256 roomId) → uint256**
Get appliances in room
```solidity
// Returns: Count of appliances
// Gas: ~500

// Example (Cast):
cast call 0x5FbDB... "getApplianceCount(uint256)" 0 \
  --rpc-url http://192.168.1.100:8545
# Output: 2
```

---

#### **getAppliance(uint256 roomId, uint256 applianceId) → Appliance**
Get appliance details
```solidity
// Returns: Appliance struct
// Gas: ~1500

// Example (Cast):
cast call 0x5FbDB... "getAppliance(uint256,uint256)" 0 0 \
  --rpc-url http://192.168.1.100:8545
# Output: 0 0 14 true "Main Light" false [] []
```

---

#### **getSwitchState(uint256 roomId, uint256 applianceId) → bool**
Get current ON/OFF state
```solidity
// Returns: true=ON, false=OFF
// Gas: ~600

// Example (Cast):
cast call 0x5FbDB... "getSwitchState(uint256,uint256)" 0 0 \
  --rpc-url http://192.168.1.100:8545
# Output: true (light is ON)
```

---

#### **getPinNo(uint256 roomId, uint256 applianceId) → uint8**
Get GPIO pin number
```solidity
// Returns: Pin number (1-255)
// Gas: ~600

// Example (Cast):
cast call 0x5FbDB... "getPinNo(uint256,uint256)" 0 0 \
  --rpc-url http://192.168.1.100:8545
# Output: 14
```

---

#### **checkIsMultiparams(uint256 roomId, uint256 applianceId) → bool**
Check if appliance supports multi-parameters
```solidity
// Returns: true=multi-param, false=binary
// Gas: ~600

// Example (Cast):
cast call 0x5FbDB... "checkIsMultiparams(uint256,uint256)" 0 1 \
  --rpc-url http://192.168.1.100:8545
# Output: true (dimmer supports 0-100 brightness)
```

---

#### **getMultiparamsState(uint256 roomId, uint256 applianceId) → uint8[]**
Get all multi-parameter values
```solidity
// Returns: Array of current values
// Gas: ~1500

// Example (Cast):
cast call 0x5FbDB... "getMultiparamsState(uint256,uint256)" 0 1 \
  --rpc-url http://192.168.1.100:8545
# Output: [75, 200, 50]
```

---

#### **getMultiparamsPinNo(uint256 roomId, uint256 applianceId) → uint8[]**
Get pins for multi-parameters
```solidity
// Returns: Array of GPIO pins
// Gas: ~1500

// Example (Cast):
cast call 0x5FbDB... "getMultiparamsPinNo(uint256,uint256)" 0 1 \
  --rpc-url http://192.168.1.100:8545
# Output: [15, 16, 17]
```

---

#### **owner(uint256 roomId, address userAddress) → bool**
Check if user is room owner
```solidity
// Returns: true=owner, false=not owner
// Gas: ~600

// Example (Cast):
cast call 0x5FbDB... "owner(uint256,address)" 0 0x1234... \
  --rpc-url http://192.168.1.100:8545
# Output: true
```

---

#### **checkAllowedAddress(uint256 roomId, uint256 applianceId, address userAddress) → bool**
Check if user can control appliance (includes time verification)
```solidity
// Returns: true=allowed (and time is valid), false=not allowed
// Gas: ~700

// Example (Cast):
cast call 0x5FbDB... \
  "checkAllowedAddress(uint256,uint256,address)" \
  0 0 0x1234... \
  --rpc-url http://192.168.1.100:8545
# Output: true
```

---

### **Special Addresses**

**SuperAdmin:** `0x1111111111111111111111111111111111111111`
- Controls rooms
- Sets room owners
- Can be changed by governance

---

## **Go Middleware API**

### **Blockchain Interface**

#### **Event Listener**
```go
// Subscribes to HomeAutomation contract events
// Automatically decodes stateChange and multiStateChange

// Data received:
type Event struct {
    RoomId      uint64
    ApplianceId uint64
    State       bool         // For single-param
    MultiState  []uint8      // For multi-param
}
```

#### **Contract View Calls**
```go
// getPinNo(roomId, applianceId)
pin, _ := contract.GetPinNo(context.Background(), big.NewInt(0), big.NewInt(0))

// checkIsMultiparams(roomId, applianceId)
isMulti, _ := contract.CheckIsMultiparams(context.Background(), big.NewInt(0), big.NewInt(0))

// getMultiparamsState(roomId, applianceId)
params, _ := contract.GetMultiparamsState(context.Background(), big.NewInt(0), big.NewInt(0))
```

---

### **MQTT API**

#### **Topic Structure**
```
home/room/{roomId}/appliance/{applianceId}
```

#### **Message Format**
```json
{
  "pin": 14,                    // GPIO pin number (uint8)
  "mode": 1,                    // 1=ON, 0=OFF (uint8)
  "ismultistate": false,        // Single or multi-param (bool)
  "multistate": [],             // Array for multi-params (uint8[])
  "roomId": 0,                  // Room ID (uint256)
  "applianceId": 0,             // Appliance ID (uint256)
  "contract": "0x5FbDB...",     // Contract address (string)
  "timestamp": 1704067200       // Unix timestamp (uint64)
}
```

#### **Subscribe Topic**
```
home/room/#
```
Subscribes to all rooms

#### **Broker Configuration**
```
Host: 192.168.1.100
Port: 1883
Protocol: MQTT 3.1.1
Keepalive: 60 seconds
```

---

## **Frontend (Next.js) API**

### **Wagmi Hooks**

#### **useAccount**
```typescript
import { useAccount } from 'wagmi'

const Account = () => {
  const { address, isConnecting, isDisconnected } = useAccount()
  
  return (
    <div>
      {address && <p>Account: {address}</p>}
      {isConnecting && <p>Connecting...</p>}
      {isDisconnected && <p>Disconnected</p>}
    </div>
  )
}
```

---

#### **useConnect**
```typescript
import { useConnect } from 'wagmi'

const Connect = () => {
  const { connectors, connect } = useConnect()
  
  return (
    <div>
      {connectors.map((connector) => (
        <button key={connector.uid} onClick={() => connect({ connector })}>
          Connect with {connector.name}
        </button>
      ))}
    </div>
  )
}
```

---

#### **useWriteContract**
```typescript
import { useWriteContract } from 'wagmi'

const ToggleSwitch = ({ roomId, applianceId }) => {
  const { writeContract, isPending } = useWriteContract()
  
  const handleToggle = () => {
    writeContract({
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      abi: contractAbi,
      functionName: 'changeState',
      args: [BigInt(roomId), BigInt(applianceId)]
    })
  }
  
  return <button onClick={handleToggle} disabled={isPending}>Toggle</button>
}
```

---

#### **useReadContract**
```typescript
import { useReadContract } from 'wagmi'

const RoomInfo = ({ roomId }) => {
  const { data: room } = useReadContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: 'getRoom',
    args: [BigInt(roomId)]
  })
  
  return <div>Room: {room?.roomName}</div>
}
```

---

### **Wagmi Configuration**

```typescript
// wagmi.config.ts
import { createConfig, http } from 'wagmi'

const anvilChain = {
  id: 31337,
  name: 'Anvil',
  network: 'anvil',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://192.168.1.100:8545'] },
    public: { http: ['http://192.168.1.100:8545'] }
  }
}

export const config = createConfig({
  chains: [anvilChain],
  transports: {
    [anvilChain.id]: http('http://192.168.1.100:8545')
  }
})
```

---

### **Environment Variables**

```bash
# .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afccb333f6a5c07ee7ba7e22ce08
NEXT_PUBLIC_RPC_URL=http://192.168.1.100:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

---

## **ESP32 Firmware API**

### **GPIO Pin Mapping**

| Pin | Device     | Mode           | Usage              |
|-----|-----------|----------------|-------------------|
| 14  | Relay 1   | OUTPUT, LOW=ON | Main Lights        |
| 15  | Relay 2   | OUTPUT, LOW=ON | Fans               |
| 16  | Relay 3   | OUTPUT, LOW=ON | AC/Heating         |
| 17  | Relay 4   | OUTPUT, LOW=ON | Door Lock          |
| 18  | Relay 5   | OUTPUT, LOW=ON | Appliance 5        |
| 19  | Relay 6   | OUTPUT, LOW=ON | Appliance 6        |
| 22  | Relay 7   | OUTPUT, LOW=ON | Appliance 7        |
| 23  | Relay 8   | OUTPUT, LOW=ON | Appliance 8        |

---

### **MQTT Message Handling**

```cpp
void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
  // Parse JSON
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload, length);
  
  // Extract fields
  uint8_t pin = doc["pin"];
  uint8_t mode = doc["mode"];
  bool isMultistate = doc["ismultistate"];
  
  if (isMultistate) {
    JsonArray multistate = doc["multistate"];
    // Handle multi-param device
    for (int i = 0; i < multistate.size(); i++) {
      analogWrite(multiParamPins[i], multistate[i]);
    }
  } else {
    // Handle binary device
    digitalWrite(pin, mode ? LOW : HIGH);  // Active-low
  }
}
```

---

### **Serial Commands**

Monitor ESP32 via Serial at 115200 baud:
```
✅ WiFi connected! IP: 192.168.1.150
✅ MQTT connected!
✅ Subscribed to: home/room/0
📨 Message received on topic: home/room/0
💡 PIN 14 SET TO LOW
...
```

---

## **Common Operations**

### **Add a New Room (CLI)**
```bash
cast send 0x5FbDB... "addRoom(string)" "Bedroom" \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded46b5b72f1663d23b3b2
```

### **Add Appliance (CLI)**
```bash
cast send 0x5FbDB... \
  "addAppliances(uint256,string[],uint8[],bool[])" \
  0 \
  '["Light","Fan"]' \
  '[14,15]' \
  '[false,false]' \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974...
```

### **Toggle Appliance (CLI)**
```bash
cast send 0x5FbDB... "changeState(uint256,uint256)" 0 0 \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974...
```

### **Check Appliance State (CLI)**
```bash
cast call 0x5FbDB... "getSwitchState(uint256,uint256)" 0 0 \
  --rpc-url http://192.168.1.100:8545
```

### **Monitor MQTT**
```bash
mosquitto_sub -h 192.168.1.100 -t "home/#" -v
```

### **Test MQTT Publish**
```bash
mosquitto_pub -h 192.168.1.100 -t "home/room/0" \
  -m '{"pin":14,"mode":1,"ismultistate":false,"multistate":[],"roomId":0,"applianceId":0,"contract":"0x5FbDB...","timestamp":1704067200}'
```

---

**Version:** 1.0  
**Last Updated:** January 27, 2026
