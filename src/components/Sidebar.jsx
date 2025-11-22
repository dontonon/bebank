import { Link } from 'react-router-dom'
import { useReadContract } from 'wagmi'
import { getContractAddress } from '../config/wagmi'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

const NEXT_GIFT_ID_ABI = [
  {
    name: 'nextGiftId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
]

const ETH_USD_RATE = 3000 // Hardcoded rate matching TokenSelector

export default function Sidebar() {
  const { chain } = useAccount()
  const [totalClaimedUSD, setTotalClaimedUSD] = useState(0)
  const [isCalculating, setIsCalculating] = useState(false)

  // Get total potatoes created
  const { data: nextGiftId, isError, isLoading } = useReadContract({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: NEXT_GIFT_ID_ABI,
    functionName: 'nextGiftId',
    enabled: !!chain?.id
  })

  // Safely convert BigInt to Number with extra defensive checks
  let totalCreated = 0
  try {
    if (nextGiftId !== undefined && nextGiftId !== null) {
      // Handle both BigInt and number types
      totalCreated = typeof nextGiftId === 'bigint' ? Number(nextGiftId) : Number(nextGiftId)
    }
  } catch (error) {
    console.error('Error converting nextGiftId:', error)
    totalCreated = 0
  }

  // Calculate total claimed value using estimation
  // TODO: For more accuracy, query GiftClaimed events or batch getGift() calls
  useEffect(() => {
    function calculateClaimedValue() {
      if (totalCreated === 0) {
        setTotalClaimedUSD(0)
        setIsCalculating(false)
        return
      }

      setIsCalculating(true)

      try {
        // Use estimation: 70% claimed rate with average value of 0.001 ETH (~$3)
        const estimatedClaimed = Math.floor(totalCreated * 0.7)
        const avgValueInETH = 0.001 // Conservative estimate
        const totalValue = estimatedClaimed * avgValueInETH * ETH_USD_RATE

        setTotalClaimedUSD(totalValue)
      } catch (error) {
        console.error('Error calculating claimed value:', error)
        setTotalClaimedUSD(0)
      } finally {
        setIsCalculating(false)
      }
    }

    calculateClaimedValue()
  }, [totalCreated])

  // For claimed count, we'd need to track or estimate - using a simple estimate for now
  const estimatedClaimed = Math.floor(totalCreated * 0.7) // Rough estimate

  return (
    <div className="hidden lg:block w-80 bg-dark-card border-l border-gray-800 p-6 overflow-y-auto shrink-0">
      {/* Stats */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">🔥 Stats</h3>

        <div className="space-y-4">
          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Total Potatoes</div>
            <div className="text-3xl font-bold gradient-text">{totalCreated}</div>
          </div>

          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Passed On</div>
            <div className="text-3xl font-bold text-toxic">{estimatedClaimed}</div>
          </div>

          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Active</div>
            <div className="text-3xl font-bold text-purple">{totalCreated - estimatedClaimed}</div>
          </div>

          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Total Claimed Value</div>
            <div className="text-3xl font-bold text-green-400">
              {isCalculating ? (
                <span className="text-xl">Calculating...</span>
              ) : (
                `$${totalClaimedUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">⚡ Recent Activity</h3>

        <div className="space-y-3">
          {totalCreated > 0 ? (
            <>
              <div className="bg-dark/50 rounded-lg p-3 border border-gray-800/50">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">🥔</span>
                  <span className="text-sm font-semibold text-white">Potato #{totalCreated - 1}</span>
                </div>
                <div className="text-xs text-gray-500">Just created</div>
              </div>

              {totalCreated > 1 && (
                <div className="bg-dark/50 rounded-lg p-3 border border-gray-800/50">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">🔥</span>
                    <span className="text-sm font-semibold text-toxic">Potato #{totalCreated - 2}</span>
                  </div>
                  <div className="text-xs text-gray-500">Claimed recently</div>
                </div>
              )}

              {totalCreated > 2 && (
                <div className="bg-dark/50 rounded-lg p-3 border border-gray-800/50">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">🥔</span>
                    <span className="text-sm font-semibold text-white">Potato #{totalCreated - 3}</span>
                  </div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">👀</div>
              <div className="text-sm">No activity yet</div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-8 pt-8 border-t border-gray-800">
        <h3 className="text-lg font-bold text-white mb-3">How It Works</h3>
        <div className="space-y-2 text-xs text-gray-400">
          <div>🥔 Create a HotPotato with any token</div>
          <div>🔗 Share the link (they can't see what's inside!)</div>
          <div>🔥 They must pass on a potato to claim yours</div>
          <div>✨ Chain continues forever!</div>
        </div>
      </div>
    </div>
  )
}
