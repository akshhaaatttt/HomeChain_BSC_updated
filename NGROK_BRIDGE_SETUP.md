# Ngrok Bridge Configuration Guide

## Overview
This guide walks through configuring the Webasthetic system to use **Ngrok** to bridge your Raspberry Pi (running the BSC-forked blockchain) to your public website.

---

## Step 1: Get Your Ngrok URL

Your Ngrok URL is: **`https://overcivil-delsie-unvilified.ngrok-free.dev`**

This URL forwards all traffic to your Raspberry Pi's Anvil instance running on port 8545.

---

## Step 2: Update Environment Variables

### On Your Development Machine (where the website runs):

Edit `.env.local` in the `Frontend` folder:

```env
# Replace the RPC URL with your Ngrok URL
NEXT_PUBLIC_RPC_URL=https://overcivil-delsie-unvilified.ngrok-free.dev

# Keep other settings as-is
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afccb33d7d144aca41937d0cf6ae
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_MIDDLEWARE_URL=http://192.168.1.100:8080/health
```

### On Your Raspberry Pi:

Start Anvil with Ngrok support:

```bash
# Make sure Ngrok is running in another terminal:
ngrok http 8545

# Then start Anvil in another terminal:
anvil --host 0.0.0.0 --allow-origin "*"
```

---

## Step 3: Update MetaMask Configuration

MetaMask needs to know where to find your blockchain.

### Option A: Manual MetaMask Setup
1. Open MetaMask
2. Click **Network Selector** (top-left)
3. Click **"Add Network"** → **"Add a network manually"**
4. Fill in:
   - **Network Name:** `Webasthetic BSC Fork`
   - **RPC URL:** `https://overcivil-delsie-unvilified.ngrok-free.dev`
   - **Chain ID:** `56` (BSC Chain ID, to keep logic consistent)
   - **Currency Symbol:** `BNB`
5. Click **Save**

### Option B: Let Your Website Add It Automatically
Your website already has code to add the network. When users click "Connect Wallet", it will prompt them to add the network.

---

## Step 4: Import Your Dev Account

Your Raspberry Pi's Anvil instance has test BNB. To use it:

1. On your **Pi terminal**, find a **Private Key** from the Anvil startup output
2. In **MetaMask**, click **Account Circle** → **"Import Account"**
3. Paste the private key and click **Import**
4. You should now see a BNB balance

---

## Step 5: Clear Ngrok Warning Page

Ngrok shows a warning page on first access. Clear it:

1. Visit: `https://overcivil-delsie-unvilified.ngrok-free.dev`
2. Click **"Visit Site"** to bypass the warning
3. This clears the cookie so your website can access the RPC without issues

---

## Step 6: Test the Connection

### Test 1: MetaMask Connection
1. Go to your website: `https://homechain.jainhardik06.in/`
2. Click **"Connect Wallet"**
3. MetaMask should prompt you to add the network (if not already added)
4. Confirm and connect

### Test 2: Send a Transaction
1. Go to **Dashboard**
2. Click any device control button (turn on a light, etc.)
3. MetaMask popup should appear
4. Sign the transaction
5. You should see a success message and the device should respond

### Test 3: Middleware Connection
1. Go to **Dashboard**
2. Check if the "System Status" shows the middleware as **"Connected"**
3. This confirms the Go middleware is responding to events

---

## Architecture Summary

```
┌─────────────────────────┐
│   Your Browser/Mobile   │
│  (Website + MetaMask)   │
└────────────┬────────────┘
             │ HTTPS
             ↓
    ┌────────────────────┐
    │  Ngrok Tunnel      │
    │  (Free Tier)       │
    └────────┬───────────┘
             │ HTTP
             ↓
┌────────────────────────────┐
│   Raspberry Pi (Home)      │
│                            │
│  ┌──────────────────────┐  │
│  │  Anvil (Port 8545)   │  │
│  │  BSC Fork Instance   │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │  Go Middleware       │  │
│  │  (Watches Events)    │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │  MQTT Broker         │  │
│  │  (Pub/Sub)           │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │  ESP32 Devices       │  │
│  │  (Relays, Fans, RGB) │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

---

## Troubleshooting

### Problem: "Cannot connect to RPC"
- **Check:** Ngrok tunnel is running (`ngrok http 8545`)
- **Check:** Anvil is running with `--host 0.0.0.0 --allow-origin "*"`
- **Check:** .env.local has the correct Ngrok URL

### Problem: MetaMask shows "Wrong Network"
- Ensure your website is using the same Ngrok URL
- Manually add the network if not auto-added

### Problem: Transactions fail silently
- Visit the Ngrok URL first to clear the warning page
- Check browser console for errors
- Verify the contract address in .env.local

### Problem: Middleware shows "Disconnected"
- Ensure the Pi's IP address is correct in `NEXT_PUBLIC_MIDDLEWARE_URL`
- Check Go middleware is running on the Pi
- Verify MQTT broker is accessible

---

## Important Notes

⚠️ **Ngrok Free Tier Limitations:**
- Tunnel restarts every 2 hours
- You'll get a new URL each time
- For production, use **Ngrok Pro** or host on a VPS

⚠️ **Security:**
- This setup is for **local testing only**
- Use environment variables for sensitive URLs
- Never commit .env.local to git

⚠️ **Chain ID:**
- We use Chain ID **56** (BSC) for the forked instance
- This keeps your existing smart contract logic consistent
- Anvil's default is 31337, but we override it for compatibility

---

## Next Steps

Once everything is connected:
1. ✅ Test device controls
2. ✅ Test guest access grants
3. ✅ Monitor middleware events
4. ✅ Verify hardware responses
5. 🚀 Deploy to production (with proper infrastructure)

