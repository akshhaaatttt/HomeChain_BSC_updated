'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, Bell, Lock } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Select } from '@/components/UI'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    homeAddress: '123 Main St, City, State',
    timezone: 'America/New_York',
    temperatureUnit: 'celsius',
    notifications: {
      deviceOffline: true,
      accessGranted: true,
      energyAlert: false,
      securityAlert: true,
    },
    privacy: {
      dataCollection: true,
      analyticsSharing: false,
    },
  })

  const [success, setSuccess] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }))
    setSaved(false)
  }

  const handlePrivacyChange = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value },
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      // TODO: Call API to save settings
      // await fetch('/api/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings),
      // })

      setSaved(true)
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />

      <div className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <SettingsIcon className="text-blue-600 w-8 h-8" />
              Settings
            </h1>
            <p className="text-slate-600">Configure your home automation preferences</p>
          </div>

          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-gap gap-3">
              <p className="text-emerald-700">{success}</p>
            </div>
          )}

          {/* General Settings */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">General Settings</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <Input
                label="Home Address"
                placeholder="123 Main St, City, State"
                value={settings.homeAddress}
                onChange={(e) => handleSettingChange('homeAddress', e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Timezone"
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  options={[
                    { value: 'America/New_York', label: 'Eastern Time (ET)' },
                    { value: 'America/Chicago', label: 'Central Time (CT)' },
                    { value: 'America/Denver', label: 'Mountain Time (MT)' },
                    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                    { value: 'Europe/London', label: 'GMT (London)' },
                    { value: 'Europe/Paris', label: 'CET (Paris)' },
                    { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
                  ]}
                />

                <Select
                  label="Temperature Unit"
                  value={settings.temperatureUnit}
                  onChange={(e) => handleSettingChange('temperatureUnit', e.target.value)}
                  options={[
                    { value: 'celsius', label: 'Celsius (°C)' },
                    { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
                  ]}
                />
              </div>
            </CardBody>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </CardFooter>
          </Card>

          {/* Notifications */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Device Offline Alerts</p>
                  <p className="text-sm text-slate-600 mt-1">Get notified when a device goes offline</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.deviceOffline}
                  onChange={(e) => handleNotificationChange('deviceOffline', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Access Granted Notifications</p>
                  <p className="text-sm text-slate-600 mt-1">Notify when access is granted to users</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.accessGranted}
                  onChange={(e) => handleNotificationChange('accessGranted', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Energy Usage Alerts</p>
                  <p className="text-sm text-slate-600 mt-1">Alert when energy usage is high</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.energyAlert}
                  onChange={(e) => handleNotificationChange('energyAlert', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Security Alerts</p>
                  <p className="text-sm text-slate-600 mt-1">Critical security notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.securityAlert}
                  onChange={(e) => handleNotificationChange('securityAlert', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600"
                />
              </div>
            </CardBody>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </CardFooter>
          </Card>

          {/* Privacy & Security */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Privacy & Security
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Data Collection</p>
                  <p className="text-sm text-slate-600 mt-1">Allow collection of usage analytics</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.dataCollection}
                  onChange={(e) => handlePrivacyChange('dataCollection', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Analytics Sharing</p>
                  <p className="text-sm text-slate-600 mt-1">Share anonymized data to improve the service</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.analyticsSharing}
                  onChange={(e) => handlePrivacyChange('analyticsSharing', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600"
                />
              </div>
            </CardBody>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </CardFooter>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Advanced Settings</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <button className="w-full text-left p-4 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Reset All Settings</p>
                    <p className="text-sm text-slate-600 mt-1">Restore all settings to default values</p>
                  </div>
                  <span className="text-slate-400">→</span>
                </div>
              </button>

              <button className="w-full text-left p-4 hover:bg-slate-50 rounded-lg transition-colors border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Export Data</p>
                    <p className="text-sm text-slate-600 mt-1">Download your settings and activity logs</p>
                  </div>
                  <span className="text-slate-400">→</span>
                </div>
              </button>

              <button className="w-full text-left p-4 hover:bg-red-50 rounded-lg transition-colors border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-600">Delete Account</p>
                    <p className="text-sm text-red-500 mt-1">Permanently delete your account and all data</p>
                  </div>
                  <span className="text-red-400">→</span>
                </div>
              </button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
