import { defineChain } from 'viem';

/**
 * HomeChain Private Network Configuration
 * This is your Raspberry Pi's local Anvil/Hardhat instance
 * exposed via Ngrok tunnel for secure HTTPS access from anywhere
 * 
 * PRIMARY RPC URL: https://racheal-uninvoked-jeneva.ngrok-free.dev
 * This is the ngrok tunnel bridge to your Anvil instance
 * 
 * ENVIRONMENT VARIABLES:
 * NEXT_PUBLIC_RPC_URL=https://racheal-uninvoked-jeneva.ngrok-free.dev
 * NEXT_PUBLIC_RPC_FALLBACK=http://localhost:8545 (for local dev only)
 */

// Resolve RPC URL from environment first, then fall back to local node.
const getRpcUrl = (): string => {
  return process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'
}

export const homeChain = defineChain({
  id: 31337,
  name: 'Pi-BSC-Fork',
  network: 'pi-bsc-fork',
  nativeCurrency: {
    decimals: 18,
    name: 'Test Binance Coin',
    symbol: 'tBNB',
  },
  rpcUrls: {
    default: {
      http: [getRpcUrl()],
    },
  },
  blockExplorers: {
    default: {
      name: 'Local Anvil',
      url: 'http://localhost:3000',
    },
  },
  testnet: true,
});

/**
 * Network info for MetaMask setup
 * This is what gets added when users click "Connect Wallet"
 * 
 * CRITICAL FIX: If MetaMask says "nativeCurrency.symbol does not match":
 * 1. Delete the "HomeChain Blockchain" network from MetaMask (Settings > Networks > Delete)
 * 2. Try adding it again
 * This error happens when the network was already added with different settings.
 * 
 * CORS FIX: Ngrok blocks browser RPC calls due to CORS policy.
 * Solution: Use MetaMask as the RPC provider instead of direct HTTP calls.
 * See SystemStatus.tsx for workaround.
 */
export const homeChainMetaMaskConfig = {
  chainId: '0x7a69', // 31337 in hex
  chainName: 'Pi-BSC-Fork',  // Matches existing MetaMask network
  nativeCurrency: {
    name: 'Test Binance Coin',
    symbol: 'tBNB',
    decimals: 18,
  },
  // Ngrok/local RPC bridge
  rpcUrls: [
    process.env.NEXT_PUBLIC_RPC_URL ||
      'http://127.0.0.1:8545',
  ],
  blockExplorerUrls: [],
};

/**
 * Contract function signatures for type safety
 */
export const CONTRACT_FUNCTIONS = {
  OPERATE_DEVICE: 'operateDevice',
  CREATE_ROOM: 'createRoom',
  DEFINE_DEVICE: 'defineDevice',
  GRANT_ROLE: 'grantRole',
  REVOKE_ROLE: 'revokeRole',
  GET_DEVICE_STATUS: 'getDeviceStatus',
  GET_ROOM_COUNT: 'roomCount',
} as const;
