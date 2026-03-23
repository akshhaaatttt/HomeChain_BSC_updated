/**
 * Contract configuration aligned with src/HomeAutomation.sol and home-middleware bindings.
 */

const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

const resolvedContractAddress =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS &&
  /^0x[a-fA-F0-9]{40}$/.test(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS)
    ? process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    : DEFAULT_CONTRACT_ADDRESS

export const CONTRACT_ADDRESS = resolvedContractAddress as `0x${string}`

/**
 * ABI kept intentionally scoped to functions/events used by the current frontend.
 */
export const CONTRACT_ABI = [
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
    name: 'getRoomInfo',
    inputs: [{ name: '_rId', type: 'uint256', internalType: 'uint256' }],
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
    name: 'SUPER_ADMIN_ROLE',
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
    name: 'GUEST_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
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
    type: 'event',
    name: 'RoomRemoved',
    inputs: [{ name: 'roomId', type: 'uint256', indexed: true, internalType: 'uint256' }],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'DeviceRemoved',
    inputs: [
      { name: 'roomId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'deviceId', type: 'uint256', indexed: true, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const

export const ROLES = {
  DEFAULT_ADMIN_ROLE:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  SUPER_ADMIN_ROLE:
    '0x7613a25ecc738585a232ad50a301178f12b3ba8887d13e138b523c4269c47689',
  ROOM_ADMIN_ROLE:
    '0xd447a3c4dd90ef7c021891ef063fd5f30240ff1a4b31f6c1767ba066aaf86dca',
  GUEST_ROLE:
    '0xb6a185f76b0ff8a0f9708ffce8e6b63ce2df58f28ad66179fb4e230e98d0a52f',
} as const

export const API_CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545',
  RPC_URL_LOCAL: process.env.NEXT_PUBLIC_RPC_FALLBACK || 'http://localhost:8545',
  MIDDLEWARE_URL: process.env.NEXT_PUBLIC_MIDDLEWARE_URL || '',
} as const
