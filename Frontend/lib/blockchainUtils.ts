import { parseAbiItem } from 'viem'

// Non-Indexed StateChanged Event ABI (96-byte packed data)
// Format: roomId (32 bytes) + deviceId (32 bytes) + newValue (32 bytes)
export const STATE_CHANGED_EVENT = parseAbiItem(
  'event StateChanged(bytes data)'
)

export interface DeviceCommand {
  roomId: number
  deviceId: number
  newValue: number
}

/**
 * Decodes the 96-byte packed data from StateChanged event
 * This follows the "Zero-Index" architecture where all parameters
 * are packed into a single contiguous data block to avoid ABI mismatches
 */
export function decodeStateChangedEvent(data: string): DeviceCommand {
  // Remove '0x' prefix and split into 32-byte (64 hex char) chunks
  const hexData = data.startsWith('0x') ? data.slice(2) : data

  const roomId = parseInt(hexData.slice(0, 64), 16)
  const deviceId = parseInt(hexData.slice(64, 128), 16)
  const newValue = parseInt(hexData.slice(128, 192), 16)

  return { roomId, deviceId, newValue }
}

/**
 * Encode device command into blockchain payload
 * Returns the values for operateDevice(roomId, deviceId, newValue)
 */
export function encodeDeviceCommand(
  roomId: number,
  deviceId: number,
  newValue: number
): [number, number, number] {
  return [roomId, deviceId, newValue]
}

/**
 * Map device IDs to their friendly names
 */
export const DEVICE_MAP = {
  1: 'Fan Control',
  2: 'Main Bulb',
  3: 'Smart Plug',
  4: 'RGB Strip',
} as const

/**
 * Map fan speed values to labels
 */
export const FAN_SPEEDS = {
  0: 'Off',
  1: 'Low',
  2: 'Medium',
  3: 'High',
} as const
