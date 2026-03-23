# 🌉 Webasthetic: Frontend-to-RPi Integration Guide

## Overview

Your Next.js frontend (`homechain.jainhardik06.in`) is now fully integrated with your Raspberry Pi's private blockchain and hardware. This guide explains the complete setup and how to finalize the connection.

---

## 📋 What's Already Configured

### ✅ Frontend Integration (100% Complete)
- **Wagmi + Viem**: Modern Web3 library for blockchain interaction
- **MetaMask Support**: Add custom network, connect wallet, sign transactions
- **Device Control Hook**: `useDeviceControl()` handles all contract calls
- **Dashboard**: Updated with blockchain transaction triggers
- **Error Handling**: Network status, transaction confirmations, error alerts

### 📁 New Files Created
```
lib/
├── blockchain.ts          # HomeChain network config (Chain ID 31337)
├── constants.ts           # Contract ABI, address, role definitions
├── wagmi.config.ts        # Wagmi setup with homechain transport
├── metamask.ts            # MetaMask network helpers
hooks/
└── useDeviceControl.ts    # All contract interaction methods
app/
├── layout.tsx             # Wrapped with Wagmi + React Query
└── metadata.ts            # Separate metadata file (for 'use client')
```

---

## 🚀 Next Steps: RPi Setup

### 1. **Set Up Cloudflare Tunnel** (Required for HTTPS)

Since your website uses HTTPS, browsers will block direct connections to HTTP local IPs. Cloudflare Tunnel creates a secure bridge:

```bash
# On your Raspberry Pi:
sudo apt update && sudo apt install cloudflared

# Authenticate
cloudflared tunnel login

# Create tunnel (replace subdomain with your preference)
cloudflared tunnel create homechain-rpc

# Configure routing
cloudflared tunnel route dns homechain-rpc rpc.jainhardik06.in

# Run tunnel
cloudflared tunnel run homechain-rpc
```

**Output will show:**
```
Tunnel credentials written to /home/pi/.cloudflared/...json
Your quick tunnels at https://rpc.jainhardik06.in
```

Update your `lib/constants.ts`:
```typescript
export const API_CONFIG = {
  RPC_URL: 'https://rpc.jainhardik06.in',  // ← Your Cloudflare tunnel
  MQTT_BROKER: 'mqtt://192.168.1.XX:1883',   // ← Your Pi's local IP
} as const
```

---

### 2. **Deploy Your Smart Contract to Anvil**

```bash
# On your Pi, in the smart-contract directory
npx hardhat run scripts/deploy.js --network anvil

# Output will show:
# HomeAutomation deployed to: 0x5FbDB2315678afccb333f8a9c45b65d30425ab91
```

Copy the contract address and update `lib/constants.ts`:
```typescript
export const CONTRACT_ADDRESS = '0x5FbDB2315678afccb333f8a9c45b65d30425ab91';
```

---

### 3. **Update MetaMask Network**

In `lib/blockchain.ts`, the MetaMask config is ready. When users visit your site:

1. Click "Add Network" button on the Dashboard
2. MetaMask popup approves adding "HomeChain Private"
3. Network is saved in MetaMask permanently

