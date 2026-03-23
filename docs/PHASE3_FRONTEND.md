# **Phase 3: Frontend Layer (Next.js) - Complete Guide**

## **Table of Contents**
1. [Frontend Overview](#frontend-overview)
2. [Project Setup](#project-setup)
3. [Configuration](#configuration)
4. [Component Structure](#component-structure)
5. [Key Features](#key-features)
6. [Wagmi & Web3 Integration](#wagmi--web3-integration)
7. [Pages & Routes](#pages--routes)
8. [Styling](#styling)
9. [Deployment](#deployment)

---

## **Frontend Overview**

The **Next.js frontend** is the user-facing interface for HomeChain. It provides:
- 🔐 Wallet connection (MetaMask, WalletConnect, etc.)
- 📱 Responsive dashboard
- 🎛️ Appliance control UI (toggles, sliders)
- 👥 Permission management
- 📊 Real-time state updates

### **Technology Stack**
- **Next.js 14** (App Router)
- **Wagmi 2.x** (Web3 hooks)
- **Viem** (Ethereum utilities)
- **Mantine** (Component library)
- **Tailwind CSS** (Styling)
- **React Query** (Server state)
- **Web3Modal** (Wallet connection)

---

## **Project Setup**

### **Initialize Next.js Project**

```bash
# Create project
npx create-next-app@latest homechain-frontend \
  --typescript \
  --tailwind \
  --app

cd homechain-frontend
```

### **Install Dependencies**

```bash
# Core Web3
npm install wagmi@2.x viem@2.x @wagmi/core

# Wallet UI
npm install @web3modal/wagmi

# UI Libraries
npm install @mantine/core @mantine/hooks
npm install @tabler/icons-react
npm install @mui/material @mui/icons-material @mui/joy

# State Management
npm install @tanstack/react-query

# Notifications
npm install react-hot-toast

# Config/env
npm install dotenv-webpack
```

### **Create .env.local**

```bash
NEXT_PUBLIC_RPC_URL=http://192.168.1.100:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afccb33d7d144aca41937d0cf6ae
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

---

## **Configuration**

### **config.js** - Wagmi Configuration

```javascript
// config.js
import { createConfig, http } from '@wagmi/core';
import { localhost } from '@wagmi/core/chains';

// Define Anvil chain (replaces localhost for clarity)
const anvilChain = {
  id: 31337,
  name: 'Anvil (Local BSC Fork)',
  network: 'anvil',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://192.168.1.100:8545'] },  // Update with Pi IP
    public: { http: ['http://192.168.1.100:8545'] },
  },
  blockExplorers: {
    default: { name: 'Block Explorer', url: 'https://example.com' },
  },
};

export const config = createConfig({
  chains: [anvilChain],
  transports: {
    [anvilChain.id]: http('http://192.168.1.100:8545'),
  },
});

// Smart contract details
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
```

### **Context Provider** - Web3ModalProvider

```javascript
// app/providers.jsx
'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '@/config';

const queryClient = new QueryClient();

export function Web3ModalProvider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

---

## **Component Structure**

### **Layout** - app/layout.js

```javascript
// app/layout.js
import '@mantine/core/styles.css';
import './globals.css';
import { MantineProvider } from '@mantine/core';
import { Web3ModalProvider } from '@/app/providers';
import { Navbar } from '@/components/Navbar';

export const metadata = {
  title: 'HomeChain - Decentralized Home Automation',
  description: 'Control your home with blockchain',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>
          <Web3ModalProvider>
            <div className="flex flex-col md:flex-row min-h-screen">
              <Navbar />
              <main className="flex-grow p-4">
                {children}
              </main>
            </div>
          </Web3ModalProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
```

### **Navbar** - components/Navbar.jsx

```javascript
// components/Navbar.jsx
'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';
import Link from 'next/link';
import { Navbar as MantineNavbar, Button, Group, Stack } from '@mantine/core';

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <MantineNavbar width={{ base: 300 }} p="md">
      <MantineNavbar.Section grow>
        <Group direction="column" grow spacing="lg">
          <Link href="/">
            <h1 className="text-2xl font-bold">🏠 HomeChain</h1>
          </Link>

          {isConnected ? (
            <>
              <Link href="/dashboard">
                <Button fullWidth>Dashboard</Button>
              </Link>
              <Link href="/room">
                <Button fullWidth>Rooms</Button>
              </Link>
              <Button 
                color="red" 
                onClick={() => disconnect()}
                fullWidth
              >
                Disconnect: {address?.slice(0, 6)}...
              </Button>
            </>
          ) : (
            <>
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  fullWidth
                >
                  Connect {connector.name}
                </Button>
              ))}
            </>
          )}
        </Group>
      </MantineNavbar.Section>
    </MantineNavbar>
  );
}
```

---

## **Key Features**

### **1. Wallet Connection** - pages/login/page.jsx

```javascript
'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button, Container, Stack, Text } from '@mantine/core';

export default function LoginPage() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  return (
    <Container size="sm" py="xl">
      <Stack spacing="lg">
        <h1>Connect Your Wallet</h1>
        
        {isConnected ? (
          <>
            <Text>Connected: {address}</Text>
            <Button onClick={() => disconnect()}>Disconnect</Button>
          </>
        ) : (
          <>
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => connect({ connector })}
                size="lg"
              >
                Connect {connector.name}
              </Button>
            ))}
          </>
        )}
      </Stack>
    </Container>
  );
}
```

### **2. Room Control** - app/room/[roomid]/page.jsx

```javascript
'use client';

import { useState, useEffect } from 'react';
import { useWriteContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { config } from '@/config';
import { abi } from '@/app/abi/abi';
import { Button, Grid, Card, Stack, Text, Switch } from '@mantine/core';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';

export default function RoomPage() {
  const { roomid } = useParams();
  const [appliances, setAppliances] = useState([]);
  const [states, setStates] = useState({});
  const { writeContract } = useWriteContract();

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const count = await readContract(config, {
          abi,
          address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          functionName: 'getApplianceCount',
          args: [BigInt(roomid)],
        });

        // Fetch each appliance
        const apps = [];
        for (let i = 0; i < parseInt(count); i++) {
          const details = await readContract(config, {
            abi,
            address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
            functionName: 'getApplianceDetails',
            args: [BigInt(roomid), BigInt(i)],
          });

          const state = await readContract(config, {
            abi,
            address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
            functionName: 'getSwitchState',
            args: [BigInt(roomid), BigInt(i)],
          });

          apps.push({ id: i, name: details, state });
          setStates(prev => ({ ...prev, [i]: state }));
        }

        setAppliances(apps);
      } catch (error) {
        console.error('Error fetching room:', error);
        toast.error('Failed to load room');
      }
    };

    fetchRoom();
  }, [roomid]);

  // Toggle appliance
  const handleToggle = async (applianceId) => {
    try {
      const result = await writeContract({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        abi,
        functionName: 'changeState',
        args: [BigInt(roomid), BigInt(applianceId)],
      });

      // Fetch updated state
      const updatedState = await readContract(config, {
        abi,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        functionName: 'getSwitchState',
        args: [BigInt(roomid), BigInt(applianceId)],
      });

      setStates(prev => ({ ...prev, [applianceId]: updatedState }));
      toast.success('State updated!');
    } catch (error) {
      console.error('Error toggling appliance:', error);
      toast.error('Failed to toggle appliance');
    }
  };

  return (
    <div>
      <h1>Room {roomid}</h1>
      
      <Grid>
        {appliances.map((app) => (
          <Grid.Col key={app.id} span={{ base: 12, md: 6, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack spacing="md">
                <Text weight={500}>{app.name}</Text>
                <Switch
                  checked={states[app.id] || false}
                  onChange={() => handleToggle(app.id)}
                  label={states[app.id] ? 'ON' : 'OFF'}
                />
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </div>
  );
}
```

---

## **Wagmi & Web3 Integration**

### **useWriteContract Hook**

```javascript
import { useWriteContract } from 'wagmi';

const { writeContract, isPending, isSuccess, isError } = useWriteContract();

const handleWrite = async () => {
  await writeContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: 'changeState',
    args: [BigInt(roomId), BigInt(applianceId)],
  });
};
```

### **useReadContract Hook** (from wagmi or readContract from @wagmi/core)

```javascript
import { readContract } from '@wagmi/core';
import { config } from '@/config';

const state = await readContract(config, {
  abi,
  address: CONTRACT_ADDRESS,
  functionName: 'getSwitchState',
  args: [BigInt(roomId), BigInt(applianceId)],
});
```

### **useAccount Hook**

```javascript
import { useAccount } from 'wagmi';

const { address, isConnected, chainId } = useAccount();
```

---

## **Pages & Routes**

```
app/
├── page.js               → Home / Login
├── login/page.jsx        → Login page (wallet connect)
├── dashboard/page.jsx    → Main dashboard
├── room/
│   ├── page.jsx         → List all rooms
│   └── [roomid]/page.jsx → Control appliances in room
├── admin/page.jsx        → Admin panel (add rooms)
├── abi/abi.js           → Contract ABI
├── layout.js             → Root layout
└── globals.css           → Global styles
```

---

## **Styling**

### **Tailwind CSS + Mantine**

```javascript
// Use Tailwind for quick layouts
<div className="flex flex-col md:flex-row gap-4 p-4">
  // Use Mantine for components
  <Card shadow="sm" padding="lg" radius="md">
    <Text weight={500}>Title</Text>
    <Button>Action</Button>
  </Card>
</div>
```

### **Custom CSS** (globals.css)

```css
:root {
  --primary-color: #3b82f6;
  --danger-color: #ef4444;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #f9fafb;
}

button {
  transition: all 0.2s ease-in-out;
}

button:hover {
  transform: translateY(-2px);
}
```

---

## **Deployment**

### **Development**

```bash
npm run dev
# Open http://localhost:3000
```

### **Production Build**

```bash
npm run build
npm run start
```

### **Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect GitHub:
# https://vercel.com → Import Project → Select GitHub repo
```

### **Environment Variables for Production**

On Vercel dashboard, set:
- `NEXT_PUBLIC_RPC_URL` → Your BSC Mainnet RPC
- `NEXT_PUBLIC_CONTRACT_ADDRESS` → Deployed contract address
- `NEXT_PUBLIC_CHAIN_ID` → 56 (for BSC mainnet)
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` → Your WC project ID

---

**Version:** 1.0  
**Last Updated:** January 27, 2026
