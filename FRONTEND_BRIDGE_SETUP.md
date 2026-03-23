# 🔗 Frontend to Raspberry Pi Integration Guide

**Quick Setup: Connect Your Website to Your Smart Home via Cloudflare Tunnel**

---

## ⚡ TL;DR - 5-Minute Setup

### Step 1: Get Your Pi's IP Address
On your Raspberry Pi terminal:
```bash
hostname -I
# Output: 192.168.1.100 (use this)
```

### Step 2: Update Frontend Environment
Edit `Frontend/.env.local`:
```bash
# Line that needs YOUR Pi's IP:
NEXT_PUBLIC_MIDDLEWARE_URL=http://192.168.1.100:8080/health
```
Replace `192.168.1.100` with the IP from Step 1.

### Step 3: Verify Cloudflare Tunnel URL
Make sure this line in `.env.local` matches your actual tunnel domain:
```bash
NEXT_PUBLIC_RPC_URL=https://rpc.jainhardik06.in
```

### Step 4: Start Frontend
```bash
cd Frontend
npm run dev
```

### Step 5: Add Network to MetaMask
1. Settings → Networks → Add Network
2. **Name**: Webasthetic HomeChain
3. **RPC URL**: https://rpc.jainhardik06.in
4. **Chain ID**: 31337
5. Save

**Done! Your website now talks to your Pi.** ✅

---

## 📋 Configuration Checklist

Before you run `npm run dev`:

### Frontend Configuration (`.env.local`)
- [ ] `NEXT_PUBLIC_RPC_URL` = Your Cloudflare Tunnel URL (HTTPS)
  - Should be: `https://rpc.jainhardik06.in`
  - Or your custom domain if different

- [ ] `NEXT_PUBLIC_CONTRACT_ADDRESS` = Your deployed contract
  - Example: `0x5FbDB2315678afccb33d7d144aca41937d0cf6ae`
  - Get this from: `./init_home.sh` output on Pi

- [ ] `NEXT_PUBLIC_CHAIN_ID` = `31337`
  - This is the default Anvil chain ID

- [ ] `NEXT_PUBLIC_MIDDLEWARE_URL` = Your Pi's health endpoint
  - Format: `http://192.168.1.100:8080/health`
  - Replace `192.168.1.100` with YOUR Pi's IP

### Raspberry Pi Services
- [ ] Cloudflare Tunnel running
  - Command: `cloudflared tunnel run homechain`
  - Shows: `https://rpc.jainhardik06.in`

- [ ] Anvil running on port 8545
  - Command: `anvil`

- [ ] Go Middleware running on port 8080
  - Command: `go run main.go` (in home-middleware directory)

- [ ] Mosquitto MQTT running on port 1883
  - Command: `mosquitto` or `mosquitto -c /etc/mosquitto/mosquitto.conf`

### MetaMask Setup
- [ ] Network added: "Webasthetic HomeChain"
- [ ] RPC URL set to: `https://rpc.jainhardik06.in`
- [ ] Chain ID set to: `31337`
- [ ] Currency: ETH

---

## 🔍 Testing Your Setup

### Test 1: Verify RPC Connection
```bash
# On your computer
curl https://rpc.jainhardik06.in \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Should return: {"jsonrpc":"2.0","result":"0x7a69","id":1}
# (0x7a69 is 31337 in hex)
```

### Test 2: Verify Middleware Health
```bash
# Replace 192.168.1.100 with your Pi's IP
curl http://192.168.1.100:8080/health

# Should return: {"status":"online"}
```

### Test 3: Check Frontend Console
1. Start frontend: `npm run dev`
2. Open http://localhost:3000
3. Open Browser DevTools (F12)
4. Check Console tab:
   - Should NOT have red errors
   - May have "Connecting to blockchain..." message
   - Should eventually show "System Online" or "System Offline"

### Test 4: Try MetaMask Connection
1. Click MetaMask extension
2. Should show "Webasthetic HomeChain" network
3. Click "Connect"
4. Should ask for account selection
5. Once connected, should show your address

---

## 🛠️ Troubleshooting

### "RPC error: Invalid chain ID"
**Problem**: Frontend trying to connect to wrong RPC  
**Solution**: Check `NEXT_PUBLIC_RPC_URL` in `.env.local`
```bash
# Should be exactly:
NEXT_PUBLIC_RPC_URL=https://rpc.jainhardik06.in
```
Then restart: `npm run dev`

### "Middleware unreachable" (Red offline badge)
**Problem**: Frontend can't reach Go service  
**Solution**:
1. Find your Pi's IP: `hostname -I` (on Pi)
2. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_MIDDLEWARE_URL=http://192.168.1.100:8080/health
   ```
   (Replace 192.168.1.100 with your Pi's IP)
3. Restart frontend: `npm run dev`

### "Connection refused" in console
**Problem**: Website not reaching Pi  
**Solution**:
1. Check Pi is on same network as computer
2. Ping Pi: `ping 192.168.1.100` (use your Pi's IP)
3. If no response, use `hostname -I` on Pi to get correct IP

### "MetaMask: This site tried to use RPC method eth_sendTransaction"
**Problem**: Normal behavior - MetaMask intercepting transaction  
**Solution**: Approve the transaction in MetaMask popup

### "Smart contract function not found"
**Problem**: Contract address mismatch  
**Solution**:
1. Check deployed contract on Pi:
   ```bash
   # In home-middleware/
   cat init_home.sh | grep "Deployed to"
   ```
2. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`
3. Restart frontend

