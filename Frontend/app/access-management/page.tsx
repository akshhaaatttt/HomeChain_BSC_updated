'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Users, Lock, ShieldAlert, Calendar } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Card, CardHeader, CardBody, CardFooter, Badge, Button, Input, Select } from '@/components/UI'
import { useUserRoles } from '@/hooks/useUserRoles'
import { useContractRooms } from '@/hooks/useContractRooms'
import { ROLE_PERMISSIONS, ROLE_LABELS } from '@/lib/deviceConstants'

interface AccessGrant {
  id: string
  address: string
  status: 'active' | 'expired' | 'pending'
  room: string
  role: 'GUEST' | 'ROOM_ADMIN'
  startTime: string
  endTime: string
}

interface FormData {
  address: string
  room: string
  role: 'GUEST' | 'ROOM_ADMIN'
  startTime: string
  endTime: string
  permanentAccess: boolean // NEW: Allow unlimited access
}

const ROOMS = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Office']

export default function AccessManagementPage() {
  const [grants, setGrants] = useState<AccessGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // NEW: Check user permissions before showing UI
  const userRoles = useUserRoles()
  const { rooms: contractRooms } = useContractRooms()

  // NEW: Fallback to contract rooms if available, otherwise use static list
  const availableRooms = contractRooms.length > 0
    ? contractRooms.map((r) => r.name)
    : ROOMS

  const [formData, setFormData] = useState<FormData>({
    address: '',
    room: availableRooms[0] || ROOMS[0],
    role: 'GUEST',
    startTime: '',
    endTime: '',
    permanentAccess: false, // NEW
  })

  // Load access grants
  useEffect(() => {
    const loadGrants = async () => {
      try {
        setLoading(true)
        setError('')

        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/access/grants')
        // const data = await response.json()
        // setGrants(data)

        // Initialize with empty state - no mock data
        setGrants([])
        setLoading(false)
      } catch (err) {
        console.error('Failed to load grants:', err)
        setError('Failed to load access grants. Please try again.')
        setLoading(false)
      }
    }

    loadGrants()
  }, [])

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Validate Ethereum address
  const validateAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr)
  }

  // Handle grant access
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // NEW: Check if user has permission to grant access
    if (!userRoles.canGrantAccess) {
      setError('You do not have permission to grant access. Only Room Admins and Super Admins can grant access.')
      return
    }

    // Validate address
    if (!formData.address.trim()) {
      setError('Wallet address is required')
      return
    }

    if (!validateAddress(formData.address)) {
      setError(
        'Invalid Ethereum address format (must be 0x followed by 40 hex characters)'
      )
      return
    }

    // NEW: Validate room exists
    const roomExists = availableRooms.includes(formData.room)
    if (!roomExists && contractRooms.length > 0) {
      setError('Selected room does not exist. Please choose a valid room.')
      return
    }

    // NEW: Only validate times for GUEST role
    if (formData.role === 'GUEST' && !formData.permanentAccess) {
      const startTime = new Date(formData.startTime).getTime()
      const endTime = new Date(formData.endTime).getTime()

      if (!formData.startTime) {
        setError('Start time is required for guest access')
        return
      }

      if (!formData.endTime) {
        setError('End time is required for guest access')
        return
      }

      if (endTime <= startTime) {
        setError('End time must be after start time')
        return
      }
    }

    // ROOM_ADMIN: Time fields are ignored, no validation needed
    if (formData.role === 'ROOM_ADMIN') {
      // Room admins bypass time restrictions
    }

    try {
      // TODO: Call API to grant access
      // const response = await fetch('/api/access/grant', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // })

      const newGrant: AccessGrant = {
        id: Date.now().toString(),
        address: formData.address,
        status: 'pending',
        room: formData.room,
        role: formData.role,
        startTime: formData.permanentAccess ? '0' : formData.startTime,
        endTime: formData.permanentAccess ? '0' : formData.endTime,
      }
      setGrants((prev) => [newGrant, ...prev])
      setSuccess('Access granted successfully')
      setFormData({
        address: '',
        room: availableRooms[0] || ROOMS[0],
        role: 'GUEST',
        startTime: '',
        endTime: '',
        permanentAccess: false,
      })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to grant access')
    }
  }

  // Handle revoke access
  const handleRevokeGrant = async (grantId: string) => {
    if (
      !confirm(
        'Are you sure you want to revoke this access? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      // TODO: Call API to revoke access
      // await fetch(`/api/access/revoke/${grantId}`, { method: 'POST' })

      setGrants((prev) => prev.filter((g) => g.id !== grantId))
      setSuccess('Access revoked successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to revoke access')
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (dateString === '0') return 'Permanent'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // NEW: Check if guest access is currently active
  const isAccessActive = (startTime: string, endTime: string) => {
    if (startTime === '0' || endTime === '0') return true // Permanent access is always active
    const now = Date.now()
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    return now >= start && now <= end
  }

  // NEW: Check if guest access has expired
  const isAccessExpired = (endTime: string) => {
    if (endTime === '0') return false // Permanent access never expires
    const now = Date.now()
    const end = new Date(endTime).getTime()
    return now > end
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/4"></div>
            <div className="h-40 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* NEW: Permission Check - Show if user doesn't have access */}
          {!userRoles.loading && !userRoles.canGrantAccess && (
            <Card className="border-l-4 border-orange-500 bg-orange-50">
              <CardBody className="p-6 flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">Access Denied</p>
                  <p className="text-sm text-orange-800 mt-1">
                    Only Room Admins and Super Admins can grant access to other users.
                    Your current role: <strong>{ROLE_LABELS[userRoles.role as keyof typeof ROLE_LABELS] || 'None'}</strong>
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
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
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Access Management
            </h1>
            <p className="text-slate-600">
              Manage user access and permissions for your smart home
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="text-blue-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Total Grants</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {grants.length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Calendar className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Active</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {grants.filter((g) => g.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <ShieldAlert className="text-orange-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {grants.filter((g) => g.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Grant Access Form - Only show if user has permission */}
          {userRoles.canGrantAccess && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Grant Access
                </h2>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleGrantAccess} className="space-y-6">
                  <Input
                    label="Wallet Address"
                    placeholder="0x742d35Cc6634C0532925a3b844Bc7e7a6f8e3c0b"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />

                  <Select
                    label="Room"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    options={availableRooms.map((room) => ({
                      value: room,
                      label: room,
                    }))}
                  />

                  <Select
                    label="Role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    options={[
                      {
                        value: 'GUEST',
                        label: 'Guest (Time-Limited Access)',
                      },
                      {
                        value: 'ROOM_ADMIN',
                        label: 'Room Admin (Unlimited Access)',
                      },
                    ]}
                  />

                  {/* NEW: Conditional time fields - Only for GUEST role */}
                  {formData.role === 'GUEST' && (
                    <>
                      {/* NEW: Permanent Access Toggle for Guests */}
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <input
                          type="checkbox"
                          id="permanentAccess"
                          checked={formData.permanentAccess}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              permanentAccess: e.target.checked,
                            }))
                          }}
                          className="w-4 h-4"
                        />
                        <label
                          htmlFor="permanentAccess"
                          className="text-sm font-medium text-slate-700 cursor-pointer flex-1"
                        >
                          Permanent Access
                        </label>
                        <span className="text-xs text-slate-600">
                          Grant unlimited access without time restrictions
                        </span>
                      </div>

                      {/* Time fields - Only if NOT permanent access */}
                      {!formData.permanentAccess && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Start Time"
                            type="datetime-local"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleInputChange}
                            required
                          />

                          <Input
                            label="End Time"
                            type="datetime-local"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Info for ROOM_ADMIN */}
                  {formData.role === 'ROOM_ADMIN' && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800">
                      <strong>Room Admins</strong> have unlimited access and bypass time restrictions.
                      They can also grant access to other users.
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Grant Access
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}

          {/* Access Grants List */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Active Grants
            </h2>

            {grants.length === 0 ? (
              // Empty state
              <Card>
                <CardBody className="p-12 text-center">
                  <Lock className="mx-auto text-slate-300 mb-4 w-12 h-12" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No access grants yet
                  </h3>
                  <p className="text-slate-600">
                    Grant access to other users to control your smart home devices
                  </p>
                </CardBody>
              </Card>
            ) : (
              // Grants list
              <div className="space-y-4">
                {grants.map((grant) => (
                  <Card
                    key={grant.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardBody className="p-6 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap gap-y-2">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Users className="text-slate-600 w-5 h-5" />
                          </div>
                          <p className="font-mono text-sm font-semibold text-slate-900">
                            {formatAddress(grant.address)}
                          </p>
                          <Badge
                            variant={
                              grant.status === 'active'
                                ? 'success'
                                : grant.status === 'pending'
                                  ? 'default'
                                  : 'danger'
                            }
                          >
                            {grant.status.charAt(0).toUpperCase() +
                              grant.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="text-sm text-slate-600">
                          <p className="mb-1">
                            {grant.room} •{' '}
                            {grant.role === 'GUEST'
                              ? 'Guest (Time-Limited)'
                              : 'Room Admin (Unlimited)'}
                          </p>
                          {/* NEW: Show time validity for guest access */}
                          {grant.role === 'GUEST' && grant.startTime !== '0' && grant.endTime !== '0' ? (
                            <p className="text-xs text-slate-500">
                              {formatDate(grant.startTime)} →{' '}
                              {formatDate(grant.endTime)}
                              {isAccessExpired(grant.endTime) && (
                                <span className="ml-2 text-red-600 font-semibold">
                                  (Expired)
                                </span>
                              )}
                              {isAccessActive(grant.startTime, grant.endTime) && (
                                <span className="ml-2 text-green-600 font-semibold">
                                  (Active)
                                </span>
                              )}
                            </p>
                          ) : grant.role === 'GUEST' ? (
                            <p className="text-xs text-green-600 font-semibold">
                              Permanent Access
                            </p>
                          ) : (
                            <p className="text-xs text-green-600 font-semibold">
                              Unlimited Access
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeGrant(grant.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700 transition-colors flex-shrink-0"
                        title="Revoke access"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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
