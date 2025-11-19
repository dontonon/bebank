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
  const [recentActivity, setRecentActivity] = useState([])

  // Get total potatoes created
  const { data: nextGiftId, isError, isLoading } = useReadContract({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: NEXT_GIFT_ID_ABI,
    functionName: 'nextGiftId',
    enabled: !!chain?.id
  })

  // Watch for new GiftClaimed events
  useWatchContractEvent({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: EVENT_ABIS,
    eventName: 'GiftClaimed',
    enabled: !!chain?.id,
    onLogs(logs) {
      console.log('New GiftClaimed events:', logs)
      logs.forEach(log => {
        try {
          const { claimer, tokenReceived, amountReceived } = log.args
          const token = getTokenByAddress(tokenReceived)
          if (token) {
            const newActivity = {
              type: 'claim',
              address: claimer,
              token: token.symbol,
              amount: formatUnits(amountReceived, token.decimals),
              timestamp: Date.now()
            }
            setRecentActivity(prev => [newActivity, ...prev].slice(0, 10))
          }
        } catch (error) {
          console.error('Error processing GiftClaimed event:', error)
        }
      })
    }
  })

  // Watch for new GiftCreated events
  useWatchContractEvent({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: EVENT_ABIS,
    eventName: 'GiftCreated',
    enabled: !!chain?.id,
    onLogs(logs) {
      console.log('New GiftCreated events:', logs)
      logs.forEach(log => {
        try {
          const { giver, token: tokenAddr, amount } = log.args
          const token = getTokenByAddress(tokenAddr)
          if (token) {
            const newActivity = {
              type: 'create',
              address: giver,
              token: token.symbol,
              amount: formatUnits(amount, token.decimals),
              timestamp: Date.now()
            }
            setRecentActivity(prev => [newActivity, ...prev].slice(0, 10))
          }
        } catch (error) {
          console.error('Error processing GiftCreated event:', error)
        }
      })
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

        <div className="space-y-4">
          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Hot Potatos passed on</div>
            <div className="text-3xl font-bold gradient-text">{totalCreated}</div>
          </div>

          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Hot Potatos to be claimed</div>
            <div className="text-3xl font-bold text-purple">{activePotatos}</div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">⚡ Live Activity</h3>

        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="bg-dark/50 rounded-lg p-3 border border-gray-800/50 animate-fade-in">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">{activity.type === 'claim' ? '🔥' : '🥔'}</span>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">
                      <span className="font-mono">
                        {activity.address.substring(0, 6)}...{activity.address.substring(38)}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-toxic">
                      {activity.type === 'claim' ? 'claimed' : 'created'} {parseFloat(activity.amount).toFixed(4)} {activity.token}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 ml-7">{formatTimeAgo(activity.timestamp)}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">👀</div>
              <div className="text-sm">Waiting for activity...</div>
              <div className="text-xs text-gray-600 mt-2">Events will appear here in real-time!</div>
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
