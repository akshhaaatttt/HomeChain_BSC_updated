# Webasthetic Home Automation Frontend

A professional, minimalist Next.js dashboard for controlling smart home devices via blockchain.

## Features

- **Command Center**: Real-time control of 4 device types:
  - Fan Control (4-stage speed selector)
  - Main Bulb (On/Off toggle)
  - Smart Plug (On/Off toggle)
  - RGB Strip (Color presets + power control)

- **Access Management**: Super Admin interface for:
  - Granting/revoking guest access
  - Time-based permission control (ABAC)
  - Role management (RBAC)

- **Blockchain Integration**:
  - Web3 connectivity via Wagmi/Viem
  - Zero-Index event decoding (96-byte packed data)
  - Real-time device status synchronization

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Blockchain**: Wagmi, Viem, Web3.js
- **State Management**: React Query
- **Language**: TypeScript

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Edit with your values:
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Smart contract address
- `NEXT_PUBLIC_NETWORK_ID`: BSC network ID (56)
- `NEXT_PUBLIC_RPC_URL`: RPC endpoint
- `NEXT_PUBLIC_ROOM_ID`: Room identifier

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── layout.tsx           # Root layout
├── page.tsx             # Home/landing
├── dashboard/           # Command Center
│   └── page.tsx
└── access-management/   # Admin controls
    └── page.tsx

components/
├── StatusBadge.tsx      # Connection status indicator
├── DeviceCard.tsx       # Device container
├── ToggleSwitch.tsx     # Binary on/off control
├── FanControl.tsx       # 4-stage speed selector
└── RGBStrip.tsx         # Color preset picker

lib/
└── blockchainUtils.ts   # Event decoding & encoding
```

## Integration Checklist

- [ ] Connect Wagmi to blockchain
- [ ] Implement `operateDevice()` transaction signing
- [ ] Implement `grantAccess()` for admin panel
- [ ] Add event listeners for real-time updates
- [ ] Add device status polling
- [ ] Implement MQTT topic mapping

## Design Philosophy

**Webasthetic**: Professional, minimalist, light-themed UI with:
- Zero unnecessary animations
- Instant state feedback
- Responsive mobile-first design
- High performance

## License

MIT
