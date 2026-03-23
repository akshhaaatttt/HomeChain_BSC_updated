# Raspberry Pi Ngrok Bridge Setup - Quick Start

## Prerequisites
Your Raspberry Pi must have:
- Node.js installed
- Hardhat/Anvil installed
- Go middleware installed
- Ngrok CLI installed

---

## Step 1: Install Ngrok (One-time)

```bash
# Download Ngrok from: https://ngrok.com/download
# Or install via package manager:
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && \
sudo apt update && sudo apt install ngrok
```

---

## Step 2: Authenticate Ngrok (One-time)

```bash
# Get your auth token from: https://dashboard.ngrok.com/auth/your-authtoken
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```

---

## Step 3: Start the Bridge (Each Session)

### Terminal 1: Start Ngrok
```bash
# This creates the tunnel and shows you the public URL
ngrok http 8545
```

**You'll see output like:**
```
Session Status                online
Account                       your-email@example.com
Version                       3.3.5
Region                        us-central (118.80.3.3)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://overcivil-delsie-unvilified.ngrok-free.dev -> http://localhost:8545

Connections                   ttl     opn     dl      in      out
                              0       0       0       0B      0B
```

**Copy the HTTPS URL** and update your `.env.local` on your website:
```
NEXT_PUBLIC_RPC_URL=https://overcivil-delsie-unvilified.ngrok-free.dev
```

### Terminal 2: Start Anvil (with Ngrok flags)
```bash
# Fork BSC (or use Ethereum mainnet if you prefer)
anvil --fork-url https://bsc-dataseed1.binance.org:443 \
      --host 0.0.0.0 \
      --allow-origin "*"

# You should see:
# Listening on 0.0.0.0:8545
```

### Terminal 3: Start Go Middleware
```bash
cd /path/to/home-middleware
./main

# You should see:
# ✅ MQTT: Connected to Raspberry Pi Broker.
# ?? System Online: Watching for Authenticated Commands...
```

### Terminal 4: Start MQTT Broker (if not already running)
```bash
# Usually pre-installed on Raspberry Pi
mosquitto
```

---

## Step 4: Verify Everything is Working

### On Your Website (separate machine):
```bash
# Update .env.local with the Ngrok URL from Terminal 1
NEXT_PUBLIC_RPC_URL=https://overcivil-delsie-unvilified.ngrok-free.dev

# Start your development server
npm run dev

# Visit: http://localhost:3000
# Click "Connect Wallet" and sign a transaction
```

### Check the Ngrok Web Interface:
Visit `http://127.0.0.1:4040` in your browser to see:
- All HTTP requests forwarded by Ngrok
- Request/response bodies
- Latency metrics
- Connection stats

---

## Troubleshooting

### Problem: "Connection Refused" in MetaMask
```
Error: connection refused at 127.0.0.1:8545
```

**Solution:**
- Ensure Anvil is running with `--host 0.0.0.0`
- Ensure Ngrok is forwarding to `localhost:8545`
- Check that port 8545 is not blocked by firewall

### Problem: Ngrok shows "Connection refused"
```
ERR_NGROK_250 Connection refused
```

**Solution:**
- Restart Anvil on the Pi: `anvil --host 0.0.0.0 --allow-origin "*"`
- Wait 5 seconds for Anvil to start listening
- Restart Ngrok tunnel

### Problem: Website shows "Cannot read properties of undefined"
```
Error: Cannot read properties of undefined (reading 'request')
```

**Solution:**
- MetaMask is not installed in your browser
- Install MetaMask extension from Chrome Web Store
- Refresh the website and try again

### Problem: Transactions fail silently
```
Error: User denied transaction signature
```

**Solution:**
- Check browser console for the actual error
- Ensure MetaMask is on the correct network (Webasthetic Home Chain)
- Verify contract address in .env.local is correct
- Check that you have enough test ETH/BNB in MetaMask

---

## Monitoring

### Real-time Request Monitoring
Visit Ngrok Web Dashboard: `http://127.0.0.1:4040`

