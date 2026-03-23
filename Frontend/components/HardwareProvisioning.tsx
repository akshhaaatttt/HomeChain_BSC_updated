'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody, Badge, Button } from '@/components/UI'
import { Plus, Trash2, Settings } from 'lucide-react'

interface DetectedNode {
  mac: string
  ip: string
  name: string
  lastSeen: number
}

interface GPIOMapping {
  deviceType: string
  pins: number[]
  description: string
}

interface HardwareMapping {
  roomId: number
  nodeMAC: string
  nodeIP: string
  devices: {
    fan: GPIOMapping
    bulb: GPIOMapping
    plug: GPIOMapping
    rgb: GPIOMapping
  }
}

/**
 * HardwareProvisioning Component
 * Allows Super Admins to discover ESP32 nodes and map GPIO pins to logical devices
 * Maintains the "Webasthetic Light Minimalist" design theme
 */
export default function HardwareProvisioning() {
  const [detectedNodes, setDetectedNodes] = useState<DetectedNode[]>([
    {
      mac: '30:AE:A4:12:AB:CD',
      ip: '192.168.1.50',
      name: 'Living Room Node',
      lastSeen: Date.now(),
    },
    {
      mac: '30:AE:A4:12:XY:ZW',
      ip: '192.168.1.51',
      name: 'Bedroom Node',
      lastSeen: Date.now() - 5000,
    },
  ])

  const [mappings, setMappings] = useState<HardwareMapping[]>([
    {
      roomId: 1,
      nodeMAC: '30:AE:A4:12:AB:CD',
      nodeIP: '192.168.1.50',
      devices: {
        fan: { deviceType: 'Fan', pins: [25, 26, 32], description: 'Relay bank for 3-speed fan' },
        bulb: { deviceType: 'Bulb', pins: [33], description: 'Main light' },
        plug: { deviceType: 'Smart Plug', pins: [18], description: 'Generic outlet' },
        rgb: { deviceType: 'RGB Strip', pins: [27, 14, 12, 5], description: 'RGB PWM control' },
      },
    },
  ])

  const [selectedNode, setSelectedNode] = useState<DetectedNode | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<number | null>(null)

  const handleMapNode = (node: DetectedNode) => {
    setSelectedNode(node)
    setShowModal(true)
  }

  const handleSaveMapping = (roomId: number) => {
    // Validate and save mapping
    console.log('Mapping saved for room:', roomId)
    setShowModal(false)
    setSelectedNode(null)
  }

  return (
    <div className="space-y-6">
      {/* Detected Nodes Section */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">📡 Detected Hardware Nodes</h2>
          <p className="text-sm text-slate-600">ESP32 devices discovered via mDNS</p>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">MAC Address</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">IP Address</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {detectedNodes.map((node) => {
                  const isOnline = Date.now() - node.lastSeen < 30000 // 30 seconds
                  return (
                    <tr key={node.mac} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{node.mac}</td>
                      <td className="py-3 px-4 text-slate-700">{node.ip}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{node.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant={isOnline ? 'success' : 'danger'}>
                          {isOnline ? '🟢 Online' : '🔴 Offline'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleMapNode(node)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Map Pins →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* GPIO Mappings Section */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">⚙️ GPIO Pin Mappings</h2>
          <p className="text-sm text-slate-600">Current device-to-pin assignments by room</p>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {mappings.map((mapping) => (
              <div key={mapping.roomId} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">Room {mapping.roomId}</h3>
                    <p className="text-sm text-slate-600">
                      {mapping.nodeIP} ({mapping.nodeMAC})
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingRoom(editingRoom === mapping.roomId ? null : mapping.roomId)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-600" />
                  </button>
                </div>

                {/* Device Pin Assignments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(mapping.devices).map(([key, device]) => (
                    <div
                      key={key}
                      className="bg-slate-50 border border-slate-200 rounded p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{device.deviceType}</h4>
                        <code className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-700">
                          ID: {key === 'fan' ? 1 : key === 'bulb' ? 2 : key === 'plug' ? 3 : 4}
                        </code>
                      </div>

                      <p className="text-sm text-slate-600 mb-2">{device.description}</p>

                      <div className="bg-white border border-slate-200 rounded p-2">
                        <p className="text-xs font-semibold text-slate-600 mb-1">GPIO Pins:</p>
                        <div className="flex flex-wrap gap-2">
                          {device.pins.map((pin) => (
                            <span
                              key={pin}
                              className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-mono font-semibold"
                            >
                              {pin}
                            </span>
                          ))}
                        </div>
                      </div>

                      {editingRoom === mapping.roomId && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <input
                            type="text"
                            placeholder={device.pins.join(', ')}
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {editingRoom === mapping.roomId && (
                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingRoom(null)}
                      className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveMapping(mapping.roomId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      ✓ Save Mapping
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Pin Reference Guide */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">📋 Device Pin Reference</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Device 1: Fan (0-3 Speed)</h4>
              <p className="text-sm text-blue-800 mb-2">
                Controls a 3-speed fan via relay bank. Values: 0=Off, 1=Low, 2=Med, 3=High
              </p>
              <code className="text-xs bg-white border border-blue-200 px-2 py-1 rounded block font-mono text-blue-700">
                GPIO: 25, 26, 32
              </code>
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h4 className="font-semibold text-green-900 mb-2">Device 2: Bulb (0-1)</h4>
              <p className="text-sm text-green-800 mb-2">
                Main light control. Values: 0=Off, 1=On
              </p>
              <code className="text-xs bg-white border border-green-200 px-2 py-1 rounded block font-mono text-green-700">
                GPIO: 33
              </code>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Device 3: Smart Plug (0-1)</h4>
              <p className="text-sm text-yellow-800 mb-2">
                Generic outlet control. Values: 0=Off, 1=On
              </p>
              <code className="text-xs bg-white border border-yellow-200 px-2 py-1 rounded block font-mono text-yellow-700">
                GPIO: 18
              </code>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Device 4: RGB Strip (0-4)</h4>
              <p className="text-sm text-purple-800 mb-2">
                RGB LED strip. Values: 0=Off, 1=Red, 2=Green, 3=Blue, 4=White (PWM)
              </p>
              <code className="text-xs bg-white border border-purple-200 px-2 py-1 rounded block font-mono text-purple-700">
                GPIO: 27, 14, 12, 5
              </code>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
