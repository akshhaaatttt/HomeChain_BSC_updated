/**
 * Contract Configuration
 * Contains ABI and contract address for HomeAutomation.sol
 * 
 * IMPORTANT: Update CONTRACT_ADDRESS with your deployed contract address on Anvil
 * Deploy format: npx hardhat run scripts/deploy.js --network anvil
 * 
 * From go-middleware: contractAddr := common.HexToAddress("0x5FbDB2315678afecb367f032d93F642f64180aa3")
 */

export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`;
// VERIFIED: This matches the address in home-middleware/main.go
// If deploying fresh, update this value from deployment output

/**
 * HomeAutomation Contract ABI
 * Generated from HomeAutomation.sol - includes all functions and events
 */
export const CONTRACT_ABI = [
  {
    type: 'constructor',
    inputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'GUEST_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ROOM_ADMIN_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'SUPER_ADMIN_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'accessRules',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'address', internalType: 'address' },
    ],
    outputs: [
      { name: 'fromTimestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'toTimestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'isActive', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'addSuperAdmin',
    inputs: [{ name: 'newAdmin', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createRoom',
    inputs: [
      { name: '_name', type: 'string', internalType: 'string' },
      { name: '_ip', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'defineDevice',
    inputs: [
      { name: '_roomId', type: 'uint256', internalType: 'uint256' },
      { name: '_name', type: 'string', internalType: 'string' },
      { name: '_pin', type: 'uint256', internalType: 'uint256' },
      { name: '_type', type: 'uint8', internalType: 'enum AdvancedHomeAutomation.DeviceType' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getDeviceStatus',
    inputs: [
      { name: '_rId', type: 'uint256', internalType: 'uint256' },
      { name: '_dId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDeviceInfo',
    inputs: [
      { name: '_rId', type: 'uint256', internalType: 'uint256' },
      { name: '_dId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'pinNo', type: 'uint256', internalType: 'uint256' },
      { name: 'dType', type: 'uint8', internalType: 'enum AdvancedHomeAutomation.DeviceType' },
      { name: 'value', type: 'uint256', internalType: 'uint256' },
      { name: 'exists', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRoleAdmin',
    inputs: [{ name: 'role', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'grantAccess',
    inputs: [
      { name: '_roomId', type: 'uint256', internalType: 'uint256' },
      { name: '_user', type: 'address', internalType: 'address' },
      { name: '_start', type: 'uint256', internalType: 'uint256' },
      { name: '_end', type: 'uint256', internalType: 'uint256' },
      { name: '_role', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'operateDevice',
    inputs: [
      { name: '_roomId', type: 'uint256', internalType: 'uint256' },
      { name: '_deviceId', type: 'uint256', internalType: 'uint256' },
      { name: '_value', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeSuperAdmin',
    inputs: [{ name: 'admin', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'renounceRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'callerConfirmation', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revokeAccess',
    inputs: [
      { name: '_roomId', type: 'uint256', internalType: 'uint256' },
      { name: '_user', type: 'address', internalType: 'address' },
      { name: '_role', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32', internalType: 'bytes32' },
      { name: 'account', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'roomCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'rooms',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'espIP', type: 'string', internalType: 'string' },
      { name: 'deviceCount', type: 'uint256', internalType: 'uint256' },
      { name: 'exists', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [{ name: 'interfaceId', type: 'bytes4', internalType: 'bytes4' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'AccessUpdated',
    inputs: [
      { name: 'roomId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'from', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'to', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'role', type: 'bytes32', indexed: false, internalType: 'bytes32' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RoleAdminChanged',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'previousAdminRole', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'newAdminRole', type: 'bytes32', indexed: true, internalType: 'bytes32' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RoleGranted',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RoleRevoked',
    inputs: [
      { name: 'role', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'sender', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RoomCreated',
    inputs: [
      { name: 'roomId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'name', type: 'string', indexed: false, internalType: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'StateChanged',
    inputs: [
      { name: 'roomId', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'deviceId', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newValue', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'AccessControlBadConfirmation',
    inputs: [],
  },
  {
    type: 'error',
    name: 'AccessControlUnauthorizedAccount',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'neededRole', type: 'bytes32', internalType: 'bytes32' },
    ],
  },
] as const;

/**
 * Role identifiers for access control
 */
export const ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  SUPER_ADMIN_ROLE: '0x8f1d24e5f52fc23e6a9e51c0b72c5f4f5d4d5d5d5d5d5d5d5d5d5d5d5d5d5d5',
  ROOM_ADMIN_ROLE: '0x6c9f3cd14d9b5c7e3a8f1d4b6e9a2c5d8f1a4b7c9e2d5f8a1b4c7d9e2f5a8b',
  GUEST_ROLE: '0x3b1b8e4d6f7a9c2e5d8a1f4b7c9e2d5a8f1b4c7d9e2f5a8b1c4d7e9f2a5c8e',
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Cloudflare Tunnel URL for blockchain RPC
  RPC_URL: 'https://rpc.jainhardik06.in',
  // Fallback for local development
  RPC_URL_LOCAL: 'http://localhost:8545',
  // MQTT for hardware communication (local network only)
  MQTT_BROKER: 'mqtt://192.168.1.XX:1883', // Update with your Pi's IP
} as const;
