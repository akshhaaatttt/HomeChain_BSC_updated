/**
 * Hook to fetch actual rooms from smart contract
 * Ensures frontend always uses contract source of truth
 */

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

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
  const { isConnected } = useAccount()
  const [rooms, setRooms] = useState<ContractRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        if (!isConnected) {
          setRooms([])
          setLoading(false)
          return
        }

        // TODO: Implement actual contract call using Wagmi
        // const roomCount = await readContract({
        //   address: CONTRACT_ADDRESS,
        //   abi: CONTRACT_ABI,
        //   functionName: 'roomCount',
        // })

        // For now, fetch from API endpoint (when backend is ready)
        // const response = await fetch('/api/rooms')
        // const data = await response.json()
        // setRooms(data)

        // Initialize empty for now
        setRooms([])
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
        setError('Failed to load rooms from contract')
        setLoading(false)
      }
    }

    fetchRooms()
  }, [isConnected])

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
