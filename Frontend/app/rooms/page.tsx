'use client'

import { useState, useEffect } from 'react'
import { Plus, Home, ShieldAlert } from 'lucide-react'
import Navigation from '@/components/Navigation'
import AdminDebug from '@/components/AdminDebug'
import { Card, CardHeader, CardBody, CardFooter, Badge, Button, Input } from '@/components/UI'
import { useAccount } from 'wagmi'
import { useRoomCount } from '@/hooks/useContractRead'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/constants'
import { formatESPAddress, isValidESPAddress, validateRoomConfig } from '@/lib/espUtils'
import Web3 from 'web3'

interface Room {
  id: number
  name: string
  description: string
  isOnline: boolean
  deviceCount: number
  espIP?: string
  devices?: Device[]
}

interface Device {
  id: number
  name: string
  pinNo: number | bigint
  dType: number
  value: number | bigint
  exists: boolean
}

interface FormData {
  name: string
  description: string
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loadingDevices, setLoadingDevices] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { roomCount } = useRoomCount()
  const { address, isConnected } = useAccount()

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
  })

  // Load rooms from contract
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true)
        setError('')

        if (roomCount === 0) {
          setRooms([])
          setLoading(false)
          return
        }

        // Load all rooms from contract
        const web3 = new Web3((window as any).ethereum)
        const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS as string)
        const loadedRooms: Room[] = []

        for (let i = 1; i <= roomCount; i++) {
          try {
            const room = await (contract.methods.rooms(i) as any).call()
            const roomName = typeof room.name === 'string' ? room.name : room[0]
            const roomIP = typeof room.espIP === 'string' ? room.espIP : room[1]
            const deviceCount = typeof room.deviceCount === 'bigint' ? Number(room.deviceCount) : Number(room[2])

            loadedRooms.push({
              id: i,
              name: roomName,
              description: `Device IP: ${roomIP}`,
              isOnline: true,
              deviceCount: deviceCount,
              espIP: roomIP,
            })
          } catch (roomErr) {
            console.warn(`Failed to load room ${i}:`, roomErr)
          }
        }

        setRooms(loadedRooms)
        console.log('[Rooms] Loaded from contract:', loadedRooms)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load rooms:', err)
        setError('Failed to load rooms. Please try again.')
        setLoading(false)
      }
    }

    if (roomCount > 0) {
      loadRooms()
    } else if (roomCount === 0) {
      setRooms([])
      setLoading(false)
    }
  }, [roomCount])

  // Load devices for a specific room
  const loadDevicesForRoom = async (room: Room) => {
    if (room.deviceCount === 0 || loadingDevices.has(room.id)) return

    setLoadingDevices((prev) => new Set(prev).add(room.id))

    try {
      const web3 = new Web3((window as any).ethereum)
      const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS as string)
      const devices: Device[] = []

      for (let i = 1; i <= room.deviceCount; i++) {
        try {
          // Access the nested mapping: rooms[roomId].devices[deviceId]
          // In web3.js, we need to call the internal mapping properly
          const roomData = await (contract.methods.getDeviceStatus(room.id, i) as any).call()
          
          // getDeviceStatus returns (value) based on contract
          devices.push({
            id: i,
            name: `Device ${i}`,
            pinNo: 0,
            dType: 0,
            value: roomData,
            exists: true,
          })
        } catch (err) {
          console.warn(`Failed to load device ${i} of room ${room.id}:`, err)
        }
      }

      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id ? { ...r, devices } : r
        )
      )
      console.log(`[Rooms] Loaded ${devices.length} devices for room ${room.id}`)
    } catch (err) {
      console.error(`Failed to load devices for room ${room.id}:`, err)
    } finally {
      setLoadingDevices((prev) => {
        const newSet = new Set(prev)
        newSet.delete(room.id)
        return newSet
      })
    }
  }

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle form submission - CREATE ROOM ON BLOCKCHAIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim()) {
      setError('Room name is required')
      return
    }

    if (!formData.description.trim()) {
      setError('ESP32 IP address is required')
      return
    }

    // Validate room configuration
    const validation = validateRoomConfig(formData.name, formData.description)
    if (!validation.valid) {
      setError(`❌ ${validation.errors[0] || 'Invalid configuration'}`)
      return
    }

    // Verify wallet connection
    if (!isConnected || !address) {
      setError('❌ Please connect your wallet first')
      return
    }

    // Cannot edit existing rooms - only create new ones on-chain
    if (editingId) {
      setError('❌ Editing rooms is not supported. Only room creation is blockchain-based.')
      return
    }

    try {
      setIsSubmitting(true)

      // Verify MetaMask provider exists
      if (!(window as any).ethereum) {
        setError('❌ MetaMask not found. Please install MetaMask.')
        return
      }

      const web3 = new Web3((window as any).ethereum)
      const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS as string)

      console.log('[Rooms] Creating room on-chain:', { name: formData.name, ip: formData.description, from: address })

      const espIP = formData.description

      // Encode function call
      const data = (contract.methods.createRoom(formData.name, espIP) as any).encodeABI()
      
      // Estimate gas
      let gasEstimate
      try {
        gasEstimate = await web3.eth.estimateGas({
          from: address,
          to: CONTRACT_ADDRESS,
          data: data
        })
        console.log('[Rooms] Gas estimate:', gasEstimate.toString())
      } catch (gasErr: any) {
        console.error('[Rooms] Gas estimation failed:', gasErr.message)
        setError(`❌ Gas estimation failed: ${gasErr.message}`)
        setIsSubmitting(false)
        return
      }
      
      // Send transaction via MetaMask
      let txHash
      try {
        console.log('[Rooms] Sending transaction to MetaMask...')
        txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: CONTRACT_ADDRESS,
            data: data,
            gas: web3.utils.toHex(Math.ceil(Number(gasEstimate) * 1.2))
          }]
        })
        console.log('[Rooms] MetaMask accepted transaction:', txHash)
      } catch (txErr: any) {
        console.error('[Rooms] MetaMask transaction error:', txErr)
        if (txErr.code === 4001) {
          setError('❌ Transaction rejected by user')
        } else {
          setError(`❌ MetaMask error: ${txErr.message}`)
        }
        setIsSubmitting(false)
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
          console.log('[Rooms] ✅ Room created in block:', receipt.blockNumber)
          setSuccess(`✅ Room "${formData.name}" confirmed on-chain!`)
          setFormData({ name: '', description: '' })
          setShowForm(false)
          setEditingId(null)
          
          // Force reload by querying contract directly
          console.log('[Rooms] Reloading rooms from contract...')
          const newRoomCount = await (contract.methods.roomCount() as any).call()
          console.log('[Rooms] New roomCount from contract:', newRoomCount.toString())
          
          // Directly load and display all rooms
          const newRooms: Room[] = []
          for (let i = 1; i <= Number(newRoomCount); i++) {
            const room = await (contract.methods.rooms(i) as any).call()
            newRooms.push({
              id: i,
              name: typeof room.name === 'string' ? room.name : room[0],
              description: '',
              espIP: typeof room.espIP === 'string' ? room.espIP : room[1],
              isOnline: true,
              deviceCount: typeof room.deviceCount === 'bigint' ? Number(room.deviceCount) : Number(room[2]),
            })
          }
          setRooms(newRooms)
          console.log('[Rooms] Rooms reloaded:', newRooms)
          break
        }
      }
      
      if (!receipt) {
        setError('⚠️ Transaction pending... Please refresh page to check status.')
      }
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      console.error('[Rooms] Unexpected error:', err)
      setError(`❌ Error: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit - NOT SUPPORTED (rooms are immutable on blockchain)
  const handleEdit = (room: Room) => {
    setError('❌ Cannot edit rooms. They are immutable on the blockchain.')
  }

  // Handle delete - NOT SUPPORTED (rooms are immutable on blockchain)
  const handleDelete = async (roomId: number) => {
    setError('❌ Cannot delete rooms. They are permanently stored on the blockchain.')
  }

  // Cancel form
  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '' })
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-slate-200 rounded"></div>
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
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-700 text-lg flex-shrink-0"
                >
                  ×
                </button>
              </CardBody>
            </Card>
          )}

          {/* Success Alert */}
          {success && (
            <Card className="border-l-4 border-green-500 bg-green-50">
              <CardBody className="p-4 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-600 flex-shrink-0 mt-0.5"></div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess('')}
                  className="text-green-600 hover:text-green-700 text-lg flex-shrink-0"
                >
                  ×
                </button>
              </CardBody>
            </Card>
          )}

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Room Management</h1>
              <p className="text-slate-600">Organize and configure your home rooms</p>
            </div>
            {!showForm && (
              <Button
                onClick={() => {
                  setShowForm(true)
                  setEditingId(null)
                  setFormData({ name: '', description: '' })
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                New Room
              </Button>
            )}
          </div>

          {/* Create/Edit Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingId ? 'Edit Room' : 'Create New Room'}
                </h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <Input
                  label="Room Name"
                  placeholder="e.g. Living Room, Bedroom, Kitchen"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ESP32 IP Address
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="e.g. 192.168.1.100 or esp32-room.local"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">IPv4 address or mDNS hostname</p>
                </div>
              </CardBody>
              <CardFooter className="flex gap-2 justify-end border-t border-slate-200 pt-4">
                <Button
                  onClick={handleCancel}
                  className="bg-slate-200 text-slate-900 hover:bg-slate-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isConnected}
                  className={`${
                    isSubmitting || !isConnected
                      ? 'bg-slate-400 text-slate-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Creating on-chain...' : editingId ? 'Update Room' : 'Create Room'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Rooms List */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Rooms</h2>

            {rooms.length === 0 ? (
              // Empty state
              <Card>
                <CardBody className="p-12 text-center">
                  <Home className="mx-auto text-slate-300 mb-4 w-12 h-12" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No rooms yet
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Create your first room to start organizing your smart home devices
                  </p>
                  <Button
                    onClick={() => {
                      setShowForm(true)
                      setEditingId(null)
                      setFormData({ name: '', description: '' })
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Room
                  </Button>
                </CardBody>
              </Card>
            ) : (
              // Rooms grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <Card
                    key={room.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardBody className="p-6 space-y-4">
                      {/* Room Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {room.name}
                          </h3>
                          {room.espIP && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-blue-600">🔗</span>
                              <p className="text-sm text-blue-700 font-mono">
                                {room.espIP}
                              </p>
                            </div>
                          )}
                        </div>
                        <Badge variant={room.isOnline ? 'success' : 'danger'}>
                          {room.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>

                      {/* Device Count */}
                      <div className="py-3 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">
                            {room.deviceCount}
                          </span>{' '}
                          device{room.deviceCount !== 1 ? 's' : ''} available
                        </p>
                      </div>

                      {/* Devices List */}
                      {room.devices && room.devices.length > 0 && (
                        <div className="space-y-2 border-t border-slate-200 pt-3">
                          <p className="text-xs font-semibold text-slate-700 uppercase">Devices</p>
                          {room.devices.map((device) => (
                            <div
                              key={device.id}
                              className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600"
                            >
                              Device {device.id}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                        {room.deviceCount > 0 && !room.devices && (
                          <button
                            onClick={() => loadDevicesForRoom(room)}
                            disabled={loadingDevices.has(room.id)}
                            className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            {loadingDevices.has(room.id) ? 'Loading...' : 'Load Devices'}
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(room)}
                          disabled
                          className="flex-1 px-3 py-2 bg-slate-50 text-slate-400 rounded-lg cursor-not-allowed text-sm font-medium opacity-50"
                          title="Rooms are immutable on blockchain"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
                          disabled
                          className="flex-1 px-3 py-2 bg-slate-50 text-slate-400 rounded-lg cursor-not-allowed text-sm font-medium opacity-50"
                          title="Rooms are immutable on blockchain"
                        >
                          Delete
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
