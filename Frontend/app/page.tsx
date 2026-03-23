'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, Lock, TrendingUp, Settings, Home, Shield } from 'lucide-react'

export default function HomePage() {
  const [homeStats, setHomeStats] = useState({
    activeDevices: 0,
    temperature: 0,
    energyUsage: 0,
    loading: true
  })

  // Fetch home stats from backend placeholder
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/home/stats')
        // const data = await response.json()
        
        // Placeholder data for now
        setTimeout(() => {
          setHomeStats({
            activeDevices: 7,
            temperature: 22.5,
            energyUsage: 2450,
            loading: false
          })
        }, 500)
      } catch (error) {
        console.error('Failed to fetch home stats:', error)
        setHomeStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  const features = [
    {
      icon: Zap,
      title: 'Smart Control',
      description: 'Control all your devices from one unified dashboard',
      href: '/dashboard',
      color: 'blue'
    },
    {
      icon: Lock,
      title: 'Access Control',
      description: 'Manage permissions with blockchain security',
      href: '/access-management',
      color: 'purple'
    },
    {
      icon: TrendingUp,
      title: 'Analytics',
      description: 'Monitor energy usage and device performance',
      href: '/analytics',
      color: 'green'
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Configure rooms, devices, and preferences',
      href: '/settings',
      color: 'orange'
    },
  ]

  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HC</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">HomeChain</h1>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Enter Dashboard
            <span className="text-lg">→</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Your Home, Secured by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Blockchain</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Control appliances with decentralized access management. Time-bound guest access, role-based permissions, and immutable audit trails.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Home className="text-blue-600 w-5 h-5" />
              <span className="text-slate-600 text-sm font-medium">Active Devices</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{homeStats.activeDevices}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-orange-600 w-5 h-5" />
              <span className="text-slate-600 text-sm font-medium">Temperature</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{homeStats.temperature}°C</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-emerald-600 w-5 h-5" />
              <span className="text-slate-600 text-sm font-medium">Energy Usage</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{homeStats.energyUsage}W</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Core Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            const gradientClass = colorMap[feature.color as keyof typeof colorMap]
            return (
              <Link key={feature.href} href={feature.href}>
                <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full group">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2 text-lg">{feature.title}</h4>
                  <p className="text-slate-600 text-sm mb-4">{feature.description}</p>
                  <div className="flex items-center gap-2 text-blue-600 text-sm font-medium group-hover:gap-3 transition-all">
                    Explore <span>→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 sm:p-12 text-center text-white">
          <Shield className="mx-auto mb-4 opacity-90 w-10 h-10" />
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">Blockchain-Secured Access</h3>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Every access decision is enforced by smart contracts. Grant time-limited permissions and maintain a permanent audit trail of all changes.
          </p>
          <Link
            href="/access-management"
            className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Manage Access <span>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-600 text-sm">
          <p>HomeChain © 2024 | Blockchain-Powered Smart Home Automation</p>
        </div>
      </footer>
    </div>
  )
}
