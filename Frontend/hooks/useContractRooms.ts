/**
 * Hook to fetch actual rooms from smart contract
 * Ensures frontend always uses contract source of truth
 */

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/constants'
import { homeChain } from '@/lib/blockchain'

export interface ContractRoom {
  id: number
  name: string
  espIP: string
  deviceCount: number
  exists: boolean
}

/**
 * Fetch all rooms from contract
 * This replaces the hardcoded ROOMS array
 */
export function useContractRooms() {
  const publicClient = usePublicClient({ chainId: homeChain.id })
  const [rooms, setRooms] = useState<ContractRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!publicClient) {
          setRooms([])
          setLoading(false)
          return
        }

        const roomCount = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'roomCount',
        })

        const nextRooms: ContractRoom[] = []
        for (let roomId = 1; roomId <= Number(roomCount); roomId++) {
          const roomInfo = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getRoomInfo',
            args: [BigInt(roomId)],
          })

          const [name, espIP, deviceCount, exists] = roomInfo as [string, string, bigint, boolean]
          if (!exists) {
            continue
          }

          nextRooms.push({
            id: roomId,
            name,
            espIP,
            deviceCount: Number(deviceCount),
            exists,
          })
        }

        setRooms(nextRooms)
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
        setError('Failed to load rooms from contract')
        setLoading(false)
      }
    }

    fetchRooms()
  }, [publicClient])

  return { rooms, loading, error }
}

/**
 * Validate that a room exists in the contract
 */
export function useRoomExists(roomId: number) {
  const { rooms, loading } = useContractRooms()

  const exists = rooms.some((r) => r.id === roomId)

  return { exists, loading, rooms }
}
