'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Zap, TrendingUp, ShieldAlert, Home } from 'lucide-react'
import Navigation from '@/components/Navigation'
import AdminDebug from '@/components/AdminDebug'
import { Card, CardHeader, CardBody, Badge, Button } from '@/components/UI'
import DeviceCard from '@/components/DeviceCard'
import { useDeviceControl } from '@/hooks/useDeviceControl'
import { useRoomCount } from '@/hooks/useContractRead'
import { useAccount } from 'wagmi'
import { addHomeChainToMetaMask, switchToHomeChain } from '@/lib/metamask'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/constants'
import { FRONTEND_DEVICE_TYPE_TO_CONTRACT, DEVICE_VALUE_LABELS, DEVICE_MAX_VALUES } from '@/lib/deviceConstants'
import Web3 from 'web3'

interface Device {
  id: string
  name: string
  deviceId: number
  type: 'fan' | 'light' | 'plug' | 'rgb'
  room: string
  roomId: number
  status: number
  maxValue: number
}

interface Room {
  id: string
  name: string
  devices: Device[]
  isOnline: boolean
}

interface Stats {
  activeDevices: number
  totalRooms: number
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<Stats>({
    activeDevices: 0,
    totalRooms: 0,
  })
  const [loading, setLoading] = useState(true)
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { toggleDevice, deviceState } = useDeviceControl()
  const { address, isConnected } = useAccount()
  const { roomCount = 0, isLoading: isLoadingRoomCount } = useRoomCount()

  // Setup MetaMask network on mount
  useEffect(() => {
    if (isConnected && address) {
      switchToHomeChain().catch((err) => {
        console.error('Failed to switch network:', err)
      })
    }
  }, [isConnected, address])

