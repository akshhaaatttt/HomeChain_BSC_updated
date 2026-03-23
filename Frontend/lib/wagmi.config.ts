import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { homeChain } from './blockchain';

/**
 * Wagmi Configuration for HomeChain
 * Configures wallet connection, RPC provider, and transport layer
 */
export const wagmiConfig = createConfig({
  chains: [homeChain],
  connectors: [
    injected(), // MetaMask and other injected wallets
  ],
  transports: {
    [homeChain.id]: http(homeChain.rpcUrls.default.http[0]),
  },
  ssr: true, // Enable server-side rendering for Next.js
});
