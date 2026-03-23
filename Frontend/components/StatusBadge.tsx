'use client'

interface StatusBadgeProps {
  label: string
  status: 'online' | 'connected' | 'offline'
}

export default function StatusBadge({ label, status }: StatusBadgeProps) {
  const statusClasses = {
    online: 'badge-online',
    connected: 'badge-online',
    offline: 'badge-offline',
  }

  return (
    <span className={`badge-base ${statusClasses[status]}`}>
      {label}: {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
