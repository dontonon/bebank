import { useState, useEffect } from 'react'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { getContractAddress } from '../config/wagmi'
import { getTokenByAddress } from '../config/tokens'
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
        { name: 'claimedAt', type: 'uint256' },
        { name: 'secretHash', type: 'bytes32' }
      ]
    }]
  }
]

export default function Stats() {
  const { chain } = useAccount()
  const publicClient = usePublicClient()
  const [stats, setStats] = useState({
    totalCreated: 0,
    totalClaimed: 0,
    activePotatoes: 0,
    recentClaims: [],
    biggestPotato: null,
    latestPotato: null,
    tokenStats: {},
    totalValueLocked: '0',
    avgPotatoValue: '0',
    claimsToday: 0,
    fastestClaim: null,
    chainVelocity: 0,
    claimsLastHour: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Get total number of potatoes
  const { data: nextGiftId } = useReadContract({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: CONTRACT_ABI,
    functionName: 'nextGiftId',
    enabled: !!chain?.id
  })

  useEffect(() => {
    async function loadStats() {
      if (!chain || !publicClient || !nextGiftId) {
        setIsLoading(false)
        return
      }

      try {
        const contractAddress = getContractAddress(chain.id)
        const totalPotatoes = Number(nextGiftId)

        // Load last 20 potatoes for efficiency (not all of them)
        const startId = Math.max(0, totalPotatoes - 20)
        const potatoPromises = []

        for (let i = totalPotatoes - 1; i >= startId && i >= 0; i--) {
          potatoPromises.push(
            publicClient.readContract({
              address: contractAddress,
              abi: CONTRACT_ABI,
              functionName: 'getGift',
              args: [BigInt(i)]
            }).then(data => ({ id: i, ...data }))
          )
        }

        const potatoes = await Promise.all(potatoPromises)

        // Calculate stats
        let claimed = 0
        let active = 0
        let recentClaims = []
        let biggestPotato = null
        let latestPotato = null
        let tokenCounts = {}
        let totalValue = 0
        let totalPotatoesValue = 0
        let potatoCount = 0
        let claimsToday = 0
        let fastestClaim = null
        let claimsLastHour = 0

        const now = Date.now() / 1000
        const today = now - 86400 // Last 24 hours
        const lastHour = now - 3600 // Last hour

        potatoes.forEach(potato => {
          const token = getTokenByAddress(potato[0])
          const amount = potato[1]
          const isClaimed = potato[3]
          const timestamp = Number(potato[5])
          const claimedAt = potato[6] ? Number(potato[6]) : null

          // Count claimed vs active
          if (isClaimed) {
            claimed++

            // Recent claims (last 10)
            if (recentClaims.length < 10) {
              recentClaims.push({
                id: potato.id,
                token: token.symbol,
                amount: formatUnits(amount, token.decimals),
                claimedAt: claimedAt,
                timestamp: timestamp
              })
            }

            // Claims today
            if (claimedAt && claimedAt > today) {
              claimsToday++
            }

            // Claims last hour
            if (claimedAt && claimedAt > lastHour) {
              claimsLastHour++
            }

            // Fastest claim (time between creation and claim)
            if (claimedAt) {
              const claimSpeed = claimedAt - timestamp // seconds between creation and claim
              if (!fastestClaim || claimSpeed < fastestClaim.speed) {
                fastestClaim = {
                  id: potato.id,
                  speed: claimSpeed,
                  token: token.symbol,
                  amount: parseFloat(formatUnits(amount, token.decimals))
                }
              }
            }
          } else {
            active++
          }

          // Token statistics
          if (!tokenCounts[token.symbol]) {
            tokenCounts[token.symbol] = 0
          }
          tokenCounts[token.symbol]++

          // Biggest potato
          const amountFloat = parseFloat(formatUnits(amount, token.decimals))
          if (!biggestPotato || amountFloat > biggestPotato.amount) {
            biggestPotato = {
              id: potato.id,
              token: token.symbol,
              amount: amountFloat,
              timestamp: timestamp
            }
          }

          // Latest potato
          if (!latestPotato || timestamp > latestPotato.timestamp) {
            latestPotato = {
              id: potato.id,
              token: token.symbol,
              amount: amountFloat,
              timestamp: timestamp,
              claimed: isClaimed
            }
          }

          // Total value (only active potatoes for TVL)
          if (!isClaimed) {
            totalValue += amountFloat
          }

          // Average calculation (all potatoes)
          totalPotatoesValue += amountFloat
          potatoCount++
        })

        // Calculate chain velocity (claims per day)
        const chainVelocity = claimed > 0 ? (claimsToday / 1).toFixed(1) : '0.0' // simplified: today's claims as daily rate

        setStats({
          totalCreated: totalPotatoes,
          totalClaimed: claimed,
          activePotatoes: active,
          recentClaims,
          biggestPotato,
          latestPotato,
          tokenStats: tokenCounts,
          totalValueLocked: totalValue.toFixed(4),
          avgPotatoValue: (totalPotatoesValue / potatoCount).toFixed(4),
          claimsToday,
          fastestClaim,
          chainVelocity,
          claimsLastHour
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading stats:', error)
        setIsLoading(false)
      }
    }

    loadStats()
  }, [chain, publicClient, nextGiftId])

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
  }

  const getMostPopularToken = () => {
    if (!stats.tokenStats || Object.keys(stats.tokenStats).length === 0) return 'N/A'
    return Object.entries(stats.tokenStats).sort((a, b) => b[1] - a[1])[0][0]
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Header />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-black gradient-text mb-3">🥔 Hot Potatos</h1>
            <p className="text-gray-400 text-lg">Real-time stats from the potato chain</p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-4 animate-spin inline-block">🥔</div>
              <p className="text-gray-400">Loading stats...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Claimed */}
                <div className="glass-card rounded-xl p-6 border border-purple/30 glow-purple">
                  <div className="text-gray-400 text-sm mb-2">✨ Total Claimed</div>
                  <div className="text-4xl font-black text-purple">{stats.totalClaimed}</div>
                  <div className="text-xs text-gray-500 mt-2">All-time claims</div>
                </div>

                {/* Claims Today */}
                <div className="glass-card rounded-xl p-6 border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <div className="text-gray-400 text-sm mb-2">📈 Last 24h</div>
                  <div className="text-4xl font-black text-green-500">{stats.claimsToday}</div>
                  <div className="text-xs text-gray-500 mt-2">Claims today</div>
                </div>
              </div>

              {/* Middle Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 5. Biggest Potato */}
                <div className="glass-card rounded-xl p-6 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">👑</span>
                    <div>
                      <div className="text-gray-400 text-sm">Biggest Potato</div>
                      <div className="text-xs text-gray-600">All-time record</div>
                    </div>
                  </div>
                  {stats.biggestPotato ? (
                    <>
                      <div className="text-2xl font-bold text-yellow-500">
                        {stats.biggestPotato.amount} {stats.biggestPotato.token}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Potato #{stats.biggestPotato.id}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">No data</div>
                  )}
                </div>

                {/* 6. Average Value */}
                <div className="glass-card rounded-xl p-6 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">📊</span>
                    <div>
                      <div className="text-gray-400 text-sm">Average Value</div>
                      <div className="text-xs text-gray-600">Per potato</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.avgPotatoValue}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Mixed tokens</div>
                </div>

                {/* 7. Most Popular Token */}
                <div className="glass-card rounded-xl p-6 border border-pink-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">🏆</span>
                    <div>
                      <div className="text-gray-400 text-sm">Popular Token</div>
                      <div className="text-xs text-gray-600">Most used</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-pink-400">
                    {getMostPopularToken()}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {stats.tokenStats[getMostPopularToken()] || 0} potatoes
                  </div>
                </div>
              </div>

              {/* Token Distribution */}
              <div className="glass-card rounded-xl p-6 border border-indigo-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl">💎</span>
                    <div>
                      <div className="text-lg font-bold text-white">Token Distribution</div>
                      <div className="text-xs text-gray-500">Usage breakdown</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(stats.tokenStats).sort((a, b) => b[1] - a[1]).map(([token, count]) => (
                      <div key={token} className="flex items-center justify-between">
                        <span className="text-gray-300 font-medium">{token}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden" style={{ width: '100px' }}>
                            <div
                              className="h-full bg-gradient-to-r from-toxic to-purple"
                              style={{ width: `${(count / stats.totalCreated) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-500 text-sm w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              {/* Chain Velocity */}
              <div className="max-w-md mx-auto">
                <div className="glass-card rounded-xl p-6 border border-cyan-400/40 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-4xl">🚀</span>
                    <div>
                      <div className="text-gray-400 text-sm">Chain Velocity</div>
                      <div className="text-xs text-gray-600">Claims per day</div>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-cyan-400 mb-3">
                    {stats.chainVelocity}
                  </div>
                  {/* Velocity Meter */}
                  <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse"
                      style={{
                        width: `${Math.min(100, (parseFloat(stats.chainVelocity) / 50) * 100)}%`,
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {stats.chainVelocity > 10 ? '🔥 Hot!' : stats.chainVelocity > 5 ? '📈 Growing' : '🌱 Starting'}
                  </div>
                </div>
              </div>

              {/* 10. Recent Claims Feed */}
              <div className="glass-card rounded-xl p-6 border border-purple/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">📜</span>
                  <div>
                    <div className="text-xl font-bold text-white">Recent Claims</div>
                    <div className="text-xs text-gray-500">Last 10 claimed potatoes</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.recentClaims.length > 0 ? (
                    stats.recentClaims.map((claim, idx) => (
                      <div
                        key={claim.id}
                        className="glass-card rounded-lg p-4 border border-purple/20 hover:border-toxic/50 transition-all animate-fade-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl animate-float">🥔</div>
                            <div>
                              <div className="text-white font-semibold">
                                Potato #{claim.id}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTimeAgo(claim.claimedAt)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400">
                              {parseFloat(claim.amount).toFixed(4)} {claim.token}
                            </div>
                            <div className="text-xs text-gray-500">claimed</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-2">👀</div>
                      <div className="text-sm">No claims yet</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Call to Action */}
              <div className="glass-card rounded-xl p-8 border border-toxic/30 bg-gradient-to-r from-toxic/10 to-purple/10 text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Join?</h3>
                <p className="text-gray-400 mb-6">
                  Create your own Hot Potato and become part of the chain!
                </p>
                <a
                  href="/"
                  className="inline-block bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-toxic/30 transition-all"
                >
                  Create Hot Potato ✨
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Bar */}
      <Sidebar isBottomBar={true} />
    </div>
  )
}
