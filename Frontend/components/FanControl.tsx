'use client'

import { useState } from 'react'

export default function FanControl() {
  const [speed, setSpeed] = useState<0 | 1 | 2 | 3>(0)

  const speeds = [
    { label: 'Off', value: 0 },
    { label: 'Low', value: 1 },
    { label: 'Med', value: 2 },
    { label: 'High', value: 3 },
  ] as const

  const handleSpeedChange = (newSpeed: 0 | 1 | 2 | 3) => {
    setSpeed(newSpeed)
    // TODO: Call blockchain operateDevice(roomId=1, deviceId=1, newSpeed)
    // This triggers 50ms dead-time on ESP32 for motor protection
    console.log(`Fan speed set to: ${speeds.find(s => s.value === newSpeed)?.label}`)
  }

  return (
    <div className="flex gap-2">
      {speeds.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => handleSpeedChange(value as 0 | 1 | 2 | 3)}
          className={`btn-segmented ${
            speed === value
              ? 'btn-segmented-active'
              : 'btn-segmented-inactive'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
