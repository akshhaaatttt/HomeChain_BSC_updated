# **Phase 1: Smart Contract Layer - Complete Guide**

## **Table of Contents**
1. [Smart Contract Overview](#smart-contract-overview)
2. [Data Structures](#data-structures)
3. [Access Control Logic](#access-control-logic)
4. [Function Reference](#function-reference)
5. [Foundry Setup](#foundry-setup)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Post-Deployment](#post-deployment)

---

## **Smart Contract Overview**

The `HomeAutomation.sol` contract is the **decentralized brain** of your system. It manages:
- **Rooms:** Groups of appliances (living room, bedroom, kitchen)
- **Appliances:** Individual controllable devices (light, fan, AC)
- **Users:** SuperAdmin, room owners, time-bound guests
- **Access Control:** Role-based permissions with time locks

### **Key Principles**
- **Immutability:** Once deployed, permissions cannot be overridden
- **Transparency:** All state changes emit events (audit trail)
- **Time-Locked Access:** Guests can only control appliances during authorized windows
- **No Central Authority:** No backdoor; blockchain enforces all rules

---

## **Data Structures**

### **1. Room Struct**

```solidity
struct Room {
    uint roomId;              // Unique room identifier (0, 1, 2, ...)
    string roomName;          // "Living Room", "Bedroom", etc.
    uint noOfAppliances;      // Count of appliances in this room
}
```

**Storage:** `Room[] public rooms` (dynamic array)

**Example:**
```solidity
Room(roomId=0, roomName="Living Room", noOfAppliances=3)
```

---

### **2. Appliance Struct**

```solidity
struct appliances {
    uint roomId;                      // Which room does it belong to?
    uint applianceId;                 // Index within room (0, 1, 2, ...)
    uint pinNo;                       // GPIO pin on ESP32 (e.g., 14)
    bool state;                       // Current state: ON/OFF
    string details;                   // Name: "Main Light", "Ceiling Fan"
    bool ismultiparameters;           // Can it vary? (0-255 for speed)
    uint multiparams;                 // Current value (0-255)
    uint8[5] multiparamPinNo;        // Alternative pins for multi-param devices
    mapping(address => allowedAddresses) allowedAddress;  // Access control
}
```

**Storage:** `mapping(uint room => mapping(uint applianceId => appliances)) public data`

**Example:**
```solidity
// Living room, appliance #0 (main light)
appliances {
    roomId: 0,
    applianceId: 0,
    pinNo: 14,
    state: true,        // Light is ON
    details: "Main Light",
    ismultiparameters: false,
    multiparams: 0
}

// Living room, appliance #2 (fan with speed)
appliances {
    roomId: 0,
    applianceId: 2,
    pinNo: 15,
    state: true,
    details: "Ceiling Fan",
    ismultiparameters: true,
    multiparams: 50      // Speed: 50% (0-100)
}
```

---

### **3. Access Control Struct**

```solidity
struct allowedAddresses {
    bool isallowed;        // Is this user allowed?
    uint startTime;        // Unix timestamp when access begins
    uint endTime;          // Unix timestamp when access expires (0 = never)
}
```

**Storage:** Inside each appliance, as a mapping `address => allowedAddresses`

**Example:**
```solidity
// Guest can control living room light for 24 hours
address guestAddress = 0x742d35Cc6634C0532925a3b844Bc5e8aF6b0d3f4;

allowedAddresses {
    isallowed: true,
    startTime: 1706313600,  // Jan 27, 2026 12:00 AM (Unix)
    endTime: 1706400000     // Jan 28, 2026 12:00 AM (Unix)
}

// After endTime, guest can no longer control the appliance
```

---

## **Access Control Logic**

### **1. SuperAdmin Role**

**Who:** The address that deploys the contract

```solidity
address public superAdmin = msg.sender;  // Set in constructor
```

**Permissions:**
- ✅ Add new rooms
- ✅ Grant/revoke room owners
- ✅ Control any appliance in any room

**Modifier:**
```solidity
modifier isSuperAdmin {
    require(msg.sender == superAdmin, "Not Super Admin");
    _;
}
```

---

### **2. Room Owner Role**

**Who:** Addresses granted by SuperAdmin for specific rooms

```solidity
mapping(uint roomId => mapping(address => bool)) public owner;

// Example:
owner[0][0x742d35Cc6634C0532925a3b844Bc5e8aF6b0d3f4] = true;
// Address is owner of room 0 (Living Room)
```

**Permissions:**
- ✅ Add appliances to their room
- ✅ Edit appliance details (name, pins)
- ✅ Grant/revoke guest access
- ✅ Control any appliance in their room

**Modifier:**
```solidity
modifier isOwner(uint _roomid) {
    require(owner[_roomid][msg.sender] || msg.sender == superAdmin, "Not Owner");
    _;
}
```

---

### **3. Guest Role (Time-Locked)**

**Who:** Addresses granted access to specific appliances with time windows

```solidity
// Example: Guest can control living room light for 24 hours
data[0][0].allowedAddress[0x742d35Cc6634C0532925a3b844Bc5e8aF6b0d3f4] = 
    allowedAddresses({
        isallowed: true,
        startTime: block.timestamp,
        endTime: block.timestamp + 24 hours
    });
```

**Permissions:**
- ✅ Control appliances during time window
- ❌ Cannot control outside time window
- ❌ Cannot modify permissions

**Modifier:**
```solidity
modifier onlyAllowedAddress(uint _roomid, uint _applianceId) {
    // SuperAdmin or room owner bypass time checks
    if (msg.sender == superAdmin || owner[_roomid][msg.sender]) {
        _;
        return;
    }
    
    // For guests: check isallowed, startTime, endTime
    require(data[_roomid][_applianceId].allowedAddress[msg.sender].isallowed);
    require(data[_roomid][_applianceId].allowedAddress[msg.sender].startTime < block.timestamp, 
            "Access not started");
    require(data[_roomid][_applianceId].allowedAddress[msg.sender].endTime > block.timestamp || 
            data[_roomid][_applianceId].allowedAddress[msg.sender].endTime == 0,
            "Access expired");
    _;
}
```

---

## **Function Reference**

### **Admin Functions (SuperAdmin Only)**

#### **addRoom(string memory _roomName)**
```solidity
function addRoom(string memory _roomName) external isSuperAdmin {
    owner[rooms.length][msg.sender] = true;
    rooms.push(Room(rooms.length, _roomName, 0));
    emit AddRoomOwner(msg.sender);
}
```

**Purpose:** Create a new room
**Parameters:**
- `_roomName`: Name of the room ("Living Room")

**Returns:** None (emits `AddRoomOwner` event)

**Gas Cost:** ~50,000 gas

**Example (CLI):**
```bash
cast send 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "addRoom(string)" "Living Room" \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded46b5b72f1663d23b3b2
```

---

#### **addRoomOwner(uint _roomid, address _owner)**
```solidity
function addRoomOwner(uint _roomid, address _owner) external isSuperAdmin {
    owner[_roomid][_owner] = true;
    emit AddRoomOwner(_owner);
}
```

**Purpose:** Grant room ownership to an address

**Parameters:**
- `_roomid`: Room ID (0, 1, 2, ...)
- `_owner`: Address to grant ownership

**Returns:** None

**Example:**
```bash
cast send 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "addRoomOwner(uint256,address)" \
  0 \
  0x742d35Cc6634C0532925a3b844Bc5e8aF6b0d3f4 \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974...
```

---

#### **removeRoomOwner(uint _roomid, address _owner)**
```solidity
function removeRoomOwner(uint _roomid, address _owner) external isSuperAdmin {
    owner[_roomid][_owner] = false;
    emit RemoveRoomOwner(_owner);
}
```

**Purpose:** Revoke room ownership

**Parameters:**
- `_roomid`: Room ID
- `_owner`: Address to revoke

---

### **Room Owner Functions**

#### **addAppliances(...)**
```solidity
function addAppliances(
    uint _roomid,
    string memory _details,
    uint _pinNO,
    address[] calldata _allowedAddress,
    allowedAddresses[] calldata _allowedAddresses,
    bool ismultiparams,
    uint8[5] memory _multiParamsPin
) external isOwner(_roomid)
```

**Purpose:** Add a new appliance to a room

**Parameters:**
- `_roomid`: Room ID
- `_details`: Appliance name ("Main Light")
- `_pinNO`: GPIO pin number (14)
- `_allowedAddress`: Array of addresses that can control it
- `_allowedAddresses`: Array of access windows (start/end times)
- `ismultiparams`: Is it variable? (true for fans/dimmers, false for on/off)
- `_multiParamsPin`: Alternative pins (for multi-param devices)

**Example (CLI):**
```bash
# Simple light (on/off only)
cast send 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "addAppliances(uint256,string,uint256,address[],tuple[],bool,uint8[5])" \
  0 \
  "Main Light" \
  14 \
  "[]" \
  "[]" \
  false \
  "[0,0,0,0,0]" \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974...
```

---

#### **editAppliances(...)**
```solidity
function editAppliances(
    uint _roomid,
    uint _applianceId,
    string memory _details,
    uint _pinNO,
    address[] calldata _allowedAddress,
    allowedAddresses[] calldata _allowedAddresses,
    bool ismultiparams,
    uint8[5] memory _multiParamsPin
) external isOwner(_roomid)
```

**Purpose:** Modify an existing appliance's configuration

**Parameters:** Same as `addAppliances`, plus:
- `_applianceId`: Which appliance to edit (0, 1, 2, ...)

---

#### **editRoom(uint _roomid, string memory _roomName)**
```solidity
function editRoom(uint _roomid, string memory _roomName) external isOwner(_roomid) {
    rooms[_roomid].roomName = _roomName;
}
```

**Purpose:** Rename a room

---

#### **removeApplianceAccess(uint _roomid, uint _applianceid, address _allowed)**
```solidity
function removeApplianceAccess(uint _roomid, uint _applianceid, address _allowed) 
    external isOwner(_roomid) {
    data[_roomid][_applianceid].allowedAddress[_allowed].isallowed = false;
    emit RemoveApplianceAccess(_roomid, _applianceid, _allowed);
}
```

**Purpose:** Revoke a user's access to an appliance

---

### **User Functions (Control Appliances)**

#### **changeState(uint _roomid, uint _applianceId)** ← For ON/OFF devices

```solidity
function changeState(uint _roomid, uint _applianceId) 
    external onlyAllowedAddress(_roomid, _applianceId) {
    require(data[_roomid][_applianceId].roomId == _roomid, "Room Not Exists");
    require(data[_roomid][_applianceId].applianceId == _applianceId, "Appliance Not Exists");
    
    bool updatedState = !data[_roomid][_applianceId].state;
    data[_roomid][_applianceId].state = updatedState;
    emit stateChange(_roomid, _applianceId, updatedState);
}
```

**Purpose:** Toggle ON/OFF state of an appliance

**Parameters:**
- `_roomid`: Room ID
- `_applianceId`: Appliance ID

**Returns:** None (emits `stateChange` event)

**Example (Next.js):**
```javascript
const { writeContract } = useWriteContract();

const handleToggle = async (roomId, applianceId) => {
    await writeContract({
        address: CONTRACT_ADDRESS,
        abi: abi,
        functionName: 'changeState',
        args: [BigInt(roomId), BigInt(applianceId)]
    });
};
```

---

#### **changeState(uint _roomid, uint _applianceId, uint newState)** ← For variable devices

```solidity
function changeState(uint _roomid, uint _applianceId, uint newState) 
    external onlyAllowedAddress(_roomid, _applianceId) {
    require(data[_roomid][_applianceId].roomId == _roomid, "Room Not Exists");
    require(data[_roomid][_applianceId].applianceId == _applianceId, "Appliance Not Exists");
    
    data[_roomid][_applianceId].multiparams = newState;
    emit multiStateChange(_roomid, _applianceId, newState);
}
```

**Purpose:** Set a specific value (e.g., fan speed 0-100)

**Parameters:**
- `_roomid`: Room ID
- `_applianceId`: Appliance ID
- `newState`: New value (0-255 or 0-100)

---

### **Read Functions (View Only)**

#### **getRoomCount()**
```solidity
function getRoomCount() external view returns (uint)
```
**Returns:** Total number of rooms

---

#### **getApplianceCount(uint _roomid)**
```solidity
function getApplianceCount(uint _roomid) external view returns (uint)
```
**Returns:** Number of appliances in a room

---

#### **getAllRooms()**
```solidity
function getAllRooms() external view returns (Room[] memory)
```
**Returns:** Array of all rooms

---

#### **getRoomName(uint _roomid)**
```solidity
function getRoomName(uint _roomid) external view returns (string memory)
```
**Returns:** Name of a specific room

---

#### **getSwitchState(uint _roomid, uint _applianceId)**
```solidity
function getSwitchState(uint _roomid, uint _applianceId) external view returns (bool)
```
**Returns:** Current ON/OFF state

---

#### **getMultiparamsState(uint _roomid, uint _applianceId)**
```solidity
function getMultiparamsState(uint _roomid, uint _applianceId) external view returns (uint)
```
**Returns:** Current value for variable devices (0-255)

---

#### **getPinNo(uint _roomid, uint _applianceId)**
```solidity
function getPinNo(uint _roomid, uint _applianceId) external view returns (uint)
```
**Returns:** GPIO pin number for the appliance

---

#### **getApplianceDetails(uint _roomid, uint _applianceId)**
```solidity
function getApplianceDetails(uint _roomid, uint _applianceId) external view returns (string memory)
```
**Returns:** Appliance name/details

---

#### **checkAllowedAddress(uint _roomid, uint _applianceId, address _allowed)**
```solidity
function checkAllowedAddress(uint _roomid, uint _applianceId, address _allowed) 
    external view returns (bool)
```
**Returns:** Is this address allowed to control this appliance?

---

#### **checkIsMultiparams(uint _roomid, uint _applianceId)**
```solidity
function checkIsMultiparams(uint _roomid, uint _applianceId) external view returns (bool)
```
**Returns:** Is this a variable-state device?

---

## **Foundry Setup**

### **Initialize Project**
```bash
cd smart-contracts
forge init --force
```

### **foundry.toml Configuration**
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.19"
gas_reports = ["*"]

[rpc_endpoints]
local = "http://192.168.1.100:8545"
bsc_testnet = "https://data-seed-prebsc-1-s1.binance.org:8545"

[etherscan]
bsc = { key = "", chain = 97 }
```

### **Key Commands**

```bash
# Build contract
forge build

# Run tests
forge test

# Deploy to local Anvil
forge script script/Deploy.s.sol --rpc-url http://192.168.1.100:8545 --broadcast

# Get ABI
forge build && jq '.abi' out/HomeAutomation.sol/HomeAutomation.json > abi.json

# Call read function
cast call 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "getRoomCount()" \
  --rpc-url http://192.168.1.100:8545
```

---

## **Testing**

### **Test Structure** (HomeAutomation.t.sol)

```solidity
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {HomeAutomation} from "../src/HomeAutomation.sol";

contract HomeAutomationTest is Test {
    HomeAutomation homeAutomation;
    address superAdmin = address(0x1);
    address owner = address(0x2);
    address user1 = address(0x3);

    function setUp() public {
        vm.prank(superAdmin);
        homeAutomation = new HomeAutomation();
    }

    function testAddRoom() public {
        vm.prank(superAdmin);
        homeAutomation.addRoom("Living Room");
        assert(homeAutomation.getRoomCount() == 1);
    }

    function testChangeState() public {
        // Setup: add room, appliance
        // Action: toggle state
        // Assert: state changed
    }
}
```

### **Run Tests**
```bash
forge test
forge test -v                    # Verbose output
forge test --match-contract HomeAutomationTest
```

---

## **Deployment**

### **1. Create Deployment Script** (script/Deploy.s.sol)

```solidity
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {HomeAutomation} from "../src/HomeAutomation.sol";

contract Deploy is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        HomeAutomation homeAutomation = new HomeAutomation();
        console.log("HomeAutomation deployed to:", address(homeAutomation));
        
        vm.stopBroadcast();
    }
}
```

### **2. Create .env File**
```
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded46b5b72f1663d23b3b2
RPC_URL=http://192.168.1.100:8545
```

### **3. Deploy**
```bash
cd smart-contracts
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY

# Output:
# HomeAutomation deployed to: 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae
```

### **4. Save Contract Address & ABI**

```bash
# Extract ABI
forge build
jq '.abi' out/HomeAutomation.sol/HomeAutomation.json > ../frontend/app/abi/abi.js

# Add to config
echo "export const CONTRACT_ADDRESS = '0x5FbDB2315678afccb33d7d144aca41937d0cf6ae';" >> ../frontend/config.js
```

---

## **Post-Deployment**

### **Verify Deployment**

```bash
# Check SuperAdmin
cast call 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "superAdmin()" \
  --rpc-url http://192.168.1.100:8545

# Check room count
cast call 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "getRoomCount()" \
  --rpc-url http://192.168.1.100:8545
# Output: 0 (no rooms yet)
```

### **Initialize Contract**

```bash
# Add first room as superAdmin
cast send 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "addRoom(string)" "Living Room" \
  --rpc-url http://192.168.1.100:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded46b5b72f1663d23b3b2

# Verify
cast call 0x5FbDB2315678afccb33d7d144aca41937d0cf6ae \
  "getRoomCount()" \
  --rpc-url http://192.168.1.100:8545
# Output: 1
```

### **Update Frontend Config**

Edit `frontend/config.js`:
```javascript
export const CONTRACT_ADDRESS = '0x5FbDB2315678afccb33d7d144aca41937d0cf6ae';
export const RPC_URL = 'http://192.168.1.100:8545';
```

---

**Version:** 1.0  
**Last Updated:** January 27, 2026
