'use client';

import { useReadContract } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/constants';

/**
 * Hook for reading contract state via wagmi
 * Uses the configured RPC provider (MetaMask → Wagmi → Ngrok)
 * No direct HTTP calls, no CORS issues
 */

export function useRoomCount() {
  const { data: roomCount, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'roomCount',
  });

  return {
    roomCount: roomCount ? Number(roomCount) : 0,
    isLoading,
    error,
  };
}

export function useGetRoom(roomId: number) {
  const { data: room, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'rooms',
    args: [BigInt(roomId)],
  });

  return {
    room,
    isLoading,
    error,
  };
}

export function useGetDeviceStatus(roomId: number, deviceId: number) {
  const { data: status, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getDeviceStatus',
    args: [BigInt(roomId), BigInt(deviceId)],
  });

  return {
    status,
    isLoading,
    error,
  };
}

/**
 * Helper function to load all devices for a room
 * Note: Must be called from component context with Web3 instance
 */
export async function loadDevicesForRoom(
  roomId: number,
  deviceCount: number,
  contract: any
): Promise<any[]> {
  if (deviceCount === 0) return [];

  const devices = [];
  for (let i = 1; i <= deviceCount; i++) {
    try {
      const device = await (contract.methods.rooms(roomId).devices(i) as any).call();
      devices.push({
        id: i,
        ...device,
      });
    } catch (err) {
      console.warn(`Failed to load device ${i} of room ${roomId}:`, err);
    }
  }
  return devices;
}

/**
 * Hook to get room data structure
 * Contract returns room as a tuple: [name, espIP, deviceCount, active]
 */
export interface RoomData {
  name: string;
  espIP: string;
  deviceCount?: bigint;
  active?: boolean;
}

export function useRoomData(roomId: number) {
  const { room, isLoading, error } = useGetRoom(roomId);

  // Room is returned as tuple: [name, espIP, deviceCount, active]
  return {
    name: room?.[0] as string | undefined,
    espIP: room?.[1] as string | undefined,
    deviceCount: room?.[2] as bigint | undefined,
    active: room?.[3] as boolean | undefined,
    isLoading,
    error,
  };
}
