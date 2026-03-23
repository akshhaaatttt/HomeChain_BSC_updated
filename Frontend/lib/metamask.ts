/**
 * MetaMask Network Helper
 * Enables adding the HomeChain private network to MetaMask
 */

import { homeChainMetaMaskConfig } from './blockchain';

export interface AddNetworkParams {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls?: string[];
}

/**
 * Add HomeChain network to MetaMask
 * Prompts user to approve adding the custom network
 */
export async function addHomeChainToMetaMask() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: homeChainMetaMaskConfig.chainId,
          chainName: homeChainMetaMaskConfig.chainName,
          rpcUrls: homeChainMetaMaskConfig.rpcUrls,
          nativeCurrency: homeChainMetaMaskConfig.nativeCurrency,
          blockExplorerUrls: homeChainMetaMaskConfig.blockExplorerUrls,
        },
      ],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected adding HomeChain network');
    }
    throw error;
  }
}

/**
 * Request account access from MetaMask
 */
export async function requestMetaMaskAccount(): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected MetaMask connection');
    }
    throw error;
  }
}

/**
 * Check if HomeChain network is already added to MetaMask
 */
export async function isHomeChainOnMetaMask(): Promise<boolean> {
  if (!window.ethereum) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });
    // 31337 in hex is 0x7a69
    return chainId === '0x7a69';
  } catch {
    return false;
  }
}

/**
 * Switch to HomeChain network in MetaMask
 */
export async function switchToHomeChain(): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x7a69' }],
    });
  } catch (error: any) {
    // Network doesn't exist, add it
    if (error.code === 4902) {
      await addHomeChainToMetaMask();
    } else if (error.code !== 4001) {
      // User rejected
      throw error;
    }
  }
}

// MetaMask is injected into window.ethereum by the MetaMask extension
// Type is already available from web3 libraries
