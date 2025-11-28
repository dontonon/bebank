import { useState, useEffect } from 'react'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import ChainBackground from '../components/ChainBackground'
import CircularProgress from '../components/CircularProgress'
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
    biggestGift: null,
    tokenStats: {},
    avgGiftValue: '0',
    claimsToday: 0,
    // New chain stats
    longestChain: null,
    biggestChain: null,
    activeChains: 0,
    totalChainValue: 0,
    chainLeaderboard: []
  })
  const [isLoading, setIsLoading] = useState(true)

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
        const totalLinks = Number(nextGiftId)

        // Load all links for chain analysis
        const startId = Math.max(1, totalLinks - 100) // Analyze last 100 links
        const linkPromises = []

        for (let i = totalLinks - 1; i >= startId && i >= 1; i--) {
          linkPromises.push(
            publicClient.readContract({
              address: contractAddress,
              abi: CONTRACT_ABI,
              functionName: 'getGift',
              args: [BigInt(i)]
            }).then(data => ({ id: i, ...data }))
          )
        }

        const links = await Promise.all(linkPromises)

        // Calculate basic stats
        let claimed = 0
        let active = 0
        let biggestGift = null
        let tokenCounts = {}
        let totalValue = 0
        let giftCount = 0
        let claimsToday = 0

        const now = Date.now() / 1000
        const today = now - 86400

        // Build chain data structure
        const chains = []
        let currentChain = null

        // Process links in order (oldest to newest)
        const sortedLinks = [...links].sort((a, b) => a.id - b.id)

        sortedLinks.forEach(link => {
          const token = getTokenByAddress(link[0])
          const amount = link[1]
          const isClaimed = link[3]
          const timestamp = Number(link[5])
          const claimedAt = link[6] ? Number(link[6]) : null

          const amountFloat = parseFloat(formatUnits(amount, token.decimals))

          if (isClaimed) {
            claimed++
            if (claimedAt && claimedAt > today) claimsToday++

            // Add to current chain
            if (!currentChain) {
              currentChain = {
                startId: link.id,
                endId: link.id,
                length: 1,
                value: amountFloat,
                token: token.symbol,
                links: [link.id]
              }
            } else {
              currentChain.endId = link.id
              currentChain.length++
              currentChain.value += amountFloat
              currentChain.links.push(link.id)
            }
          } else {
            active++
            // Chain broken, save current chain
            if (currentChain && currentChain.length > 0) {
              chains.push(currentChain)
              currentChain = null
            }
          }

          // Token statistics
          if (!tokenCounts[token.symbol]) tokenCounts[token.symbol] = 0
          tokenCounts[token.symbol]++

          // Biggest gift
          if (!biggestGift || amountFloat > biggestGift.amount) {
            biggestGift = {
              id: link.id,
              token: token.symbol,
              amount: amountFloat,
              timestamp: timestamp
            }
          }

          totalValue += amountFloat
          giftCount++
        })

        // Save final chain if exists
        if (currentChain && currentChain.length > 0) {
          chains.push(currentChain)
        }

        // Find longest and biggest chains
        const longestChain = chains.length > 0
          ? chains.reduce((max, chain) => chain.length > max.length ? chain : max, chains[0])
          : null

        const biggestChain = chains.length > 0
          ? chains.reduce((max, chain) => chain.value > max.value ? chain : max, chains[0])
          : null

        // Calculate total chain value (only claimed gifts)
        const totalChainValue = chains.reduce((sum, chain) => sum + chain.value, 0)

        // Create chain leaderboard (top 5 by length)
        const chainLeaderboard = chains
          .sort((a, b) => b.length - a.length)
          .slice(0, 5)
          .map((chain, idx) => ({
            rank: idx + 1,
            ...chain
          }))

        setStats({
          totalCreated: totalLinks - 1, // Subtract 1 because IDs start at 1
          totalClaimed: claimed,
          activePotatoes: active,
          biggestGift,
          tokenStats: tokenCounts,
          avgGiftValue: (totalValue / giftCount).toFixed(4),
          claimsToday,
          longestChain,
          biggestChain,
          activeChains: chains.filter(c => c.length > 0).length,
          totalChainValue: totalChainValue.toFixed(4),
          chainLeaderboard
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

  const getMostPopularToken = () => {
    if (!stats.tokenStats || Object.keys(stats.tokenStats).length === 0) return 'N/A'
    return Object.entries(stats.tokenStats).sort((a, b) => b[1] - a[1])[0][0]
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col relative overflow-hidden">
      <ChainBackground />
      <Header />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-black gradient-text mb-3">⛓️ The Chain</h1>
            <p className="text-gray-400 text-lg">Watch the chain grow as people pass it on</p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-4 animate-spin inline-block">🔗</div>
              <p className="text-gray-400">Loading chain stats...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Chain Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Claim Rate */}
                <div className="glass-card rounded-xl p-6 border border-purple/30 glow-purple flex items-center justify-center">
                  <CircularProgress
                    percentage={stats.totalCreated > 0 ? Math.round((stats.totalClaimed / stats.totalCreated) * 100) : 0}
                    label="Claim Rate"
                    value={`${stats.totalClaimed}/${stats.totalCreated}`}
                  />
                </div>

                {/* Longest Chain */}
                <div className="glass-card rounded-xl p-6 border border-toxic/30 bg-gradient-to-br from-toxic/10 to-green-500/10">
                  <div className="text-gray-400 text-sm mb-2">🏆 Longest Chain</div>
                  <div className="text-4xl font-black text-toxic">
                    {stats.longestChain ? stats.longestChain.length : 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {stats.longestChain ? `Links #${stats.longestChain.startId}-${stats.longestChain.endId}` : 'No chains yet'}
                  </div>
                </div>

                {/* Active Chains */}
                <div className="glass-card rounded-xl p-6 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                  <div className="text-gray-400 text-sm mb-2">⛓️ Active Chains</div>
                  <div className="text-4xl font-black text-cyan-400">{stats.activeChains}</div>
                  <div className="text-xs text-gray-500 mt-2">Chains in progress</div>
                </div>
              </div>

              {/* Chain Leaderboard */}
              {stats.chainLeaderboard.length > 0 && (
                <div className="glass-card rounded-xl p-6 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl">🏅</span>
                    <div>
                      <div className="text-xl font-bold text-white">Chain Leaderboard</div>
                      <div className="text-xs text-gray-500">Longest unbroken chains</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {stats.chainLeaderboard.map((chain) => (
                      <div
                        key={chain.startId}
                        className="glass-card rounded-lg p-4 border border-yellow-500/20 hover:border-yellow-500/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-black text-yellow-500">
                              #{chain.rank}
                            </div>
                            <div>
                              <div className="text-white font-semibold">
                                {chain.length} Links Passed On
                              </div>
                              <div className="text-xs text-gray-500">
                                Chain #{chain.startId} → #{chain.endId}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-toxic">
                              {chain.value.toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-500">Total Value</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Middle Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Biggest Gift */}
                <div className="glass-card rounded-xl p-6 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">💎</span>
                    <div>
                      <div className="text-gray-400 text-sm">Biggest Gift</div>
                      <div className="text-xs text-gray-600">All-time record</div>
                    </div>
                  </div>
                  {stats.biggestGift ? (
                    <>
                      <div className="text-2xl font-bold text-yellow-500">
                        {stats.biggestGift.amount} {stats.biggestGift.token}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Link #{stats.biggestGift.id}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">No data</div>
                  )}
                </div>

                {/* Average Gift Value */}
                <div className="glass-card rounded-xl p-6 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">📊</span>
                    <div>
                      <div className="text-gray-400 text-sm">Average Value</div>
                      <div className="text-xs text-gray-600">Per gift</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.avgGiftValue}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Mixed tokens</div>
                </div>

                {/* Total Chain Value */}
                <div className="glass-card rounded-xl p-6 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">💰</span>
                    <div>
                      <div className="text-gray-400 text-sm">Chain Value</div>
                      <div className="text-xs text-gray-600">All claimed</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {stats.totalChainValue}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Total passed on</div>
                </div>
              </div>

              {/* Token Distribution */}
              <div className="glass-card rounded-xl p-6 border border-indigo-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">🪙</span>
                  <div>
                    <div className="text-lg font-bold text-white">Token Leaderboard</div>
                    <div className="text-xs text-gray-500">Most passed on</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(stats.tokenStats).sort((a, b) => b[1] - a[1]).map(([token, count], idx) => (
                    <div key={token} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono text-sm w-6">#{idx + 1}</span>
                        <span className="text-gray-300 font-medium">{token}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden" style={{ width: '100px' }}>
                          <div
                            className="h-full bg-gradient-to-r from-toxic to-purple"
                            style={{ width: `${(count / stats.totalCreated) * 100}%` }}
                          />
                        </div>
                        <span className="text-toxic font-semibold text-sm w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="glass-card rounded-xl p-8 border border-toxic/30 bg-gradient-to-r from-toxic/10 to-purple/10 text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-2">Join The Chain</h3>
                <p className="text-gray-400 mb-6">
                  Create your link and help build the longest chain!
                </p>
                <a
                  href="/"
                  className="inline-block bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-toxic/30 transition-all"
                >
                  Pass It On ✨
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <Sidebar isBottomBar={true} />
    </div>
  )
}