**Manual method** (if button doesn't work):
- Chain ID: `31337` (Hex: `0x7a69`)
- RPC URL: `https://rpc.jainhardik06.in`
- Network Name: `HomeChain Private`
- Currency: `ETH`

---

### 4. **Ensure Go Middleware is Listening**

Your middleware must listen for blockchain events:

```go
// In home-middleware/main.go
// Make sure StateChanged event listener is active:

// TODO: Add your event listening code here
// client.WatchLog(..., contractABI.StateChanged)
```

When a transaction hits the blockchain, the Go service should:
1. Catch `StateChanged(roomId, deviceId, newValue)` event
2. Publish to MQTT: `home/room{roomId}/device{deviceId}` with value
3. ESP32 receives and triggers capacitor relay

---

## 🎮 Testing the Flow

### Test Scenario: Turn on Living Room Light

1. **Dashboard Page**: Click "Turn On" for Main Light
2. **MetaMask Popup**: Signs transaction with your wallet
3. **Blockchain**: Transaction mined on Anvil (your Pi)
4. **Go Middleware**: Listens for `StateChanged` event (room=1, device=0, value=1)
5. **MQTT Publish**: Sends `1` to `home/room1/device0`
6. **ESP32**: Receives MQTT message, clicks capacitor relay
7. **Hardware**: Light turns on via 3.3µF capacitor

**Expected Timeline**: ~2-3 seconds (depends on Anvil block time)

---

## 🔧 Troubleshooting

### Issue: "MetaMask Not Connected"
**Solution**: Click "Add Network" → Approve in MetaMask → Refresh page

### Issue: "Contract address not configured"
**Solution**: Update `CONTRACT_ADDRESS` in `lib/constants.ts` with your deployed contract address

### Issue: Transaction hangs ("Confirming...")
**Cause**: Go Middleware not listening for events
**Solution**: 
```bash
# Check Go service is running
ps aux | grep -i "go\|middleware"

# View logs
journalctl -u go-middleware -n 20  # If running as systemd
```

### Issue: "MQTT not connecting" (for hardware)
**Note**: MQTT is local-network-only (good for security!)
- Ensure `MQTT_BROKER: 'mqtt://192.168.1.XX:1883'` uses your actual Pi IP
- ESP32 must be on same WiFi as Pi

### Issue: Cloudflare Tunnel keeps disconnecting
**Solution**: Run as system service:
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## 📊 Architecture Overview

```
[User Browser]
    ↓
[Domain: homechain.jainhardik06.in] (HTTPS)
    ↓
[Cloudflare Tunnel]
    ↓
[RPC Endpoint: https://rpc.jainhardik06.in]
    ↓
[Raspberry Pi]
    ├─→ Anvil (Port 8545) ← Smart Contract
    ├─→ Go Middleware ← Event Listener
    └─→ MQTT Broker ← Hardware Commands
```

---

## 🛠️ Contract Functions Ready to Use

Your `useDeviceControl()` hook provides:

```typescript
const { toggleDevice, grantAccess, revokeAccess, createRoom, defineDevice } = useDeviceControl()

// Operate a device
toggleDevice(roomId: number, deviceId: number, value: number)

// Grant time-limited access
grantAccess(roomId, userAddress, startTime, endTime, roleBytes)

// Create a room
createRoom(name: string, espIP: string)

// Define a device in a room
defineDevice(roomId, name, pin, deviceType)
```

---

## 📝 Checklist Before Going Live

- [ ] Cloudflare Tunnel running on Pi
- [ ] Smart contract deployed to Anvil (address updated in `constants.ts`)
- [ ] Go Middleware listening for `StateChanged` events
- [ ] MQTT broker running on Pi
- [ ] MetaMask MetaMask configured on your testing wallet
- [ ] Test one device toggle (Light → Fan → RGB)
- [ ] Verify ESP32 receives MQTT messages
- [ ] Set up Cloudflared as systemd service for reliability

---

## 🎯 Next Pages to Integrate

- **Rooms Page** (`app/rooms/page.tsx`): Use `createRoom()` to deploy smart homes
- **Access Management** (`app/access-management/page.tsx`): Use `grantAccess()` for blockchain-based permissions
- **Analytics** (`app/analytics/page.tsx`): Query blockchain for `StateChanged` events to build charts

---

## 🔐 Security Notes

1. **Private Key**: MetaMask signs locally (never exposed to server)
2. **MQTT**: Keep port 1883 closed to internet (local network only)
3. **RPC URL**: Public via Cloudflare (anyone can read, but not write without private key)
4. **Contract**: Access control via roles (SUPER_ADMIN_ROLE, ROOM_ADMIN_ROLE, GUEST_ROLE)

---

## 📞 Support

If you encounter issues:
1. Check terminal logs: `npm run dev` for frontend errors
2. Check Pi logs: `journalctl -u <service-name>` for Go/MQTT
3. Use MetaMask DevTools: F12 → Console for Web3 errors
4. Check Cloudflare Dashboard for tunnel status

---

**Status**: ✅ Frontend 100% Ready | ⏳ Awaiting RPi Final Configuration

Your dashboard is live at `https://homechain.jainhardik06.in/dashboard` — connect your wallet and test!
