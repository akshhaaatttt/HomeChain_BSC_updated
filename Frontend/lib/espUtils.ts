/**
 * Room & ESP32 Networking Utilities
 * Validates IP addresses, checks connectivity, and manages ESP-to-Room mappings
 */

/**
 * Validates IPv4 address format
 * @param ip - IP address string (e.g., "192.168.1.100")
 * @returns true if valid IPv4, false otherwise
 */
export function isValidIPv4(ip: string): boolean {
  if (!ip) return false
  
  const ipv4Pattern = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
  return ipv4Pattern.test(ip.trim())
}

/**
 * Validates hostname/domain format
 * hostname format like: esp32-livingroom.local
 */
export function isValidHostname(hostname: string): boolean {
  if (!hostname) return false
  
  const hostnamePattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
  return hostnamePattern.test(hostname.trim())
}

/**
 * Validates IP address or hostname
 * @param address - IP or hostname
 * @returns true if valid IPv4 or hostname, false otherwise
 */
export function isValidESPAddress(address: string): boolean {
  return isValidIPv4(address) || isValidHostname(address)
}

/**
 * Formats IP address for display
 * @param ip - IP address or hostname
 * @returns formatted string with icon
 */
export function formatESPAddress(ip: string): string {
  if (!ip) return 'Not set'
  
  if (isValidIPv4(ip)) {
    return `🔗 ${ip}`
  } else if (isValidHostname(ip)) {
    return `📡 ${ip}`
  }
  return `❓ ${ip}`
}

/**
 * Attempts to check if ESP32 is online via simple endpoint
 * This is a client-side check - may fail due to CORS
 * ip - IP address or hostname
 * returns Promise<boolean> - true if ESP responds, false otherwise
 */
export async function checkESPConnectivity(ip: string): Promise<boolean> {
  if (!isValidESPAddress(ip)) return false
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(`http://${ip}/health`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    // Most likely CORS or network error - can't determine from client
    console.debug(`[ESP] Health check failed for ${ip}:`, error)
    return false
  }
}

/**
 * Extracts network info from IP address
 * ip example: "192.168.1.100"
 */
export function parseIPAddress(ip: string): {
  octets: number[]
  subnet: string
  network: string
  isPrivate: boolean
} | null {
  if (!isValidIPv4(ip)) return null
  
  const octets = ip.split('.').map(num => parseInt(num, 10))
  if (octets.length !== 4) return null
  
  const isPrivate = (
    (octets[0] === 10) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  )
  
  return {
    octets,
    subnet: `${octets[0]}.${octets[1]}.${octets[2]}.0/24`,
    network: `${octets[0]}.${octets[1]}.${octets[2]}.*`,
    isPrivate,
  }
}

/**
 * Generates MQTT topics for a room
 * roomId - Room ID from contract
 * espIP - ESP32 IP address
 */
export function generateMQTTTopics(roomId: number, espIP: string) {
  return {
    roomBase: `home/room${roomId}`,
    deviceControl: (deviceId: number) => `home/room${roomId}/device${deviceId}`,
    deviceStatus: (deviceId: number) => `home/room${roomId}/device${deviceId}/status`,
    roomStatus: `home/room${roomId}/status`,
    espStatus: `home/room${roomId}/esp/status`,
    espIP: `home/room${roomId}/esp/ip`,
  }
}

/**
 * Builds ESP URL for API calls
 * espIP - ESP IP or hostname
 * endpoint - API endpoint like "/api/status" or "/device/1"
 * protocol - HTTP protocol (default: "http")
 * port - Port number (default: 80)
 */
export function buildESPURL(
  espIP: string,
  endpoint: string,
  protocol: string = 'http',
  port: number = 80
): string {
  if (!isValidESPAddress(espIP)) return ''
  
  const baseURL = `${protocol}://${espIP}${port !== 80 && port !== 443 ? `:${port}` : ''}`
  return `${baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

/**
 * Room ESP mapping info for display
 */
export interface RoomESPInfo {
  roomId: number
  roomName: string
  espIP: string
  espStatus: 'online' | 'offline' | 'unknown'
  lastSeen?: string
  deviceCount: number
  mqttTopic: string
}

/**
 * Creates ESP info object for UI display
 */
export function createRoomESPInfo(
  roomId: number,
  roomName: string,
  espIP: string,
  deviceCount: number = 0
): RoomESPInfo {
  return {
    roomId,
    roomName,
    espIP,
    espStatus: 'unknown',
    deviceCount,
    mqttTopic: `home/room${roomId}`,
  }
}

/**
 * Validates room configuration
 */
export function validateRoomConfig(name: string, espIP: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!name || name.trim().length === 0) {
    errors.push('Room name is required')
  }
  if (name && name.length > 50) {
    errors.push('Room name must be less than 50 characters')
  }
  
  if (!espIP || espIP.trim().length === 0) {
    errors.push('ESP32 address (IP or hostname) is required')
  } else if (!isValidESPAddress(espIP)) {
    errors.push('Invalid ESP32 address format (must be valid IPv4 or hostname)')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
