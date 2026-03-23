'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/constants';

import { useState } from 'react';

export interface DeviceControlState {
  isLoading: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  hash?: `0x${string}`;
  error?: Error;
}

/**
 * Hook for controlling smart home devices via blockchain
 * Provides transaction signing and submission to HomeAutomation contract
 * 
 * Usage:
 * const { toggleDevice, deviceState } = useDeviceControl();
 * toggleDevice(roomId, deviceId, value); // triggers MetaMask popup
 */
export function useDeviceControl() {
  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const [error, setError] = useState<Error | undefined>();

  /**
   * Execute operateDevice transaction
   * @param roomId - Room ID (0-indexed)
   * @param deviceId - Device ID within the room
   * @param value - Operation value (0=off, 1=on, 2=brightness level, 3=speed level)
   */
  const toggleDevice = async (roomId: number, deviceId: number, value: number) => {
    try {
      setError(undefined);

      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x') {
        throw new Error('Contract address not configured. Please set CONTRACT_ADDRESS in lib/constants.ts');
      }

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'operateDevice',
        args: [BigInt(roomId), BigInt(deviceId), BigInt(value)],
      } as any);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Device control error:', error);
    }
  };

  /**
   * Grant temporary access to a user for a room
   * @param roomId - Room ID
   * @param userAddress - Wallet address of the user
   * @param startTime - Unix timestamp when access starts
   * @param endTime - Unix timestamp when access ends
   * @param roleBytes - Role identifier (e.g., GUEST_ROLE or ROOM_ADMIN_ROLE)
   */
  const grantAccess = async (
    roomId: number,
    userAddress: string,
    startTime: number,
    endTime: number,
    roleBytes: `0x${string}`
  ) => {
    try {
      setError(undefined);

      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x') {
        throw new Error('Contract address not configured');
      }

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'grantAccess',
        args: [BigInt(roomId), userAddress as `0x${string}`, BigInt(startTime), BigInt(endTime), roleBytes],
      } as any);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Grant access error:', error);
    }
  };

  /**
   * Revoke access for a user from a room
   */
  const revokeAccess = async (roomId: number, userAddress: string, roleBytes: `0x${string}`) => {
    try {
      setError(undefined);

      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x') {
        throw new Error('Contract address not configured');
      }

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'revokeAccess',
        args: [BigInt(roomId), userAddress as `0x${string}`, roleBytes],
      } as any)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Revoke access error:', error);
    }
  };

  /**
   * Create a new room
   */
  const createRoom = async (name: string, espIP: string) => {
    try {
      setError(undefined);

      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x') {
        throw new Error('Contract address not configured');
      }

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createRoom',
        args: [name, espIP],
      } as any)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Create room error:', error);
    }
  };

  /**
   * Define a device in a room
   */
  const defineDevice = async (roomId: number, name: string, pin: number, deviceType: number) => {
    try {
      setError(undefined);

      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x') {
        throw new Error('Contract address not configured');
      }

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'defineDevice',
        args: [BigInt(roomId), name, BigInt(pin), deviceType],
      } as any)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Define device error:', error);
    }
  };

  return {
    toggleDevice,
    grantAccess,
    revokeAccess,
    createRoom,
    defineDevice,
    deviceState: {
      isLoading: isPending,
      isConfirming,
      isConfirmed,
      hash,
      error,
    } as DeviceControlState,
  };
}
