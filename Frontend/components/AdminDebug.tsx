'use client'

import { useState, useEffect } from 'react'
import Web3 from 'web3'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/constants'

export default function AdminDebug() {
  const [diagnostics, setDiagnostics] = useState<Record<string, string>>({})

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: Record<string, string> = {}

      // 1. Check MetaMask
      if ((window as any).ethereum) {
        results['MetaMask'] = '✅ Detected'
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' })
          results['Connected Account'] = accounts[0] || '❌ No account'
        } catch (e) {
          results['Connected Account'] = '❌ Error'
        }
      } else {
        results['MetaMask'] = '❌ Not found'
      }

      // 2. Check RPC connection
      try {
        const web3 = new Web3((window as any).ethereum || 'http://127.0.0.1:8545')
        const blockNumber = await web3.eth.getBlockNumber()
        results['RPC Connection'] = `✅ Block ${blockNumber}`
      } catch (e: any) {
        results['RPC Connection'] = `❌ ${e.message}`
      }

      // 3. Check contract
      try {
        const web3 = new Web3((window as any).ethereum || 'http://127.0.0.1:8545')
        const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS)
        const code = await web3.eth.getCode(CONTRACT_ADDRESS)
        if (code === '0x') {
          results['Contract'] = `❌ No code at ${CONTRACT_ADDRESS}`
        } else {
          const roomCount = await (contract.methods.roomCount() as any).call()
          results['Contract'] = `✅ Deployed, ${roomCount} rooms`
        }
      } catch (e: any) {
        results['Contract'] = `❌ ${e.message}`
      }

      // 4. Check network
      try {
        const web3 = new Web3((window as any).ethereum || 'http://127.0.0.1:8545')
        const chainId = await web3.eth.getChainId()
        results['Network'] = `Chain ID ${chainId}`
      } catch (e: any) {
        results['Network'] = `❌ ${e.message}`
      }

      setDiagnostics(results)
    }

    runDiagnostics()
    const interval = setInterval(runDiagnostics, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded-lg text-xs font-mono max-w-80 max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2">🔧 Diagnostics</h3>
      {Object.entries(diagnostics).map(([key, val]) => (
        <div key={key} className="mb-1">
          <span className="text-slate-400">{key}:</span> {val}
        </div>
      ))}
    </div>
  )
}
