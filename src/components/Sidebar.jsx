import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useReadContract, useWatchContractEvent, usePublicClient } from 'wagmi'
import { getContractAddress } from '../config/wagmi'
import { getTokenByAddress } from '../config/tokens'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'

const CONTRACT_ABI = [
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

const EVENT_ABIS = [
  {
    name: 'GiftClaimed',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'oldGiftId', type: 'uint256' },
      { indexed: true, name: 'newGiftId', type: 'uint256' },
      { indexed: true, name: 'claimer', type: 'address' },
      { indexed: false, name: 'tokenReceived', type: 'address' },
      { indexed: false, name: 'amountReceived', type: 'uint256' }
    ]
  }
]

export default function Sidebar() {
  const { chain } = useAccount()
  const publicClient = usePublicClient()
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)

  // Get total potatoes created
  const { data: nextGiftId, isError, isLoading } = useReadContract({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: CONTRACT_ABI,
    functionName: 'nextGiftId',
    enabled: !!chain?.id
  })

  // Load initial recent activity from blockchain by scanning recent potatoes
  useEffect(() => {
    async function loadRecentActivity() {
      if (!chain || !publicClient || !nextGiftId) {
        setIsLoadingActivity(false)
        return
      }

      try {
        const contractAddress = getContractAddress(chain.id)
        const totalPotatoes = Number(nextGiftId)

        console.log('🔍 Scanning recent potatoes for claimed activity')
        console.log('📍 Total potatoes:', totalPotatoes)

        if (totalPotatoes <= 1) {
          console.log('⚠️ No potatoes exist yet')
          setRecentActivity([])
          setIsLoadingActivity(false)
          return
        }

        const activities = []
        const lastPotatoId = totalPotatoes - 1
        const startId = Math.max(1, lastPotatoId - 99) // Scan last 100 potatoes

        console.log('🔍 Scanning potatoes from', startId, 'to', lastPotatoId)

        for (let i = lastPotatoId; i >= startId; i--) {
          try {
            const giftData = await publicClient.readContract({
              address: contractAddress,
              abi: CONTRACT_ABI,
              functionName: 'getGift',
              args: [BigInt(i)]
            })

            // Check if this potato was claimed
            const isClaimed = giftData?.[3] !== undefined ? giftData[3] : giftData?.claimed

            if (isClaimed) {
              const tokenAddr = giftData[0] || giftData.token
              const amount = giftData[1] || giftData.amount
              const claimer = giftData[4] || giftData.claimer
              const claimedAt = giftData[6] || giftData.claimedAt

              const token = getTokenByAddress(tokenAddr)
              if (token) {
                // Calculate amount received (99% of original)
                const amountReceived = (BigInt(amount) * 99n) / 100n

                activities.push({
                  type: 'claim',
                  potatoId: i,
                  address: claimer,
                  token: token.symbol,
                  amount: formatUnits(amountReceived, token.decimals),
                  timestamp: claimedAt ? Number(claimedAt) * 1000 : Date.now(),
                  id: i
                })
              }
            }

            // Stop once we have 5 claimed potatoes
            if (activities.length >= 5) break
          } catch (error) {
            console.error(`❌ Error reading potato ${i}:`, error)
          }
        }

        console.log('✅ Found', activities.length, 'claimed potatoes')
        setRecentActivity(activities)
      } catch (error) {
        console.error('❌ Error loading recent activity:', error)
      } finally {
        setIsLoadingActivity(false)
      }
    }

    loadRecentActivity()
  }, [chain, publicClient, nextGiftId]) // Reload when nextGiftId changes

  // Watch for new GiftClaimed events (real-time updates)
  useWatchContractEvent({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: EVENT_ABIS,
    eventName: 'GiftClaimed',
    enabled: !!chain?.id,
    onLogs(logs) {
      console.log('🔥 Real-time claim detected:', logs.length, 'events')

      logs.forEach((log) => {
        try {
          const { oldGiftId, tokenReceived, amountReceived, claimer } = log.args || {}

          const token = getTokenByAddress(tokenReceived)
          if (token) {
            const newActivity = {
              type: 'claim',
              potatoId: Number(oldGiftId),
              address: claimer,
              token: token.symbol,
              amount: formatUnits(amountReceived, token.decimals),
              timestamp: Date.now(),
              id: Number(oldGiftId)
            }

            setRecentActivity(prev => [newActivity, ...prev].slice(0, 5))
            console.log('✅ Added real-time claim for potato #' + oldGiftId)
          }
        } catch (error) {
          console.error('❌ Error processing real-time event:', error)
        }
      })
    },
    onError(error) {
      console.error('❌ Watch contract event error:', error)
    }
  })

  // Safely convert BigInt to Number with extra defensive checks
  let totalCreated = 0
  try {
    if (nextGiftId !== undefined && nextGiftId !== null) {
      totalCreated = typeof nextGiftId === 'bigint' ? Number(nextGiftId) : Number(nextGiftId)
    }
  } catch (error) {
    console.error('Error converting nextGiftId:', error)
    totalCreated = 0
  }

  const estimatedClaimed = Math.floor(totalCreated * 0.7)
  const activePotatos = totalCreated - estimatedClaimed

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="w-80 bg-dark-card border-l border-gray-800 p-6 overflow-y-auto">
      {/* Stats */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">🔥 Stats</h3>

        <div className="bg-dark rounded-xl p-4 border border-gray-800">
          <div className="text-gray-400 text-sm mb-1">Hot Potatos passed on</div>
          <div className="text-3xl font-bold gradient-text">{totalCreated}</div>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">⚡ Live Activity</h3>

        <div className="space-y-3">
          {isLoadingActivity ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2 animate-spin">🥔</div>
              <div className="text-sm">Loading activity...</div>
            </div>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="bg-dark/50 rounded-lg p-3 border border-gray-800/50 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🥔</span>
                    <span className="text-sm font-semibold text-toxic">
                      Hot Potato claimed
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-400">
                    {parseFloat(activity.amount).toFixed(4)} {activity.token}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">{formatTimeAgo(activity.timestamp)}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">👀</div>
              <div className="text-sm">No recent activity</div>
              <div className="text-xs text-gray-600 mt-2">New events will appear here in real-time!</div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-8 pt-8 border-t border-gray-800">
        <h3 className="text-lg font-bold text-white mb-3">How It Works</h3>
        <div className="space-y-2 text-xs text-gray-400">
          <div>🥔 Create a Hot Potato with any token</div>
          <div>🔗 Share the link (they can't see what's inside!)</div>
          <div>🔥 They must pass on a potato to claim yours</div>
          <div>✨ Chain continues forever!</div>
        </div>
      </div>
    </div>
  )
}
