'use client'

import { useState, useEffect } from 'react'
import { Shield, Users, Lock, Settings, Trash2, Plus, Home, Zap } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Card, CardHeader, CardBody, Badge } from '@/components/UI'
import HardwareProvisioning from '@/components/HardwareProvisioning'
import AdminDebug from '@/components/AdminDebug'
import { useAccount } from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/constants'
import { DEVICE_TYPES, DEVICE_TYPE_NAMES } from '@/lib/deviceConstants'
import { useRoomCount, useGetRoom } from '@/hooks/useContractRead'
import { isValidIPv4, isValidHostname, formatESPAddress, validateRoomConfig } from '@/lib/espUtils'
import Web3 from 'web3'

interface Admin {
  id: string
  address: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  permissions: string[]
  status: 'active' | 'inactive'
  addedAt: number
}

interface Room {
  id: number
  name: string
  ip: string
}

interface DeviceFormState {
  roomId: number
  name: string
  pin: number  // For single-pin devices (On/Off)
  pinSlow?: number  // Fan slow speed pin
  pinMedium?: number  // Fan medium speed pin
  pinFast?: number  // Fan fast speed pin
  pinRed?: number  // RGB red pin
  pinGreen?: number  // RGB green pin
  pinBlue?: number  // RGB blue pin
  pinRelay?: number  // RGB relay pin (on/off control)
  type: number
}