You'll see:
- **GET /**: Browser health checks
- **POST /**: JSON-RPC calls from your website
- **Latency**: How long each request takes
- **Status**: Success (200) or failures (500, etc.)

### Go Middleware Logs
Watch the middleware terminal:
```
[BLOCKCHAIN] 🔔 Event Received!
📍 Room: 1 | 💡 Device: 1 | ⚡ Value: 1
📡 MQTT -> Published '1' to 'home/room1/device1'
```

### MQTT Messages
Monitor MQTT traffic from Go middleware:
```bash
# On another terminal on the Pi:
mosquitto_sub -t "home/+/+"

# You'll see messages like:
# home/room1/device1 1
# home/room1/device2 0
# home/room2/device1 255
```

---

## Daily Workflow

### Morning: Start Everything
```bash
# Terminal 1: Ngrok
ngrok http 8545

# Terminal 2: Anvil
anvil --fork-url https://bsc-dataseed1.binance.org:443 --host 0.0.0.0 --allow-origin "*"

# Terminal 3: Go Middleware
cd home-middleware && ./main

# Note: MQTT usually auto-starts
```

### Evening: Stop Everything
```bash
# Ctrl+C in all terminals
# Or if running in background:
pkill -f ngrok
pkill -f anvil
pkill -f main
```

---

## Network Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Your Website (Web Browser)               │
│              https://homechain.jainhardik06.in              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ MetaMask Wallet Connection                             │ │
│  │ Sends blockchain transactions to:                       │ │
│  │ https://overcivil-delsie-unvilified.ngrok-free.dev    │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTPS (Secure)
                        │ Over the Internet
                        ↓
        ┌───────────────────────────────┐
        │    Ngrok Tunnel (Free)        │
        │  Port: 443 (HTTPS incoming)   │
        │  Forwards to Pi:8545          │
        │                               │
        │  Status: http://127.0.0.1:4040│
        └───────────┬───────────────────┘
                    │ HTTP (Local Network)
                    ↓
    ┌───────────────────────────────────────────┐
    │   Raspberry Pi (Your Home Network)        │
    │                                           │
    │  ┌─────────────────────────────────────┐ │
    │  │ Anvil on 0.0.0.0:8545              │ │
    │  │ (BSC Fork - Local Blockchain)       │ │
    │  └──────────────┬──────────────────────┘ │
    │                │                         │
    │  ┌─────────────▼──────────────────────┐ │
    │  │ Go Middleware (watches events)     │ │
    │  └──────────────┬──────────────────────┘ │
    │                │                         │
    │  ┌─────────────▼──────────────────────┐ │
    │  │ MQTT Broker (pub/sub)              │ │
    │  └──────────────┬──────────────────────┘ │
    │                │                         │
    │  ┌─────────────▼──────────────────────┐ │
    │  │ ESP32 Devices (WiFi MQTT clients)  │ │
    │  │ - Smart Locks                      │ │
    │  │ - LED Fans                         │ │
    │  │ - RGB Strips                       │ │
    │  └─────────────────────────────────────┘ │
    └───────────────────────────────────────────┘
```

---

## Important Reminders

⚠️ **Ngrok URL Changes Every 2 Hours:**
- Free tier tunnels reset periodically
- You'll get a new URL
- Update `.env.local` with the new URL
- No need to restart your website (environment loads on page refresh)

⚠️ **Security:**
- This setup is for home use only
- Never expose private keys in code
- Use environment variables for sensitive data
- For production, use Ngrok Pro ($5/month) or rent a VPS ($5-10/month)

⚠️ **Testing the Bridge:**
Before deploying:
1. ✅ Website can connect to MetaMask
2. ✅ MetaMask can sign a test transaction
3. ✅ Anvil receives the transaction
4. ✅ Go middleware logs the event
5. ✅ MQTT message is published
6. ✅ ESP32 device responds (LED turns on, lock activates, etc.)

---

## Performance Tips

1. **Keep Ngrok and Anvil close in latency:**
   - If Ngrok shows 200ms latency, something is wrong
   - Typical latency: 5-50ms
   - If slow, restart Ngrok

2. **Monitor Anvil logs for errors:**
   - If you see rejected transactions, check contract address
   - If you see timeouts, restart Anvil

3. **Use Ngrok's free tier limitations wisely:**
   - Bandwidth limit: sufficient for home automation
   - Not suitable for 1000s of users
   - Perfect for: you + family + close friends

---

**You're now running a fully functional smart home system accessible from anywhere with an internet connection!** 🎉
