import { useState, useEffect, useRef } from 'react'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import { base } from 'wagmi/chains'
import { createPublicClient, http } from 'viem'
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
  const connectedPublicClient = usePublicClient()
  const canvasRef = useRef(null)
  const [selectedLink, setSelectedLink] = useState(null)
  const [stats, setStats] = useState({
    totalCreated: 0,
    totalClaimed: 0,
    activePotatoes: 0,
    biggestLink: null,
    tokenStats: {},
    avgValue: '0',
    claimsToday: 0,
    // Chain stats
    longestChain: null,
    biggestChain: null,
    activeChains: 0,
    totalChainValue: 0,
    chainLeaderboard: [],
    recentLinks: []
  })
  const [isLoading, setIsLoading] = useState(true)

  // Use Base mainnet by default if not connected
  const activeChain = chain || base
  const publicClient = connectedPublicClient || createPublicClient({
    chain: base,
    transport: http()
  })

  const { data: nextGiftId } = useReadContract({
    address: getContractAddress(activeChain.id),
    abi: CONTRACT_ABI,
    functionName: 'nextGiftId',
    chainId: activeChain.id
  })

  useEffect(() => {
    async function loadStats() {
      if (!publicClient || !nextGiftId) {
        setIsLoading(false)
        return
      }

      try {
        const contractAddress = getContractAddress(activeChain.id)
        const totalLinks = Number(nextGiftId)

        // Load links for analysis
        const startId = Math.max(1, totalLinks - 100)
        const linkPromises = []

        for (let i = totalLinks - 1; i >= startId && i >= 1; i--) {
          linkPromises.push(
            publicClient.readContract({
              address: contractAddress,
              abi: CONTRACT_ABI,
              functionName: 'getGift',
              args: [BigInt(i)]
            }).then(data => ({
              id: i,
              token: getTokenByAddress(data[0]),
              amount: formatUnits(data[1], getTokenByAddress(data[0]).decimals),
              giver: data[2],
              claimed: data[3],
              claimer: data[4],
              timestamp: Number(data[5]),
              claimedAt: data[6] ? Number(data[6]) : null
            }))
          )
        }

        const links = await Promise.all(linkPromises)

        // Calculate stats
        let claimed = 0
        let active = 0
        let biggestLink = null
        let tokenCounts = {}
        let totalValue = 0
        let linkCount = 0
        let claimsToday = 0

        const now = Date.now() / 1000
        const today = now - 86400

        // Build chains
        const chains = []
        let currentChain = null

        const sortedLinks = [...links].sort((a, b) => a.id - b.id)

        sortedLinks.forEach(link => {
          const amountFloat = parseFloat(link.amount)

          if (link.claimed) {
            claimed++
            if (link.claimedAt && link.claimedAt > today) claimsToday++

            if (!currentChain) {
              currentChain = {
                startId: link.id,
                endId: link.id,
                length: 1,
                value: amountFloat,
                token: link.token.symbol,
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
            if (currentChain && currentChain.length > 0) {
              chains.push(currentChain)
              currentChain = null
            }
          }

          if (!tokenCounts[link.token.symbol]) tokenCounts[link.token.symbol] = 0
          tokenCounts[link.token.symbol]++

          if (!biggestLink || amountFloat > biggestLink.amount) {
            biggestLink = {
              id: link.id,
              token: link.token.symbol,
              amount: amountFloat,
              timestamp: link.timestamp
            }
          }

          totalValue += amountFloat
          linkCount++
        })

        if (currentChain && currentChain.length > 0) {
          chains.push(currentChain)
        }

        const longestChain = chains.length > 0
          ? chains.reduce((max, chain) => chain.length > max.length ? chain : max, chains[0])
          : null

        const biggestChain = chains.length > 0
          ? chains.reduce((max, chain) => chain.value > max.value ? chain : max, chains[0])
          : null

        const totalChainValue = chains.reduce((sum, chain) => sum + chain.value, 0)

        const chainLeaderboard = chains
          .sort((a, b) => b.length - a.length)
          .slice(0, 5)
          .map((chain, idx) => ({
            rank: idx + 1,
            ...chain
          }))

        // Get recent links for visualization (last 30)
        const recentLinks = links.slice(0, 30)

        setStats({
          totalCreated: totalLinks - 1,
          totalClaimed: claimed,
          activePotatoes: active,
          biggestLink,
          tokenStats: tokenCounts,
          avgValue: (totalValue / linkCount).toFixed(4),
          claimsToday,
          longestChain,
          biggestChain,
          activeChains: chains.filter(c => c.length > 0).length,
          totalChainValue: totalChainValue.toFixed(4),
          chainLeaderboard,
          recentLinks
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading stats:', error)
        setIsLoading(false)
      }
    }

    loadStats()
  }, [activeChain, publicClient, nextGiftId])

  // Draw chain visualization
  useEffect(() => {
    if (!stats.recentLinks.length || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)

    const links = stats.recentLinks
    const spacing = Math.min(150, width / (links.length + 1))
    const centerY = height / 2

    links.forEach((link, index) => {
      const x = spacing * (index + 1)
      const y = centerY + Math.sin(index * 0.5) * 50
      const radius = 20

      if (index > 0) {
        const prevX = spacing * index
        const prevY = centerY + Math.sin((index - 1) * 0.5) * 50

        ctx.beginPath()
        ctx.moveTo(prevX + radius, prevY)
        ctx.lineTo(x - radius, y)
        ctx.strokeStyle = link.claimed ? 'rgba(0, 255, 136, 0.5)' : 'rgba(157, 78, 221, 0.3)'
        ctx.lineWidth = 3
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = link.claimed
        ? 'rgba(0, 255, 136, 0.3)'
        : 'rgba(157, 78, 221, 0.3)'
      ctx.fill()
      ctx.strokeStyle = link.claimed ? '#00FF88' : '#9D4EDD'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`#${link.id}`, x, y + 40)
    })
  }, [stats.recentLinks])

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col relative overflow-hidden">
      <ChainBackground />
      <Header />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
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
              {/* Chain Visualization */}
              <div className="glass-card rounded-xl p-6 border border-toxic/30 overflow-x-auto">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">Live Chain Flow</h3>
                  <p className="text-sm text-gray-400">Latest {stats.recentLinks.length} links in the chain</p>
                </div>
                <canvas
                  ref={canvasRef}
                  className="w-full"
                  style={{ height: '300px' }}
                />
                <div className="mt-4 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple"></div>
                    <span className="text-gray-400">Waiting to be passed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-toxic"></div>
                    <span className="text-gray-400">Passed on ✅</span>
                  </div>
                </div>
              </div>

              {/* Top Chain Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-6 border border-purple/30 glow-purple flex items-center justify-center">
                  <CircularProgress
                    percentage={stats.totalCreated > 0 ? Math.round((stats.totalClaimed / stats.totalCreated) * 100) : 0}
                    label="Pass On Rate"
                    value={`${stats.totalClaimed}/${stats.totalCreated}`}
                  />
                </div>

                <div className="glass-card rounded-xl p-6 border border-toxic/30 bg-gradient-to-br from-toxic/10 to-green-500/10">
                  <div className="text-gray-400 text-sm mb-2">🏆 Longest Chain</div>
                  <div className="text-4xl font-black text-toxic">
                    {stats.longestChain ? stats.longestChain.length : 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {stats.longestChain ? `Links #${stats.longestChain.startId}-${stats.longestChain.endId}` : 'No chains yet'}
                  </div>
                </div>

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
                      <div className="text-xs text-gray-500">Longest unbroken chains - keep it going!</div>
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

              {/* Recent Links Grid */}
              <div className="glass-card rounded-xl p-6 border border-purple/30">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">Recent Chain Activity</h3>
                  <p className="text-sm text-gray-400">Latest links being passed on</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.recentLinks.slice(0, 12).map((link) => (
                    <div
                      key={link.id}
                      onClick={() => setSelectedLink(link)}
                      className={`glass-card rounded-xl p-4 border cursor-pointer transition-all hover:scale-105 ${
                        link.claimed
                          ? 'border-toxic/30 hover:border-toxic'
                          : 'border-purple/30 hover:border-purple'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl">
                          {link.claimed ? '✅' : '⏳'}
                        </div>
                        <div className="text-sm font-mono text-gray-500">
                          #{link.id}
                        </div>
                      </div>

                      <div className="text-xl font-bold gradient-text mb-2">
                        {parseFloat(link.amount).toFixed(4)} {link.token.symbol}
                      </div>

                      <div className="space-y-1 text-xs text-gray-400">
                        <div>Created: {formatTimeAgo(link.timestamp)}</div>
                        {link.claimed && link.claimedAt && (
                          <div className="text-toxic">
                            Passed on: {formatTimeAgo(link.claimedAt)}
                          </div>
                        )}
                      </div>

                      {link.claimed ? (
                        <div className="mt-3 px-3 py-1 rounded-full bg-toxic/20 text-toxic text-xs font-semibold inline-block">
                          🔗 Chain Continues
                        </div>
                      ) : (
                        <div className="mt-3 px-3 py-1 rounded-full bg-purple/20 text-purple text-xs font-semibold inline-block">
                          ⏳ Waiting
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Value Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-6 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">💎</span>
                    <div>
                      <div className="text-gray-400 text-sm">Biggest Amount</div>
                      <div className="text-xs text-gray-600">Largest passed on</div>
                    </div>
                  </div>
                  {stats.biggestLink ? (
                    <>
                      <div className="text-2xl font-bold text-yellow-500">
                        {stats.biggestLink.amount} {stats.biggestLink.token}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Link #{stats.biggestLink.id}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">No data</div>
                  )}
                </div>

                <div className="glass-card rounded-xl p-6 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">📊</span>
                    <div>
                      <div className="text-gray-400 text-sm">Average Value</div>
                      <div className="text-xs text-gray-600">Per link</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.avgValue}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Mixed tokens</div>
                </div>

                <div className="glass-card rounded-xl p-6 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">💰</span>
                    <div>
                      <div className="text-gray-400 text-sm">Chain Value</div>
                      <div className="text-xs text-gray-600">Total passed on</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {stats.totalChainValue}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">All claimed links</div>
                </div>
              </div>

              {/* Token Leaderboard */}
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

              {/* CTA */}
              <div className="glass-card rounded-xl p-8 border border-toxic/30 bg-gradient-to-r from-toxic/10 to-purple/10 text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-2">Keep The Chain Alive</h3>
                <p className="text-gray-400 mb-6">
                  Pass on a link and help build the longest chain ever!
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

      {/* Link Detail Modal */}
      {selectedLink && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLink(null)}
        >
          <div
            className="glass-card rounded-2xl p-8 max-w-md w-full border-2 border-toxic"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold gradient-text">
                Link #{selectedLink.id}
              </h3>
              <button
                onClick={() => setSelectedLink(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Amount</div>
                <div className="text-3xl font-bold gradient-text">
                  {parseFloat(selectedLink.amount).toFixed(4)} {selectedLink.token.symbol}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <div className="text-lg font-semibold">
                  {selectedLink.claimed ? (
                    <span className="text-toxic">✅ Passed On</span>
                  ) : (
                    <span className="text-purple">⏳ Waiting</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Creator</div>
                <div className="text-sm font-mono text-gray-300 break-all">
                  {selectedLink.giver}
                </div>
              </div>

              {selectedLink.claimed && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Passed to</div>
                  <div className="text-sm font-mono text-gray-300 break-all">
                    {selectedLink.claimer}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm text-gray-400 mb-1">Created</div>
                <div className="text-sm text-gray-300">
                  {formatTimeAgo(selectedLink.timestamp)}
                </div>
              </div>

              {selectedLink.claimed && selectedLink.claimedAt && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Passed On</div>
                  <div className="text-sm text-toxic">
                    {formatTimeAgo(selectedLink.claimedAt)}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLink(null)}
              className="mt-6 w-full bg-gradient-to-r from-toxic to-purple text-dark py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Sidebar isBottomBar={true} />
    </div>
  )
}