export default function AdminPanel() {
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: '1',
      address: '0x742d35Cc6634C0532925a3b844Bc7e7a6f8e3c0b',
      role: 'SUPER_ADMIN',
      permissions: ['create_rooms', 'manage_users', 'system_settings', 'view_logs'],
      status: 'active',
      addedAt: Date.now() - 86400 * 30,
    },
  ])

  const [rooms, setRooms] = useState<Room[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'hardware' | 'rooms' | 'system'>('rooms')
  const [isLoading, setIsLoading] = useState(false)

  const [roomForm, setRoomForm] = useState({ name: '', ip: '' })
  const [deviceForm, setDeviceForm] = useState<DeviceFormState>({
    roomId: 1,
    name: '',
    pin: 0,
    pinSlow: 0,
    pinMedium: 0,
    pinFast: 0,
    pinRed: 0,
    pinGreen: 0,
    pinBlue: 0,
    pinRelay: 0,
    type: DEVICE_TYPES.ON_OFF,
  })

  const { address, isConnected } = useAccount()
  
  // Use wagmi hook to get room count (via proper RPC provider, no CORS issues)
  const { roomCount, isLoading: isLoadingCount } = useRoomCount()

  // Handle room creation - WRITES TO BLOCKCHAIN
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verify wallet connection
    if (!isConnected || !address) {
      setError('❌ Please connect your wallet first')
      console.error('[Admin] Wallet not connected')
      return
    }

    // Validate room config
    const validation = validateRoomConfig(roomForm.name, roomForm.ip)
    if (!validation.valid) {
      setError(`❌ ${validation.errors.join(', ')}`)
      return
    }

    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      // Verify MetaMask provider exists
      if (!(window as any).ethereum) {
        setError('❌ MetaMask not found. Please install MetaMask.')
        console.error('[Admin] MetaMask provider not found')
        return
      }

      const web3 = new Web3((window as any).ethereum)
      const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS as string)

      console.log('[Admin] Creating room on-chain:', { 
        name: roomForm.name, 
        espIP: roomForm.ip, 
        from: address 
      })

      // Encode function call
      const data = (contract.methods.createRoom(roomForm.name, roomForm.ip) as any).encodeABI()
      console.log('[Admin] Encoded data:', data)
      
      // Estimate gas
      let gasEstimate
      try {
        gasEstimate = await web3.eth.estimateGas({
          from: address,
          to: CONTRACT_ADDRESS,
          data: data
        })
        console.log('[Admin] Gas estimate:', gasEstimate.toString())
      } catch (gasErr: any) {
        console.error('[Admin] Gas estimation failed:', gasErr.message)
        setError(`❌ Gas estimation failed: ${gasErr.message}`)
        setIsLoading(false)
        return
      }
      
      // Send transaction - THIS SHOULD TRIGGER METAMASK
      let txHash
      try {
        console.log('[Admin] Sending transaction to MetaMask...')
        txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: CONTRACT_ADDRESS,
            data: data,
            gas: web3.utils.toHex(Math.ceil(Number(gasEstimate) * 1.2))
          }]
        })
        console.log('[Admin] MetaMask accepted transaction:', txHash)
      } catch (txErr: any) {
        console.error('[Admin] MetaMask transaction error:', txErr)
        if (txErr.code === 4001) {
          setError('❌ Transaction rejected by user')
        } else {
          setError(`❌ MetaMask error: ${txErr.message}`)
        }
        setIsLoading(false)
        return
      }

      setSuccess('⏳ Transaction sent. Waiting for confirmation...')

      // Poll for receipt
      let receipt = null
      let confirmationWait = 0
      while (confirmationWait < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        receipt = await web3.eth.getTransactionReceipt(txHash)
        confirmationWait++
        
        if (receipt) {
          console.log('[Admin] ✅ Room created in block:', receipt.blockNumber)
          setSuccess(`✅ Room "${roomForm.name}" confirmed on-chain!`)
          setRoomForm({ name: '', ip: '' })
          
          // Force reload by querying contract directly
          console.log('[Admin] Reloading rooms from contract...')
          const newRoomCount = await (contract.methods.roomCount() as any).call()
          console.log('[Admin] New roomCount from contract:', newRoomCount.toString())
          
          // Directly load and display the new room
          const newRooms: Room[] = []
          for (let i = 1; i <= Number(newRoomCount); i++) {
            const room = await (contract.methods.rooms(i) as any).call()
            newRooms.push({
              id: i,
              name: typeof room.name === 'string' ? room.name : room[0],
              ip: typeof room.espIP === 'string' ? room.espIP : room[1],
            })
          }
          setRooms(newRooms)
          console.log('[Admin] Rooms reloaded:', newRooms)
          break
        }
      }
      
      if (!receipt) {
        setError('⚠️ Transaction pending... Please refresh page to check status.')
      }
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      console.error('[Admin] Unexpected error:', err)
      setError(`❌ Error: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle device definition - WRITES TO BLOCKCHAIN
  const handleDefineDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verify wallet connection
    if (!isConnected || !address) {
      setError('❌ Please connect your wallet first')
      console.error('[Admin] Wallet not connected')
      return
    }

    if (!deviceForm.name) {
      setError('❌ Please fill in all fields')
      return
    }

    // Validate pins based on device type
    if (deviceForm.type === DEVICE_TYPES.FAN && (!deviceForm.pinSlow || !deviceForm.pinMedium || !deviceForm.pinFast)) {
      setError('❌ Please fill in all Fan speed pins (Slow, Medium, Fast)')
      return
    }

    if (deviceForm.type === DEVICE_TYPES.RGB && (!deviceForm.pinRed || !deviceForm.pinGreen || !deviceForm.pinBlue || !deviceForm.pinRelay)) {
      setError('❌ Please fill in all RGB pins (Red, Green, Blue, and Relay)')
      return
    }

    if ((deviceForm.type === DEVICE_TYPES.ON_OFF || deviceForm.type === DEVICE_TYPES.DIMMER) && deviceForm.pin < 0) {
      setError('❌ Please fill in the GPIO pin')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      // Verify MetaMask provider exists
      if (!(window as any).ethereum) {
        setError('❌ MetaMask not found. Please install MetaMask.')
        console.error('[Admin] MetaMask provider not found')
        return
      }

      const web3 = new Web3((window as any).ethereum)
      const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS as string)

      // Calculate pin value based on device type
      // For multi-pin devices, we pack multiple pins into a single uint256
      let pinValue = deviceForm.pin
      let pinInfo: any = { pin: pinValue }

      if (deviceForm.type === DEVICE_TYPES.FAN) {
        // Pack 3 pins: (slow << 8) | (medium << 16) | (fast << 24)
        pinValue = (deviceForm.pinSlow || 0) | ((deviceForm.pinMedium || 0) << 8) | ((deviceForm.pinFast || 0) << 16)
        pinInfo = { slow: deviceForm.pinSlow, medium: deviceForm.pinMedium, fast: deviceForm.pinFast, packed: pinValue }
      } else if (deviceForm.type === DEVICE_TYPES.RGB) {
        // Pack 4 pins: red | (green << 8) | (blue << 16) | (relay << 24)
        pinValue = (deviceForm.pinRed || 0) | ((deviceForm.pinGreen || 0) << 8) | ((deviceForm.pinBlue || 0) << 16) | ((deviceForm.pinRelay || 0) << 24)
        pinInfo = { red: deviceForm.pinRed, green: deviceForm.pinGreen, blue: deviceForm.pinBlue, relay: deviceForm.pinRelay, packed: pinValue }
      }

      console.log('[Admin] Defining device on-chain:', {
        roomId: deviceForm.roomId,
        name: deviceForm.name,
        pinValue: pinValue,
        pinInfo: pinInfo,
        type: deviceForm.type,
        typeEnum: DEVICE_TYPES,
        typeName: DEVICE_TYPES.ON_OFF === deviceForm.type ? 'OnOff' : DEVICE_TYPES.FAN === deviceForm.type ? 'Fan' : DEVICE_TYPES.DIMMER === deviceForm.type ? 'Dimmer' : DEVICE_TYPES.RGB === deviceForm.type ? 'RGB' : 'Unknown',
        from: address
      })

      // Encode function call
      const data = (contract.methods.defineDevice(
        deviceForm.roomId,
        deviceForm.name,
        pinValue,
        deviceForm.type
      ) as any).encodeABI()
      console.log('[Admin] Encoded data:', data)
      
      // Estimate gas
      let gasEstimate
      try {
        gasEstimate = await web3.eth.estimateGas({
          from: address,
          to: CONTRACT_ADDRESS,
          data: data
        })
        console.log('[Admin] Gas estimate:', gasEstimate.toString())
      } catch (gasErr: any) {
        console.error('[Admin] Gas estimation failed:', gasErr.message)
        setError(`❌ Gas estimation failed: ${gasErr.message}`)
        setIsLoading(false)
        return
      }
      
      // Send transaction - THIS SHOULD TRIGGER METAMASK
      let txHash
      try {
        console.log('[Admin] Sending transaction to MetaMask...')
        txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: CONTRACT_ADDRESS,
            data: data,
            gas: web3.utils.toHex(Math.ceil(Number(gasEstimate) * 1.2))
          }]
        })
        console.log('[Admin] MetaMask accepted transaction:', txHash)
      } catch (txErr: any) {
        console.error('[Admin] MetaMask transaction error:', txErr)
        if (txErr.code === 4001) {
          setError('❌ Transaction rejected by user')
        } else {
          setError(`❌ MetaMask error: ${txErr.message}`)
        }
        setIsLoading(false)
        return
      }

      setSuccess('⏳ Transaction sent. Waiting for confirmation...')

      // Poll for receipt
      let receipt = null
      let confirmationWait = 0
      while (confirmationWait < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        receipt = await web3.eth.getTransactionReceipt(txHash)
        confirmationWait++
        
        if (receipt) {
          console.log('[Admin] ✅ Device defined in block:', receipt.blockNumber)
          setSuccess(`✅ Device "${deviceForm.name}" confirmed on-chain!`)
          setDeviceForm({ roomId: 1, name: '', pin: 0, pinSlow: 0, pinMedium: 0, pinFast: 0, pinRed: 0, pinGreen: 0, pinBlue: 0, pinRelay: 0, type: DEVICE_TYPES.ON_OFF })
          
          // Force reload by querying contract directly
          console.log('[Admin] Reloading rooms and devices...')
          const newRoomCount = await (contract.methods.roomCount() as any).call()
          console.log('[Admin] New roomCount from contract:', newRoomCount.toString())
          
          // Directly load and display all rooms
          const newRooms: Room[] = []
          for (let i = 1; i <= Number(newRoomCount); i++) {
            const room = await (contract.methods.rooms(i) as any).call()
            newRooms.push({
              id: i,
              name: typeof room.name === 'string' ? room.name : room[0],
              ip: typeof room.espIP === 'string' ? room.espIP : room[1],
            })
          }
          setRooms(newRooms)
          console.log('[Admin] Rooms reloaded:', newRooms)
          break
        }
      }
      
      if (!receipt) {
        setError('⚠️ Transaction pending... Please refresh page to check status.')
      }
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      console.error('[Admin] Unexpected error:', err)
      setError(`❌ Error: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load rooms from contract using wagmi (no direct RPC calls, no CORS issues)
  const loadRooms = async () => {
    if (roomCount === 0) {
      console.log('[Admin] No rooms yet')
      setRooms([])
      return
    }

    try {
      const loadedRooms: Room[] = []

      for (let i = 1; i <= roomCount; i++) {
        // This useGetRoom hook would normally work inside component but we're in a callback
        // Instead, we'll use the Web3 instance already setup to call via MetaMask provider
        const web3 = new Web3((window as any).ethereum)
        const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS as string)
        
        try {
          const room = await (contract.methods.rooms(i) as any).call()
          // Room can be returned as either object or tuple depending on Web3.js version
          const roomName = typeof room.name === 'string' ? room.name : room[0]
          const roomIP = typeof room.espIP === 'string' ? room.espIP : room[1]
          
          loadedRooms.push({
            id: i,
            name: roomName,
            ip: roomIP,
          })
        } catch (roomErr) {
          console.warn(`Failed to load room ${i}:`, roomErr)
        }
      }

      setRooms(loadedRooms)
      console.log('[Admin] Loaded rooms:', loadedRooms)
    } catch (err: any) {
      console.error('[Admin] Failed to load rooms:', err.message || err)
      setError(`Failed to load rooms: ${err.message || 'Unknown error'}`)
    }
  }

  // Load rooms when roomCount changes
  useEffect(() => {
    if (roomCount > 0) {
      loadRooms()
    } else if (roomCount === 0) {
      setRooms([])
    }
  }, [roomCount])

  const handleRevokeAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to revoke admin access?')) return

    try {
      setAdmins((prev) => prev.filter((a) => a.id !== adminId))
      setSuccess('Admin access revoked')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Failed to revoke admin access')
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />
      <AdminDebug />

      <div className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <Shield className="text-purple-600 w-8 h-8" />
              Admin Panel
            </h1>
            
            <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'rooms'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Rooms & Devices
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                User Management
              </button>
              <button
                onClick={() => setActiveTab('hardware')}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'hardware'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Hardware Provisioning
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'system'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                System Info
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-emerald-700">{success}</p>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="space-y-8">
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Room
                  </h2>
                </CardHeader>
                <CardBody className="p-6">
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Room Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Living Room"
                          value={roomForm.name}
                          onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                          maxLength={50}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {roomForm.name.length}/50 characters
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          ESP32 IP Address or Hostname
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 192.168.1.100 or esp32-room.local"
                          value={roomForm.ip}
                          onChange={(e) => setRoomForm({ ...roomForm, ip: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            roomForm.ip && !isValidIPv4(roomForm.ip) && !isValidHostname(roomForm.ip)
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {roomForm.ip ? (
                            isValidIPv4(roomForm.ip) || isValidHostname(roomForm.ip) ? (
                              <span className="text-green-600">✅ Valid ESP32 address</span>
                            ) : (
                              <span className="text-red-600">❌ Invalid format</span>
                            )
                          ) : (
                            'IPv4 (192.168.x.x) or hostname (esp32-room.local)'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                      <p className="font-medium mb-1">💡 How to find your ESP32 address:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Check your WiFi router for connected devices</li>
                        <li>Look at ESP32 serial output for IP address</li>
                        <li>Use mDNS hostname like <code className="bg-blue-100 px-1 rounded">esp32-livingroom.local</code></li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !isConnected || !roomForm.name || !roomForm.ip || (!isValidIPv4(roomForm.ip) && !isValidHostname(roomForm.ip))}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        isLoading || !isConnected || !roomForm.name || !roomForm.ip || (!isValidIPv4(roomForm.ip) && !isValidHostname(roomForm.ip))
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isLoading ? 'Creating...' : 'Create Room'}
                    </button>
                  </form>
                </CardBody>
              </Card>

              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Define Device in Room
                  </h2>
                </CardHeader>
                <CardBody className="p-6">
                  <form onSubmit={handleDefineDevice} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Select Room
                        </label>
                        <select
                          value={deviceForm.roomId}
                          onChange={(e) => setDeviceForm({ ...deviceForm, roomId: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {rooms.length === 0 ? (
                            <option>No rooms created yet</option>
                          ) : (
                            rooms.map((room) => (
                              <option key={room.id} value={room.id}>
                                {room.name} (ID: {room.id})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Device Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Ceiling Light"
                          value={deviceForm.name}
                          onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Device Type
                        </label>
                        <select
                          value={deviceForm.type}
                          onChange={(e) => setDeviceForm({ ...deviceForm, type: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {Object.entries(DEVICE_TYPES).map(([name, type]) => (
                            <option key={type} value={type}>
                              {name}: {DEVICE_TYPE_NAMES[type]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* GPIO Pin Inputs - Conditional based on device type */}
                      {(deviceForm.type === DEVICE_TYPES.ON_OFF || deviceForm.type === DEVICE_TYPES.DIMMER) && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            GPIO Pin (e.g., 33 for SW1, 18 for SW2)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="40"
                            value={deviceForm.pin}
                            onChange={(e) => setDeviceForm({ ...deviceForm, pin: Number(e.target.value) })}
                            placeholder="e.g., 33"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <p className="text-xs text-slate-500 mt-1">PIN_SW1=33, PIN_SW2=18</p>
                        </div>
                      )}

                      {deviceForm.type === DEVICE_TYPES.FAN && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-slate-700">Fan Speed Pins</p>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Slow Speed Pin (e.g., 25)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={deviceForm.pinSlow || 0}
                              onChange={(e) => setDeviceForm({ ...deviceForm, pinSlow: Number(e.target.value) })}
                              placeholder="25"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-slate-500 mt-0.5">RELAY_FAN_S1=25</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Medium Speed Pin (e.g., 26)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={deviceForm.pinMedium || 0}
                              onChange={(e) => setDeviceForm({ ...deviceForm, pinMedium: Number(e.target.value) })}
                              placeholder="26"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-slate-500 mt-0.5">RELAY_FAN_S2=26</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Fast Speed Pin (e.g., 32)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={deviceForm.pinFast || 0}
                              onChange={(e) => setDeviceForm({ ...deviceForm, pinFast: Number(e.target.value) })}
                              placeholder="32"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-slate-500 mt-0.5">RELAY_FAN_S3=32</p>
                          </div>
                        </div>
                      )}

                      {deviceForm.type === DEVICE_TYPES.RGB && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-slate-700">RGB LED Pins</p>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                            💡 RGB requires 4 pins: 3 for color control (R/G/B) + 1 relay pin for on/off (ground control)
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Red Pin (e.g., 27)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={deviceForm.pinRed || 0}
                              onChange={(e) => setDeviceForm({ ...deviceForm, pinRed: Number(e.target.value) })}
                              placeholder="27"
                              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              required
                            />
                            <p className="text-xs text-slate-500 mt-0.5">PIN_RED=27</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Green Pin (e.g., 14)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={deviceForm.pinGreen || 0}
                              onChange={(e) => setDeviceForm({ ...deviceForm, pinGreen: Number(e.target.value) })}
                              placeholder="14"
                              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              required
                            />
                            <p className="text-xs text-slate-500 mt-0.5">PIN_GREEN=14</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Blue Pin (e.g., 12)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={deviceForm.pinBlue || 0}
                              onChange={(e) => setDeviceForm({ ...deviceForm, pinBlue: Number(e.target.value) })}
                              placeholder="12"
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                            <p className="text-xs text-slate-500 mt-0.5">PIN_BLUE=12</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Relay Pin (e.g., 4) - Controls RGB ground (on/off)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={deviceForm.pinRelay || 0}
                              onChange={(e) => setDeviceForm({ ...deviceForm, pinRelay: Number(e.target.value) })}
                              placeholder="4"
                              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              required
                            />
                            <p className="text-xs text-slate-500 mt-0.5">PIN_RELAY=4 (relay for on/off control via ground)</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !isConnected || rooms.length === 0}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        isLoading || !isConnected || rooms.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isLoading ? 'Defining...' : 'Define Device'}
                    </button>
                  </form>
                </CardBody>
              </Card>

              {rooms.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Provisioned Rooms</h2>
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <Card key={room.id}>
                        <CardBody className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Home className="text-blue-600 w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">{room.name}</h3>
                              <p className="text-sm text-slate-600">ESP32 IP: {room.ip}</p>
                              <p className="text-xs text-slate-500 mt-1">Room ID: {room.id}</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardBody className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Shield className="text-purple-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Total Admins</p>
                        <p className="text-2xl font-bold text-slate-900">{admins.length}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="text-blue-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Active</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {admins.filter((a) => a.status === 'active').length}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Lock className="text-orange-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Super Admins</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {admins.filter((a) => a.role === 'SUPER_ADMIN').length}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Administrator Accounts</h2>
                <div className="space-y-4">
                  {admins.length === 0 ? (
                    <Card>
                      <CardBody className="text-center py-12">
                        <Shield className="mx-auto text-slate-300 mb-3 w-10 h-10" />
                        <p className="text-slate-600">No admin accounts</p>
                      </CardBody>
                    </Card>
                  ) : (
                    admins.map((admin) => (
                      <Card key={admin.id} className="overflow-hidden">
                        <div className="p-6 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Shield className="text-slate-600 w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-mono text-sm font-semibold text-slate-900">
                                    {formatAddress(admin.address)}
                                  </p>
                                  <Badge variant={admin.status === 'active' ? 'success' : 'danger'}>
                                    {admin.status === 'active' ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <Badge>{admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</Badge>
                                </div>
                                <p className="text-xs text-slate-600 mt-2">
                                  Added on {formatDate(admin.addedAt)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-xs text-slate-600 font-semibold mb-2">Permissions:</p>
                              <div className="flex flex-wrap gap-2">
                                {admin.permissions.map((perm) => (
                                  <span
                                    key={perm}
                                    className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"
                                  >
                                    {perm.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRevokeAdmin(admin.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700 transition-colors flex-shrink-0"
                            title="Revoke admin access"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && <HardwareProvisioning />}

          {activeTab === 'system' && (
            <Card>
              <CardBody className="space-y-4 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Contract Address</p>
                    <p className="text-sm font-mono text-slate-900 mt-1">
                      {CONTRACT_ADDRESS || '0x...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Network</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">Anvil (Local BSC Fork)</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">RPC Endpoint</p>
                    <p className="text-sm font-mono text-slate-900 mt-1">https://racheal-uninvoked-jeneva.ngrok-free.dev</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Chain ID</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">31337</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
