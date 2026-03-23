/**
 * Device Type Mapping Constants
 * Ensures consistency between Smart Contract and Frontend
 */

export const DEVICE_TYPES = {
  ON_OFF: 0,    // Light, Plug
  FAN: 1,       // Fan with speed control (0-3)
  DIMMER: 2,    // Dimmer/Brightness
  RGB: 3,       // RGB LED Strip with color modes (0-4: Off, Red, Green, Blue, White)
} as const

export const DEVICE_TYPE_NAMES: Record<number, string> = {
  0: 'Switch',
  1: 'Fan',
  2: 'Dimmer',
  3: 'RGB',
} as const

/**
 * Frontend-to-Contract Device Type Mapping
 * Maps user-friendly frontend types to contract enum values
 */
export const FRONTEND_DEVICE_TYPE_TO_CONTRACT: Record<
  'light' | 'fan' | 'plug' | 'rgb',
  number
> = {
  light: DEVICE_TYPES.DIMMER,    // Dimmable light
  fan: DEVICE_TYPES.FAN,          // Fan with speed
  plug: DEVICE_TYPES.ON_OFF,      // Smart plug (binary on/off)
  rgb: DEVICE_TYPES.RGB,          // RGB strip
} as const

/**
 * Contract-to-Frontend Device Type Mapping
 */
export const CONTRACT_DEVICE_TYPE_TO_FRONTEND: Record<
  number,
  'light' | 'fan' | 'plug' | 'rgb'
> = {
  0: 'plug',    // OnOff -> Plug
  1: 'fan',     // Fan -> Fan
  2: 'light',   // Dimmer -> Light
  3: 'rgb',     // RGB -> RGB
} as const

/**
 * Get max value for device type
 */
export const DEVICE_MAX_VALUES: Record<number, number> = {
  [DEVICE_TYPES.ON_OFF]: 1,  // 0=off, 1=on
  [DEVICE_TYPES.FAN]: 3,     // 0=off, 1=low, 2=med, 3=high
  [DEVICE_TYPES.DIMMER]: 255, // 0-255 brightness
  [DEVICE_TYPES.RGB]: 4,     // 0=off, 1=red, 2=green, 3=blue, 4=white
} as const

/**
 * Device value labels for UI
 */
export const DEVICE_VALUE_LABELS: Record<number, Record<number, string>> = {
  [DEVICE_TYPES.ON_OFF]: {
    0: 'Off',
    1: 'On',
  },
  [DEVICE_TYPES.FAN]: {
    0: 'Off',
    1: 'Low',
    2: 'Med',
    3: 'High',
  },
  [DEVICE_TYPES.RGB]: {
    0: 'Off',
    1: 'Red',
    2: 'Green',
    3: 'Blue',
    4: 'White',
  },
} as const

/**
 * Role identifiers (must match smart contract keccak256 hashes)
 * These are computed as keccak256(abi.encodePacked("ROLE_NAME"))
 * 
 * To compute: ethers.id("ROOM_ADMIN_ROLE") or web3.keccak256(utf8ToHex("ROOM_ADMIN_ROLE"))
 */
export const CONTRACT_ROLES = {
  // DEFAULT_ADMIN_ROLE from OpenZeppelin (always this value)
  SUPER_ADMIN: '0x0000000000000000000000000000000000000000000000000000000000000000',
  // keccak256("ROOM_ADMIN_ROLE")
  ROOM_ADMIN: '0xb832d6f1e4e87dd8f91d30ed5d7d75d95deab8ae8e27c28dc6fa5e3c7cf32e51',
  // keccak256("GUEST_ROLE")
  GUEST: '0xbc9fbf91f40c1fac73b46c6a60baa0fde4f76ef6aefc8a8bbdb32b9f8bab32e4',
} as const

/**
 * Human-readable role labels
 */
export const ROLE_LABELS: Record<'GUEST' | 'ROOM_ADMIN' | 'SUPER_ADMIN', string> = {
  GUEST: 'Guest',
  ROOM_ADMIN: 'Room Admin',
  SUPER_ADMIN: 'Super Admin',
} as const

/**
 * Role permissions
 */
export const ROLE_PERMISSIONS = {
  GUEST: {
    canControl: true,
    canGrantAccess: false,
    canCreateRooms: false,
    requiresTimeWindow: true, // Must respect startTime/endTime
  },
  ROOM_ADMIN: {
    canControl: true,
    canGrantAccess: true,
    canCreateRooms: false,
    requiresTimeWindow: false, // Ignores time window
  },
  SUPER_ADMIN: {
    canControl: true,
    canGrantAccess: true,
    canCreateRooms: true,
    requiresTimeWindow: false,
  },
} as const
