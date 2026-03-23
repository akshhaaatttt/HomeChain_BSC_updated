'use client'

import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/constants'
import { homeChain } from '@/lib/blockchain'
import { useEffect, useState, useCallback } from 'react'

export interface DeviceStatus {
  roomId: number
  deviceId: number
  value: number
  lastUpdated: number
}

/**
 * Hook for real-time device status polling
 * Polls getDeviceStatus for all devices every 5000ms to keep UI in sync with blockchain
 * 
 * Usage:
 * const { deviceStatuses, isPolling } = useDevicePolling([
 *   { roomId: 1, deviceId: 1 },
 *   { roomId: 1, deviceId: 2 },
 * ]);
 */
export function useDevicePolling(
  devices: Array<{ roomId: number; deviceId: number }>,
  pollInterval: number = 5000
) {
  const [deviceStatuses, setDeviceStatuses] = useState<Map<string, DeviceStatus>>(new Map())
  const [isPolling, setIsPolling] = useState(false)
  const [lastPollTime, setLastPollTime] = useState<number>(0)

  // Create a cache key for each device
  const getCacheKey = useCallback((roomId: number, deviceId: number) => {
    return `${roomId}-${deviceId}`
  }, [])

  // Setup polling interval
  useEffect(() => {
    if (!devices || devices.length === 0) return

    const pollDeviceStatus = async () => {
      try {
        setIsPolling(true)

        const newStatuses = new Map(deviceStatuses)
        let hasChanges = false

        // Poll each device's status from the blockchain
        for (const device of devices) {
          const cacheKey = getCacheKey(device.roomId, device.deviceId)

          try {
            // Call getDeviceStatus(roomId, deviceId) on the smart contract
            // This is a read-only call, so it doesn't cost gas
            const result = await fetch(
              'https://rpc.jainhardik06.in', // Use your Cloudflare tunnel URL
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_call',
                  params: [
                    {
                      to: CONTRACT_ADDRESS,
                      // ABI encode: getDeviceStatus(uint256 roomId, uint256 deviceId)
                      data: encodeGetDeviceStatusCall(device.roomId, device.deviceId),
                    },
                    'latest',
                  ],
                  id: 1,
                }),
              }
            )

            const jsonResponse = await result.json()

            if (jsonResponse.result) {
              // Decode the result from hex to BigInt
              const value = BigInt(jsonResponse.result)
              const currentStatus = newStatuses.get(cacheKey)

              // Only update if value changed
              if (!currentStatus || currentStatus.value !== Number(value)) {
                newStatuses.set(cacheKey, {
                  roomId: device.roomId,
                  deviceId: device.deviceId,
                  value: Number(value),
                  lastUpdated: Date.now(),
                })
                hasChanges = true
              }
            }
          } catch (err) {
            console.error(
              `Failed to poll device ${device.roomId}-${device.deviceId}:`,
              err
            )
          }
        }

        if (hasChanges) {
          setDeviceStatuses(newStatuses)
        }

        setLastPollTime(Date.now())
      } catch (error) {
        console.error('Device polling error:', error)
      } finally {
        setIsPolling(false)
      }
    }

    // Poll immediately on mount
    pollDeviceStatus()

    // Set up interval for continuous polling
    const interval = setInterval(pollDeviceStatus, pollInterval)

    return () => clearInterval(interval)
  }, [devices, pollInterval, getCacheKey, deviceStatuses])

  return {
    deviceStatuses,
    isPolling,
    lastPollTime,
    getStatus: (roomId: number, deviceId: number) => {
      const key = getCacheKey(roomId, deviceId)
      return deviceStatuses.get(key)?.value ?? null
    },
  }
}

/**
 * ABI encode function for getDeviceStatus(uint256 roomId, uint256 deviceId)
 * Selector: 0x12345678 (example - use actual selector from contract)
 */
function encodeGetDeviceStatusCall(roomId: number, deviceId: number): string {
  // Function selector for getDeviceStatus - you may need to calculate this
  // For now, using a placeholder - replace with actual selector from ethers
  const selector = '0xf7a0ba1e' // This is an example, verify from your contract

  // Pad parameters to 32 bytes
  const roomIdPadded = BigInt(roomId).toString(16).padStart(64, '0')
  const deviceIdPadded = BigInt(deviceId).toString(16).padStart(64, '0')

  return `${selector}${roomIdPadded}${deviceIdPadded}`
}

/**
 * Alternative: Use wagmi's useReadContract for a single device
 * This is more straightforward but requires one hook per device
 */
export function useDeviceStatusReader(roomId: number, deviceId: number) {
  const { data: status, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getDeviceStatus',
    args: [BigInt(roomId), BigInt(deviceId)],
    chainId: homeChain.id,
    query: {
      // Refetch every 5 seconds
      refetchInterval: 5000,
    },
  })

  return {
    status: status ? Number(status) : null,
    isLoading,
    refetch,
  }
}
