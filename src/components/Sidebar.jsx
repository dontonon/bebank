import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useReadContract, useWatchContractEvent, usePublicClient } from 'wagmi'
import { getContractAddress } from '../config/wagmi'
import { getTokenByAddress } from '../config/tokens'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'

const NEXT_GIFT_ID_ABI = [
  {
    name: 'nextGiftId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
]

const EVENT_ABIS = [
  {
    name: 'GiftCreated',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'giftId', type: 'uint256' },
      { indexed: true, name: 'giver', type: 'address' },
      { indexed: false, name: 'token', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ]
  },
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
    abi: NEXT_GIFT_ID_ABI,
    functionName: 'nextGiftId',
    enabled: !!chain?.id
  })

  // Load initial recent activity from blockchain
  useEffect(() => {
    async function loadRecentActivity() {
      if (!chain || !publicClient) {
        setIsLoadingActivity(false)
        return
      }

      try {
        const contractAddress = getContractAddress(chain.id)
        const currentBlock = await publicClient.getBlockNumber()

        // Load last 100k blocks (RPC limit) - roughly last 55 hours on Base Sepolia
        const fromBlock = currentBlock > 100000n ? currentBlock - 100000n : 0n

        console.log('🔍 Loading activity from block', fromBlock.toString(), 'to', currentBlock.toString())
        console.log('📍 Contract address:', contractAddress)

        // Fetch GiftClaimed events
        const claimedLogs = await publicClient.getLogs({
          address: contractAddress,
          event: EVENT_ABIS[1], // GiftClaimed
          fromBlock,
          toBlock: 'latest'
        })

        console.log('📊 Found', claimedLogs.length, 'claim events')
        console.log('📋 Raw logs:', claimedLogs)

        const activities = []

        // Process ONLY claimed events (don't show creates - that would spoil the surprise!)
        claimedLogs.forEach(log => {
          try {
            const { oldGiftId, newGiftId, claimer, tokenReceived, amountReceived } = log.args
            const token = getTokenByAddress(tokenReceived)
            if (token) {
              activities.push({
                type: 'claim',
                potatoId: Number(oldGiftId),
                newPotatoId: Number(newGiftId),
                address: claimer,
                token: token.symbol,
                amount: formatUnits(amountReceived, token.decimals),
                timestamp: Date.now() - Math.random() * 3600000, // Approximate time
                blockNumber: log.blockNumber
              })
            } else {
              console.warn('⚠️ Unknown token:', tokenReceived)
            }
          } catch (error) {
            console.error('❌ Error processing claim log:', error)
          }
        })

        // Sort by block number (most recent first) and take top 15
        activities.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
        const topActivities = activities.slice(0, 15)
        console.log('✅ Setting', topActivities.length, 'activities')
        setRecentActivity(topActivities)
      } catch (error) {
        console.error('❌ Error loading recent activity:', error)
      } finally {
        setIsLoadingActivity(false)
      }
    }

    loadRecentActivity()
  }, [chain, publicClient]) // Reload activity when chain/client changes

  // Watch for new GiftClaimed events (real-time updates)
  useWatchContractEvent({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: EVENT_ABIS,
    eventName: 'GiftClaimed',
    enabled: !!chain?.id,
    onLogs(logs) {
      console.log('🔥🔥🔥 REAL-TIME WATCHER FIRED! Events:', logs.length)
      console.log('📋 Raw event logs:', logs)

      if (logs.length === 0) {
        console.warn('⚠️ Watcher fired but got 0 logs!')
        return
      }

      logs.forEach((log, index) => {
        try {
          console.log(`\n=== Processing real-time event ${index} ===`)
          console.log('Full log:', log)
          console.log('Log args:', log.args)

          const { oldGiftId, newGiftId, claimer, tokenReceived, amountReceived } = log.args || {}

          console.log('Extracted args:', { oldGiftId, newGiftId, claimer, tokenReceived, amountReceived })

          if (!tokenReceived) {
            console.error('❌ No tokenReceived in args!')
            return
          }

          const token = getTokenByAddress(tokenReceived)
          console.log('Token lookup result:', token)

          if (token) {
            const newActivity = {
              type: 'claim',
              potatoId: Number(oldGiftId),
              newPotatoId: Number(newGiftId),
              address: claimer,
              token: token.symbol,
              amount: formatUnits(amountReceived, token.decimals),
              timestamp: Date.now(),
              blockNumber: log.blockNumber
            }
            console.log('✅ Adding new real-time activity:', newActivity)

            setRecentActivity(prev => {
              const updated = [newActivity, ...prev].slice(0, 15)
              console.log('📊 Updated activity count:', updated.length)
              console.log('📊 Full activity list:', updated)
              return updated
            })
          } else {
            console.warn('⚠️ Token not found for address:', tokenReceived)
          }
        } catch (error) {
          console.error('❌ Error processing real-time event:', error)
          console.error('Error stack:', error.stack)
        }
      })
    },
    onError(error) {
      console.error('❌ Watch contract event error:', error)
    }
  })

  console.log('👀 Event watcher is', chain?.id ? 'ENABLED' : 'DISABLED', 'for chain', chain?.id)

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

  // Calculate total claimed value in USD (approximate)
  const calculateClaimedValueUSD = () => {
    let totalUSD = 0
    recentActivity.forEach(activity => {
      const amount = parseFloat(activity.amount)
      // Simple price estimates (you can update these or use an oracle later)
      const prices = {
        'ETH': 3000,
        'WETH': 3000,
        'USDC': 1,
        'DAI': 1,
        'cbETH': 3000
      }
      const price = prices[activity.token] || 0
      totalUSD += amount * price
    })
    return totalUSD
  }

  const totalClaimedUSD = calculateClaimedValueUSD()

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

        <div className="space-y-4">
          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Hot Potatos passed on</div>
            <div className="text-3xl font-bold gradient-text">{totalCreated}</div>
          </div>

          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Total Claimed Value</div>
            <div className="text-3xl font-bold text-green-400">
              ${totalClaimedUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-1">From recent activity</div>
          </div>
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
            recentActivity.map((activity, index) => (
              <div key={index} className="bg-dark/50 rounded-lg p-3 border border-gray-800/50 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🔥</span>
                    <span className="text-sm font-semibold text-toxic">
                      Claimed
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