---

## 📊 System Architecture (With Tunnel)

```
┌─────────────────────────────────────────┐
│                                         │
│  Your Website/Computer                  │
│  (Browser with MetaMask)                │
│  homechain.jainhardik06.in              │
│                                         │
└────────────────────┬────────────────────┘
                     │
                     │ HTTPS (Encrypted)
                     │
         ┌───────────▼───────────┐
         │  Cloudflare Tunnel    │
         │  rpc.jainhardik06.in  │
         │  (Proxy to Pi:8545)   │
         └───────────┬───────────┘
                     │
                     │ Local Network
                     │ (192.168.1.100:8545)
                     │
         ┌───────────▼────────────────────┐
         │                                │
         │  Raspberry Pi                  │
         │  192.168.1.100                 │
         │                                │
         │  ┌──────────────────────────┐  │
         │  │ Anvil RPC (Port 8545)    │  │
         │  │ - Listens for requests   │  │
         │  │ - Executes transactions  │  │
         │  │ - Stores device state    │  │
         │  └──────────────────────────┘  │
         │                                │
         │  ┌──────────────────────────┐  │
         │  │ Go Middleware (8080)     │  │
         │  │ - Listens to events      │  │
         │  │ - Publishes to MQTT      │  │
         │  │ - Health endpoint        │  │
         │  └──────────────────────────┘  │
         │                                │
         │  ┌──────────────────────────┐  │
         │  │ Mosquitto MQTT (1883)    │  │
         │  │ - Routes to ESP32 nodes  │  │
         │  │ - Controls hardware      │  │
         │  └──────────────────────────┘  │
         │                                │
         └────────────────────────────────┘
```

---

## 🔐 Security Notes

### Why Cloudflare Tunnel?
- ✅ **Secure**: HTTPS encrypted (no HTTP)
- ✅ **Safe**: No port forwarding needed
- ✅ **Reversible**: Can disconnect instantly
- ✅ **Stable**: Auto-reconnect on network change

### Environment Variables
- ⚠️ `.env.local` is git-ignored (not committed)
- ⚠️ Never commit `.env.local` to GitHub
- ⚠️ Never expose in browser (use NEXT_PUBLIC_ prefix only for safe values)

### MetaMask
- ✅ Uses your local blockchain (chain ID 31337)
- ✅ No connection to Ethereum mainnet
- ✅ Safe to approve transactions (no real money)

---

## 📝 Configuration File Reference

### Location
```
Frontend/
└── .env.local  (← Create this file, git-ignored)
```

### All Variables
```bash
# RPC endpoint (from Cloudflare Tunnel)
NEXT_PUBLIC_RPC_URL=https://rpc.jainhardik06.in

# Your deployed smart contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afccb33d7d144aca41937d0cf6ae

# Anvil chain ID (always 31337)
NEXT_PUBLIC_CHAIN_ID=31337

# Go Middleware health check (UPDATE THIS with your Pi's IP)
NEXT_PUBLIC_MIDDLEWARE_URL=http://192.168.1.100:8080/health

# Feature toggles
NEXT_PUBLIC_ENABLE_POLLING=true
NEXT_PUBLIC_POLLING_INTERVAL=5000
NEXT_PUBLIC_ENABLE_HARDWARE_PROVISIONING=true
NEXT_PUBLIC_ENABLE_SYSTEM_STATUS=true
NEXT_PUBLIC_ENABLE_GUEST_ACCESS=true
```

---

## ✅ Final Checklist

Before you declare "integration complete":

**Environment Setup**
- [ ] `.env.local` file created in `Frontend/` directory
- [ ] All required variables filled in
- [ ] Pi's IP address correctly set in `NEXT_PUBLIC_MIDDLEWARE_URL`

**Raspberry Pi Services**
- [ ] Cloudflare Tunnel showing: `https://rpc.jainhardik06.in`
- [ ] Anvil running: `anvil` in terminal
- [ ] Go Middleware running: `go run main.go` in terminal
- [ ] Mosquitto MQTT running

**Frontend**
- [ ] Build passes: `npm run build` (0 errors)
- [ ] Development server starts: `npm run dev`
- [ ] Website loads at `http://localhost:3000`
- [ ] No red errors in console

**MetaMask**
- [ ] Network added: "Webasthetic HomeChain"
- [ ] Can switch to this network
- [ ] Shows your address when connected

**End-to-End**
- [ ] Device toggle works (Dashboard → Toggle → MetaMask signs → Device state changes)
- [ ] Health indicator shows 🟢 Online (not 🔴 Offline)
- [ ] Polling updates state (change device on Pi, see update in browser)

---

## 🎉 You're Connected!

Once all checks pass:

✅ Your website is bridged to your Pi via Cloudflare Tunnel  
✅ MetaMask connects to your private blockchain  
✅ Device control works end-to-end  
✅ System health is monitored  
✅ Real-time polling synchronizes state  

**Your Webasthetic smart home is live!** 🏡

---

## 📚 Need More Info?

- **Full Setup Guide**: See `GETTING_STARTED.md`
- **Technical Details**: See `TECHNICAL_CASE_STUDY.md`
- **Troubleshooting**: See `TROUBLESHOOTING.md` in docs/
- **API Reference**: See `QUICK_REFERENCE.md` in docs/

---

**Happy smart homing! 🚀**