  // Load rooms data from contract
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!roomCount || roomCount === 0) {
          console.log('[Dashboard] No rooms yet')
          setRooms([])
          setStats({ activeDevices: 0, totalRooms: 0 })
          setLoading(false)
          return
        }

        // Load all rooms from contract
        const web3 = new Web3((window as any).ethereum)
        const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS as string)
        const loadedRooms: Room[] = []

        console.log('[Dashboard] ============================================')
        console.log('[Dashboard] Starting device loading process')
        console.log('[Dashboard] CONTRACT_ADDRESS:', CONTRACT_ADDRESS)
        console.log('[Dashboard] Total rooms to load:', roomCount)
        console.log('[Dashboard] ============================================')

        for (let i = 1; i <= roomCount; i++) {
          try {
            const room = await (contract.methods.rooms(i) as any).call()
            const roomName = typeof room.name === 'string' ? room.name : room[0]
            const roomIP = typeof room.espIP === 'string' ? room.espIP : room[1]
            const deviceCount = typeof room.deviceCount === 'bigint' ? Number(room.deviceCount) : Number(room[2])

            console.log(`[Dashboard] Room ${i}: name="${roomName}", IP="${roomIP}", deviceCount=${deviceCount}`)


            // Load devices for this room
            const devices: Device[] = []
            console.log(`[Dashboard] Loading ${deviceCount} devices for room ${i}`)
            
            for (let d = 1; d <= deviceCount; d++) {
              try {
                // === STANDARD ID FALLBACK MAPPING ===
                // Device IDs map to specific device types (ESP32 firmware standard)
                const standardIdMapping: { [key: number]: { type: 'fan' | 'light' | 'plug' | 'rgb'; name: string; maxValue: number } } = {
                  1: { type: 'fan', name: 'Fan', maxValue: 3 },       // Fan with 3 speed levels
                  2: { type: 'light', name: 'Light', maxValue: 100 }, // Dimmer/Brightness
                  3: { type: 'plug', name: 'Plug', maxValue: 1 },     // On/Off switch
                  4: { type: 'rgb', name: 'RGB LED', maxValue: 4 },   // RGB with 5 color modes (0-4)
                }

                let deviceName = standardIdMapping[d]?.name || `Device ${d}`
                let displayType: 'fan' | 'light' | 'plug' | 'rgb' = standardIdMapping[d]?.type || 'plug'
                let maxValue = standardIdMapping[d]?.maxValue || 1
                let deviceValue = 0

                console.log(`[Dashboard] 🎯 Standard ID Mapping: Device ${d} → ${displayType} (${deviceName})`)

                // Try to get device info from contract
                try {
                  const deviceInfo = await (contract.methods.getDeviceInfo(i, d) as any).call()
                  console.log(`[Dashboard] ✅ getDeviceInfo succeeded for device ${d}:`, deviceInfo)
                  
                  // Parse device name if available
                  if (typeof deviceInfo.name === 'string' && deviceInfo.name.length > 0) {
                    deviceName = deviceInfo.name
                  }
                  
                  // Parse device type from contract if available
                  let contractType: number | null = null
                  if (typeof deviceInfo.dType === 'number') {
                    contractType = deviceInfo.dType
                  } else if (typeof deviceInfo.dType === 'bigint') {
                    contractType = Number(deviceInfo.dType)
                  } else if (Array.isArray(deviceInfo) && deviceInfo[2]) {
                    contractType = typeof deviceInfo[2] === 'bigint' ? Number(deviceInfo[2]) : Number(deviceInfo[2])
                  }
                  
                  // If contract has type info, use it to override the standard mapping
                  if (contractType !== null && contractType !== undefined) {
                    console.log(`[Dashboard] Contract type: ${contractType} (${['OnOff', 'Fan', 'Dimmer', 'RGB'][contractType] || 'Unknown'})`)
                    if (contractType === 0) {
                      displayType = 'plug'
                      maxValue = 1
                    } else if (contractType === 1) {
                      displayType = 'fan'
                      maxValue = 3
                    } else if (contractType === 2) {
                      displayType = 'light'
                      maxValue = 100
                    } else if (contractType === 3) {
                      displayType = 'rgb'
                      maxValue = 4
                    }
                  }
                  
                  // Get device value
                  deviceValue = typeof deviceInfo.value === 'bigint' ? Number(deviceInfo.value) : 
                               (typeof deviceInfo.value === 'number' ? deviceInfo.value : Number(deviceInfo[3] || 0))
                } catch (getInfoErr) {
                  console.warn(`[Dashboard] ⚠️ getDeviceInfo failed for device ${d}, using Standard ID Fallback:`, (getInfoErr as any).message)
                  
                  // Fallback: Get device status value only
                  try {
                    const statusValue = await (contract.methods.getDeviceStatus(i, d) as any).call()
                    deviceValue = typeof statusValue === 'bigint' ? Number(statusValue) : Number(statusValue || 0)
                    console.log(`[Dashboard] ⚙️ Fallback getDeviceStatus succeeded: value=${deviceValue}`)
                  } catch (statusErr) {
                    console.error(`[Dashboard] ❌ Both getDeviceInfo and getDeviceStatus failed for device ${d}:`, (statusErr as any).message)
                    deviceValue = 0
                  }
                }

                console.log(`[Dashboard] Device ${d}: name="${deviceName}", displayType="${displayType}", value=${deviceValue}, maxValue=${maxValue}`)

                devices.push({
                  id: `${i}-${d}`,
                  name: deviceName,
                  deviceId: d,
                  type: displayType,
                  room: roomName,
                  roomId: i,
                  status: deviceValue,
                  maxValue: maxValue,
                })
              } catch (deviceErr) {
                console.error(`[Dashboard] ❌ Error processing device ${d} of room ${i}:`, deviceErr)
              }
            }

            loadedRooms.push({
              id: String(i),
              name: roomName,
              devices: devices,
              isOnline: true,
            })
            console.log(`[Dashboard] ✅ Loaded room ${i} "${roomName}" with ${devices.length} devices`)
          } catch (err) {
            console.error(`[Dashboard] ❌ Failed to load room ${i}:`, err)
          }
        }

        setRooms(loadedRooms)
        setStats({
          activeDevices: loadedRooms.reduce((sum, room) => sum + room.devices.length, 0),
          totalRooms: loadedRooms.length,
        })
        console.log('[Dashboard] Loaded all rooms with devices:', loadedRooms)
        setLoading(false)
      } catch (err) {
        console.error('[Dashboard] Failed to load rooms:', err)
        setError('Failed to load rooms. Please try again.')
        setLoading(false)
      }
    }

    if (roomCount && roomCount > 0) {
      loadRooms()
    } else if (!isLoadingRoomCount && roomCount === 0) {
      setRooms([])
      setStats({ activeDevices: 0, totalRooms: 0 })
      setLoading(false)
    }
  }, [roomCount, isLoadingRoomCount])

  // Handle device control
  const handleDeviceControl = (roomId: number, deviceId: number, value: number) => {
    if (!isConnected) {
      setError('❌ Please connect your wallet first')
      return
    }

    console.log(`[Dashboard] Controlling device: room=${roomId}, device=${deviceId}, value=${value}`)
    toggleDevice(roomId, deviceId, value)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <AdminDebug />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Error Alert */}
          {error && (
            <Card className="border-l-4 border-red-500 bg-red-50">
              <CardBody className="p-4 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-700 text-lg"
                >
                  ×
                </button>
              </CardBody>
            </Card>
          )}

          {/* Wallet Connection Alert */}
          {!isConnected && (
            <Card className="border-l-4 border-orange-500 bg-orange-50">
              <CardBody className="p-4 flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">Connect Your Wallet</p>
                  <p className="text-sm text-orange-800 mt-1">
                    Connect MetaMask to control your smart home devices
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      await addHomeChainToMetaMask()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to add network')
                    }
                  }}
                  className="bg-orange-600 text-white hover:bg-orange-700 flex-shrink-0"
                >
                  Connect Wallet
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Transaction Status */}
          {deviceState.hash && (
            <Card className="border-l-4 border-blue-500 bg-blue-50">
              <CardBody className="p-4">
                <p className="font-semibold text-blue-900 mb-1">
                  {deviceState.isConfirming ? 'Transaction Pending...' : 'Transaction Confirmed!'}
                </p>
                <p className="text-sm text-blue-800 font-mono break-all">{deviceState.hash}</p>
              </CardBody>
            </Card>
          )}

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
              <p className="text-slate-600">Monitor and control your smart home devices</p>
            </div>
            <Link href="/rooms">
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                New Room
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Total Rooms</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalRooms}</p>
                  </div>
                  <Home className="text-blue-500 opacity-20 w-10 h-10" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Active Devices</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.activeDevices}</p>
                  </div>
                  <Zap className="text-green-500 opacity-20 w-10 h-10" />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Main Content - Rooms */}
          {!isConnected ? (
            // Empty state when wallet not connected
            <Card>
              <CardBody className="p-12 text-center">
                <Home className="mx-auto text-slate-300 mb-4 w-12 h-12" />
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Wallet Not Connected</h2>
                <p className="text-slate-600 mb-6">
                  Connect your MetaMask wallet to view and control your smart home devices
                </p>
                <Button
                  onClick={async () => {
                    try {
                      await addHomeChainToMetaMask()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to add network')
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Connect Wallet
                </Button>
              </CardBody>
            </Card>
          ) : rooms.length === 0 ? (
            // Empty state when no rooms
            <Card>
              <CardBody className="p-12 text-center">
                <Home className="mx-auto text-slate-300 mb-4 w-12 h-12" />
                <h2 className="text-xl font-semibold text-slate-900 mb-2">No Rooms Yet</h2>
                <p className="text-slate-600 mb-6">
                  Create your first room to start controlling smart home devices
                </p>
                <Link href="/rooms">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Room
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ) : (
            // Rooms list
            <div className="space-y-4">
              {rooms.map((room) => (
                <div key={room.id}>
                  {/* Room Header */}
                  <button
                    onClick={() =>
                      setExpandedRoom(expandedRoom === room.id ? null : room.id)
                    }
                    className="w-full text-left mb-3"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardBody className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              room.isOnline ? 'bg-green-500' : 'bg-slate-300'
                            }`}
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {room.name}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {room.devices.filter((d) => d.status > 0).length}/{room.devices.length} devices active
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={room.isOnline ? 'success' : 'danger'}
                        >
                          {room.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </CardBody>
                    </Card>
                  </button>

                  {/* Devices Grid */}
                  {expandedRoom === room.id && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {room.devices.length === 0 ? (
                        <div className="col-span-full">
                          <Card>
                            <CardBody className="p-8 text-center">
                              <Zap className="mx-auto text-slate-300 mb-3 w-8 h-8" />
                              <p className="text-slate-600">No devices in this room</p>
                            </CardBody>
                          </Card>
                        </div>
                      ) : (
                        room.devices.map((device) => (
                          <DeviceCard
                            key={device.id}
                            id={device.id}
                            name={device.name}
                            roomId={device.roomId}
                            deviceId={device.deviceId}
                            type={device.type === 'plug' ? 'onoff' : device.type === 'light' ? 'dimmer' : device.type}
                            status={device.status}
                            maxValue={device.maxValue}
                            onControl={(roomId, deviceId, value) => {
                              toggleDevice(roomId, deviceId, value)
                            }}
                            isDisabled={deviceState.isConfirming}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 pt-8 border-t border-slate-200">
            <Link href="/rooms">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardBody className="p-6 text-center">
                  <div className="text-4xl mb-3">🏠</div>
                  <h3 className="font-semibold text-slate-900 mb-2">Manage Rooms</h3>
                  <p className="text-sm text-slate-600">
                    Create and configure rooms
                  </p>
                </CardBody>
              </Card>
            </Link>

            <Link href="/access-management">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardBody className="p-6 text-center">
                  <div className="text-4xl mb-3">🔐</div>
                  <h3 className="font-semibold text-slate-900 mb-2">Access Control</h3>
                  <p className="text-sm text-slate-600">Manage user permissions</p>
                </CardBody>
              </Card>
            </Link>

            <Link href="/analytics">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardBody className="p-6 text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="font-semibold text-slate-900 mb-2">Analytics</h3>
                  <p className="text-sm text-slate-600">View usage trends</p>
                </CardBody>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
