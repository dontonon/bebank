import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { getContractAddress } from '../config/wagmi'
import { getTokenByAddress } from '../config/tokens'
import { formatUnits } from 'viem'

const PASS_IT_ON_ABI = [
  {
    name: 'nextGiftId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getGift',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'giftId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'giver', type: 'address' },
        { name: 'claimed', type: 'bool' },
        { name: 'claimer', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'claimedAt', type: 'uint256' }
      ]
    }]
  }
]

export default function Stats() {
  const { address, chain, isConnected } = useAccount()
  const [userGifts, setUserGifts] = useState({ given: [], received: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGiven: 0,
    totalReceived: 0,
    activeGifts: 0,
    valueGiven: 0,
    valueReceived: 0
  })

  const { data: nextGiftId } = useReadContract({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: PASS_IT_ON_ABI,
    functionName: 'nextGiftId',
    enabled: !!chain?.id
  })

  useEffect(() => {
    async function loadUserGifts() {
      if (!isConnected || !address || !chain?.id || !nextGiftId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const contractAddress = getContractAddress(chain.id)
      const totalGifts = Number(nextGiftId)

      const given = []
      const received = []
      let valueGiven = 0
      let valueReceived = 0
      let activeCount = 0

      try {
        // Query all gifts to find user's activity
        // In production, use event logs for better performance
        for (let i = 0; i < Math.min(totalGifts, 100); i++) {
          try {
            const response = await fetch(chain.rpcUrls.default.http[0], {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: i,
                method: 'eth_call',
                params: [{
                  to: contractAddress,
                  data: '0xf4c714b4' + i.toString(16).padStart(64, '0') // getGift(uint256)
                }, 'latest']
              })
            })

            const data = await response.json()
            if (data.result && data.result !== '0x') {
              // Parse the gift data (simplified, would need proper ABI decoding)
              // For now, just show the count
            }
          } catch (err) {
            console.error('Error fetching gift', i, err)
          }
        }

        setStats({
          totalGiven: given.length,
          totalReceived: received.length,
          activeGifts: activeCount,
          valueGiven,
          valueReceived
        })
      } catch (error) {
        console.error('Error loading gifts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserGifts()
  }, [address, chain?.id, nextGiftId, isConnected])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
              <div className="text-6xl mb-6">📊</div>
              <h2 className="text-3xl font-bold text-white mb-4">Your Stats Dashboard</h2>
              <p className="text-gray-400 mb-8">Connect your wallet to view your HotPotato history</p>
            </div>
          </main>
        </div>
        <Sidebar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold gradient-text mb-2">📊 Your Stats</h1>
              <p className="text-gray-400">Track your HotPotato activity and achievements</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-2">Potatoes Given</div>
                <div className="text-4xl font-bold text-toxic">
                  {isLoading ? '...' : stats.totalGiven}
                </div>
              </div>

              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-2">Potatoes Received</div>
                <div className="text-4xl font-bold text-purple">
                  {isLoading ? '...' : stats.totalReceived}
                </div>
              </div>

              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-2">Active Potatoes</div>
                <div className="text-4xl font-bold gradient-text">
                  {isLoading ? '...' : stats.activeGifts}
                </div>
              </div>

              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-2">Total Value Given</div>
                <div className="text-4xl font-bold text-green-400">
                  ${isLoading ? '...' : stats.valueGiven.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Activity Tabs */}
            <div className="bg-dark-card rounded-xl border border-gray-800 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-400">Loading your activity...</p>
                </div>
              ) : stats.totalGiven === 0 && stats.totalReceived === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🥔</div>
                  <p className="text-gray-400 mb-4">No activity yet</p>
                  <p className="text-sm text-gray-500">Create your first potato to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <p>Full activity tracking coming soon!</p>
                    <p className="text-sm mt-2">We're building event indexing to show your complete history.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Achievements Section (Coming Soon) */}
            <div className="mt-8 bg-dark-card rounded-xl border border-gray-800 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">🏆 Achievements</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark/50 rounded-lg p-4 text-center border border-gray-800/50 opacity-50">
                  <div className="text-3xl mb-2">🥔</div>
                  <div className="text-sm text-gray-400">First Potato</div>
                  <div className="text-xs text-gray-600 mt-1">Locked</div>
                </div>
                <div className="bg-dark/50 rounded-lg p-4 text-center border border-gray-800/50 opacity-50">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-sm text-gray-400">Hot Streak</div>
                  <div className="text-xs text-gray-600 mt-1">Locked</div>
                </div>
                <div className="bg-dark/50 rounded-lg p-4 text-center border border-gray-800/50 opacity-50">
                  <div className="text-3xl mb-2">💎</div>
                  <div className="text-sm text-gray-400">High Roller</div>
                  <div className="text-xs text-gray-600 mt-1">Locked</div>
                </div>
                <div className="bg-dark/50 rounded-lg p-4 text-center border border-gray-800/50 opacity-50">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="text-sm text-gray-400">Speed Demon</div>
                  <div className="text-xs text-gray-600 mt-1">Locked</div>
                </div>
              </div>
              <p className="text-center text-gray-500 text-sm mt-4">Achievement system coming soon!</p>
            </div>
          </div>
        </main>
      </div>

      <Sidebar />
    </div>
  )
}
