# Quick Setup: Contract Address & Configuration

## 🔴 REQUIRED: Update These Before Testing

### 1. Contract Address
After deploying to Anvil, update in `Frontend/lib/constants.ts`:

```typescript
// CHANGE THIS:
export const CONTRACT_ADDRESS = '0x' as `0x${string}`;

// TO THIS (example from Anvil deploy output):
export const CONTRACT_ADDRESS = '0x5FbDB2315678afccb333f8a9c45b65d30425ab91' as `0x${string}`;
```

**How to get it:**
```bash
cd home-middleware
npx hardhat run scripts/deploy.js --network anvil
# Look for: "HomeAutomation deployed to: 0x..."
```

---

### 2. Cloudflare Tunnel URL
Update in `Frontend/lib/constants.ts`:

```typescript
export const API_CONFIG = {
  RPC_URL: 'https://rpc.jainhardik06.in',  // ← Your tunnel subdomain
  MQTT_BROKER: 'mqtt://192.168.1.XX:1883',   // ← Your Pi's IP
} as const
```

**How to set up:**
```bash
# On Raspberry Pi
cloudflared tunnel create homechain-rpc
cloudflared tunnel route dns homechain-rpc rpc.jainhardik06.in
cloudflared tunnel run homechain-rpc
```

---

### 3. MetaMask Network (Automatic)
Users can click "Add Network" on Dashboard → Automatically configured

**Manual if needed:**
- **Chain ID:** `31337` (Hex: `0x7a69`)
- **RPC:** `https://rpc.jainhardik06.in`
- **Name:** HomeChain Private
- **Currency:** ETH

---

## ✅ Verification Checklist

```bash
# 1. Contract deployed
curl https://rpc.jainhardik06.in \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}'

# 2. Tunnel working
curl https://rpc.jainhardik06.in

# 3. Frontend builds
cd Frontend && npm run build

# 4. Go middleware ready
ps aux | grep middleware
```

---

## 🎮 First Test

1. Visit `https://homechain.jainhardik06.in/dashboard`
2. Click "Add Network" → MetaMask pops up
3. Approve → Dashboard shows "MetaMask Connected"
4. Click "Turn On" for any device
5. MetaMask popup → Sign transaction
6. Wait for "Transaction Confirmed" message

**Success = Light turns on physically!**

---

## 📋 Contract Functions (Ready to Use)

| Function | Hook Method | Parameters |
|----------|------------|-----------|
| operateDevice | `toggleDevice()` | (roomId, deviceId, value) |
| grantAccess | `grantAccess()` | (roomId, address, start, end, role) |
| revokeAccess | `revokeAccess()` | (roomId, address, role) |
| createRoom | `createRoom()` | (name, espIP) |
| defineDevice | `defineDevice()` | (roomId, name, pin, type) |

---

## 🚨 If Something Breaks

**Frontend not building?**
```bash
cd Frontend
rm -rf .next node_modules
npm install
npm run build
```

**MetaMask not connecting?**
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Clear MetaMask cache
MetaMask → Settings → Advanced → Clear activity and nonce data
```

**Transactions hanging?**
```bash
# Check Anvil is running on Pi
ps aux | grep anvil

# Check tunnel
ps aux | grep cloudflared
```

---

## 📞 Key Files

- Frontend config: `Frontend/lib/constants.ts`
- Blockchain setup: `Frontend/lib/blockchain.ts`
- Device control: `Frontend/hooks/useDeviceControl.ts`
- MetaMask helpers: `Frontend/lib/metamask.ts`
- Dashboard: `Frontend/app/dashboard/page.tsx`
- Wagmi config: `Frontend/lib/wagmi.config.ts`
- Contract ABI: `Frontend/lib/constants.ts` (embedded)

---

**All files are TypeScript + ready for production. Just add CONTRACT_ADDRESS and Cloudflare tunnel URL!**
