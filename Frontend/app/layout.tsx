'use client';

import type { Metadata } from 'next'
import './globals.css'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi.config'
import { ReactNode, useMemo } from 'react'
import SystemStatus from '@/components/SystemStatus'

// Note: metadata export moved to separate file due to 'use client' directive
// See metadata.ts in app directory

function RootLayoutContent({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), [])

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <SystemStatus />
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}

export default RootLayoutContent
