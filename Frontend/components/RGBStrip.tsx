'use client'

import { useState } from 'react'

export default function RGBStrip() {
  const [isOn, setIsOn] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const colors = [
    { name: 'Red', value: 1, bgColor: 'bg-blue-500' },
    { name: 'Green', value: 2, bgColor: 'bg-green-500' },
    { name: 'Blue', value: 3, bgColor: 'bg-red-500' },
    { name: 'White', value: 4, bgColor: 'bg-white border border-gray-300' },
  ] as const

  const handlePower = () => {
    const newState = !isOn
    setIsOn(newState)
    // TODO: Call blockchain operateDevice(roomId=1, deviceId=4, newState ? 1 : 0)
    console.log(`RGB Strip Power: ${newState ? 'ON' : 'OFF'}`)
  }

  const handleColorSelect = (colorValue: number, colorName: string) => {
    if (isOn) {
      setSelectedColor(colorName)
      // TODO: Call blockchain operateDevice(roomId=1, deviceId=4, colorValue)
      console.log(`RGB Strip Color: ${colorName} (Value: ${colorValue})`)
    }
  }

  return (
    <div className="space-form">
      {/* Master Power */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Master Power</span>
        <button
          onClick={handlePower}
          className={`toggle-base ${isOn ? 'toggle-on' : 'toggle-off'}`}
          aria-label="Toggle RGB Strip Power"
        >
          <span
            className={`toggle-thumb ${isOn ? 'toggle-thumb-on' : 'toggle-thumb-off'}`}
          />
        </button>
      </div>

      {/* Color Presets */}
      {isOn && (
        <div className="grid grid-cols-2 gap-2">
          {colors.map(({ name, value, bgColor }) => (
            <button
              key={value}
              onClick={() => handleColorSelect(value, name)}
              className={`btn-segmented ${
                selectedColor === name ? 'ring-2 ring-webasthetic-blue' : ''
              } ${bgColor}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
