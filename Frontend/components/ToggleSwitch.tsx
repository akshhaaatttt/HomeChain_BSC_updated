'use client'

import { useState } from 'react'

interface ToggleSwitchProps {
  deviceId: number
  label: string
}

export default function ToggleSwitch({ deviceId, label }: ToggleSwitchProps) {
  const [isOn, setIsOn] = useState(false)

  const handleToggle = () => {
    const newState = !isOn
    setIsOn(newState)
    // TODO: Call blockchain operateDevice(roomId=1, deviceId, newState ? 1 : 0)
    console.log(`Device ${deviceId}: ${newState ? 'ON' : 'OFF'}`)
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={handleToggle}
        className={`toggle-base ${isOn ? 'toggle-on' : 'toggle-off'}`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`toggle-thumb ${isOn ? 'toggle-thumb-on' : 'toggle-thumb-off'}`}
        />
      </button>
    </div>
  )
}
