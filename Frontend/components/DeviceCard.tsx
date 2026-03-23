'use client'

/**
 * Multi-State Device Card Component
 * Renders device-specific controls based on device type
 * Sends absolute uint256 values to operateDevice function
 * 
 * Device Type Mappings:
 * - 0 (OnOff): Dual toggle (OFF=0, ON=1)
 * - 1 (Fan): 4-stage segment (OFF=0, Low=1, Med=2, High=3)
 * - 2 (Dimmer): Brightness slider (0-100)
 * - 3 (RGB): 5-color preset buttons (OFF=0, Green=1, Red=2, Blue=3, White=4)
 */

interface DeviceCardProps {
  id: string
  name: string
  roomId: number
  deviceId: number
  type: 'onoff' | 'fan' | 'dimmer' | 'rgb'
  status: number
  maxValue: number
  onControl: (roomId: number, deviceId: number, value: number) => void
  isDisabled?: boolean
}

export default function DeviceCard({
  id,
  name,
  roomId,
  deviceId,
  type,
  status,
  maxValue,
  onControl,
  isDisabled = false,
}: DeviceCardProps) {
  const getStatusLabel = (): string => {
    if (type === 'fan') {
      return status === 0 ? 'Off' : status === 1 ? 'Low' : status === 2 ? 'Medium' : 'High'
    } else if (type === 'rgb') {
      return status === 0
        ? 'Off'
        : status === 1
          ? 'Green'
          : status === 2
            ? 'Red'
            : status === 3
              ? 'Blue'
              : 'White'
    } else if (type === 'onoff') {
      return status === 0 ? 'Off' : 'On'
    } else {
      return `${status}%`
    }
  }

  const getIcon = (): string => {
    if (type === 'fan') return '🌀'
    if (type === 'rgb') return '🎨'
    if (type === 'onoff') return '💡'
    return '🔆'
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getIcon()}</span>
          <div>
            <h3 className="font-semibold text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500">ID: {deviceId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-600">{getStatusLabel()}</p>
          <p className="text-xs text-slate-500">Status: {status}</p>
        </div>
      </div>

      {/* Controls - OnOff Device */}
      {type === 'onoff' && (
        <div className="flex gap-3">
          <button
            onClick={() => onControl(roomId, deviceId, 0)}
            disabled={isDisabled}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
              status === 0
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title="Turn device OFF"
          >
            OFF
          </button>
          <button
            onClick={() => onControl(roomId, deviceId, 1)}
            disabled={isDisabled}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
              status > 0
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
            title="Turn device ON"
          >
            ON
          </button>
        </div>
      )}

      {/* Controls - Fan Device */}
      {type === 'fan' && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Speed Control</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onControl(roomId, deviceId, 0)}
              disabled={isDisabled}
              className={`py-3 px-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
                status === 0
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
              title="Fan OFF"
            >
              OFF
            </button>
            <button
              onClick={() => onControl(roomId, deviceId, 1)}
              disabled={isDisabled}
              className={`py-3 px-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
                status === 1
                  ? 'bg-yellow-500 text-white shadow-lg'
                  : 'bg-yellow-100 text-slate-700 hover:bg-yellow-200'
              }`}
              title="Low speed"
            >
              1
            </button>
            <button
              onClick={() => onControl(roomId, deviceId, 2)}
              disabled={isDisabled}
              className={`py-3 px-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
                status === 2
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-orange-100 text-slate-700 hover:bg-orange-200'
              }`}
              title="Medium speed"
            >
              2
            </button>
            <button
              onClick={() => onControl(roomId, deviceId, 3)}
              disabled={isDisabled}
              className={`py-3 px-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
                status === 3
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-red-100 text-slate-700 hover:bg-red-200'
              }`}
              title="High speed"
            >
              3
            </button>
          </div>
        </div>
      )}

      {/* Controls - RGB Device */}
      {type === 'rgb' && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Color Presets</p>
          <div className="grid grid-cols-5 gap-2">
            {/* OFF Button */}
            <button
              onClick={() => onControl(roomId, deviceId, 0)}
              disabled={isDisabled}
              className={`aspect-square rounded-full font-bold text-xs transition-all disabled:opacity-50 ${
                status === 0
                  ? 'bg-slate-800 text-white shadow-lg scale-110'
                  : 'bg-slate-300 text-white hover:bg-slate-400'
              }`}
              title="Turn OFF"
            >
              OFF
            </button>

            {/* GREEN Button - Value 1 */}
            <button
              onClick={() => onControl(roomId, deviceId, 1)}
              disabled={isDisabled}
              className={`aspect-square rounded-full font-bold transition-all disabled:opacity-50 ${
                status === 1
                  ? 'bg-green-600 shadow-lg scale-110'
                  : 'bg-green-400 hover:bg-green-500'
              }`}
              title="Green"
            />

            {/* RED Button - Value 2 */}
            <button
              onClick={() => onControl(roomId, deviceId, 2)}
              disabled={isDisabled}
              className={`aspect-square rounded-full font-bold transition-all disabled:opacity-50 ${
                status === 2
                  ? 'bg-blue-600 shadow-lg scale-110'
                  : 'bg-blue-400 hover:bg-blue-500'
              }`}
              title="Red"
            />

            {/* BLUE Button - Value 3 */}
            <button
              onClick={() => onControl(roomId, deviceId, 3)}
              disabled={isDisabled}
              className={`aspect-square rounded-full font-bold transition-all disabled:opacity-50 ${
                status === 3
                  ? 'bg-red-600 shadow-lg scale-110'
                  : 'bg-red-400 hover:bg-red-500'
              }`}
              title="Blue"
            />

            {/* WHITE Button - Value 4 */}
            <button
              onClick={() => onControl(roomId, deviceId, 4)}
              disabled={isDisabled}
              className={`aspect-square rounded-full font-bold transition-all disabled:opacity-50 ${
                status === 4
                  ? 'bg-yellow-300 text-yellow-900 shadow-lg scale-110'
                  : 'bg-yellow-200 hover:bg-yellow-300'
              }`}
              title="White"
            >
              W
            </button>
          </div>
        </div>
      )}

      {/* Controls - Dimmer Device */}
      {type === 'dimmer' && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Brightness</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={status}
              onChange={(e) => onControl(roomId, deviceId, Number(e.target.value))}
              disabled={isDisabled}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <span className="text-sm font-semibold text-slate-700 min-w-12">{status}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
