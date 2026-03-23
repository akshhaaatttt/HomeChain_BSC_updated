/**
 * Hook to check user's blockchain roles
 * Reads from smart contract to determine permissions
 */

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { ROLE_PERMISSIONS } from '@/lib/deviceConstants'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/constants'
import { usePublicClient } from 'wagmi'
import { homeChain } from '@/lib/blockchain'

export interface UserRoles {
  isSuperAdmin: boolean
  isRoomAdmin: boolean
  isGuest: boolean
  canControl: boolean
  canGrantAccess: boolean
  canCreateRooms: boolean
  role: 'SUPER_ADMIN' | 'ROOM_ADMIN' | 'GUEST' | 'NONE'
}

/**
 * Returns user's roles and permissions from smart contract
 * Uses AccessControl contract to check hasRole()
 */
export function useUserRoles(): UserRoles & { loading: boolean; error?: Error } {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: homeChain.id })

  const [state, setState] = useState<{
    loading: boolean
    error?: Error
    roles: UserRoles
  }>({
    loading: true,
    roles: {
      isSuperAdmin: false,
      isRoomAdmin: false,
      isGuest: false,
      canControl: false,
      canGrantAccess: false,
      canCreateRooms: false,
      role: 'NONE',
    },
  })

  useEffect(() => {
    const loadRoles = async () => {
      if (!isConnected || !address || !publicClient) {
        setState((prev) => ({
          ...prev,
          loading: false,
          roles: {
            isSuperAdmin: false,
            isRoomAdmin: false,
            isGuest: false,
            canControl: false,
            canGrantAccess: false,
            canCreateRooms: false,
            role: 'NONE',
          },
          error: undefined,
        }))
        return
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: undefined }))

        const [superAdminRole, roomAdminRole, guestRole] = await Promise.all([
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'SUPER_ADMIN_ROLE',
          }),
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'ROOM_ADMIN_ROLE',
          }),
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'GUEST_ROLE',
          }),
        ])

        const [isSuperAdmin, isRoomAdmin, isGuest] = await Promise.all([
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'hasRole',
            args: [superAdminRole, address],
          }),
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'hasRole',
            args: [roomAdminRole, address],
          }),
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'hasRole',
            args: [guestRole, address],
          }),
        ])

        const role: UserRoles['role'] = isSuperAdmin
          ? 'SUPER_ADMIN'
          : isRoomAdmin
            ? 'ROOM_ADMIN'
            : isGuest
              ? 'GUEST'
              : 'NONE'

        const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || {
          canControl: false,
          canGrantAccess: false,
          canCreateRooms: false,
          requiresTimeWindow: true,
        }

        setState({
          loading: false,
          error: undefined,
          roles: {
            isSuperAdmin: Boolean(isSuperAdmin),
            isRoomAdmin: Boolean(isRoomAdmin),
            isGuest: Boolean(isGuest),
            canControl: permissions.canControl,
            canGrantAccess: permissions.canGrantAccess,
            canCreateRooms: permissions.canCreateRooms,
            role,
          },
        })
      } catch (error) {
        const normalizedError =
          error instanceof Error ? error : new Error('Failed to read user roles')
        setState((prev) => ({
          ...prev,
          loading: false,
          error: normalizedError,
        }))
      }
    }

    loadRoles()
  }, [address, isConnected, publicClient])

  return {
    ...state.roles,
    loading: state.loading,
    error: state.error,
  }
}

/**
 * Check if user can perform an action
 */
export function useCanPerformAction(action: 'control' | 'grantAccess' | 'createRooms') {
  const roles = useUserRoles()

  const canPerform = {
    control: roles.canControl,
    grantAccess: roles.canGrantAccess,
    createRooms: roles.canCreateRooms,
  }

  return canPerform[action]
}
