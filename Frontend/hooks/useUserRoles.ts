/**
 * Hook to check user's blockchain roles
 * Reads from smart contract to determine permissions
 */

import { useAccount } from 'wagmi'
import { CONTRACT_ROLES, ROLE_PERMISSIONS } from '@/lib/deviceConstants'

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

  // For now, return a default structure
  // In production, this would call contract.hasRole() for each role
  const isSuperAdmin = false
  const isRoomAdmin = false
  const isGuest = false

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

  return {
    isSuperAdmin,
    isRoomAdmin,
    isGuest,
    canControl: permissions.canControl,
    canGrantAccess: permissions.canGrantAccess,
    canCreateRooms: permissions.canCreateRooms,
    role,
    loading: !isConnected,
    error: undefined,
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
