import { useState, useEffect, useRef, useMemo } from 'react'
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

// Create fallback client ONCE outside component
const fallbackClient = createPublicClient({
  chain: base,
  transport: http()
})

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
      { indexed: false, name: 'amountReceived', type: 'uint256' },
      { indexed: false, name: 'tokenGiven', type: 'address' },
      { indexed: false, name: 'amountGiven', type: 'uint256' }
    ]
  }
]

export default function Stats() {
  console.log('🚀 Stats component rendering')

  const { chain } = useAccount()
  const connectedPublicClient = usePublicClient()

  console.log('🔌 Wallet connected:', !!chain)
  console.log('🔌 Chain:', chain?.name || 'Not connected', 'ID:', chain?.id || 'N/A')

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
    recentLinks: [],
    // NEW: Actual parent-child relationships
    chainMap: {} // Maps oldGiftId -> newGiftId
  })
  const [isLoading, setIsLoading] = useState(true)

  // Use Base mainnet by default if not connected
  const activeChain = chain || base
  const publicClient = connectedPublicClient || fallbackClient

  console.log('⚙️ Active chain:', activeChain?.name, 'ID:', activeChain?.id)
  console.log('⚙️ Contract:', getContractAddress(activeChain?.id))
  console.log('⚙️ PublicClient exists:', !!publicClient)

  const { data: nextGiftId, isError, error } = useReadContract({
    address: getContractAddress(activeChain.id),
    abi: CONTRACT_ABI,
    functionName: 'nextGiftId',
    chainId: activeChain.id
  })

  console.log('📖 Contract Read:', {
    nextGiftId: nextGiftId?.toString(),
    isError,
    errorMessage: error?.message
  })

  useEffect(() => {
    async function loadStats() {
      console.log('📊 loadStats called')
      console.log('  publicClient:', !!publicClient)
      console.log('  nextGiftId:', nextGiftId?.toString())
      console.log('  activeChain.id:', activeChain?.id)

      if (!publicClient || !nextGiftId) {
        console.log('⚠️ Missing publicClient or nextGiftId, stopping')
        setIsLoading(false)
        return
      }

      try {
        const contractAddress = getContractAddress(activeChain.id)
        const totalLinks = Number(nextGiftId)

        console.log('📍 Contract address:', contractAddress)
        console.log('📍 Total links:', totalLinks)
        console.log('📍 nextGiftId value:', nextGiftId?.toString())

        if (totalLinks <= 1) {
          console.log('⚠️ No links created yet (nextGiftId <= 1)')
          setStats({
            totalCreated: 0,
            totalClaimed: 0,
            activePotatoes: 0,
            biggestLink: null,
            tokenStats: {},
            avgValue: '0',
            claimsToday: 0,
            longestChain: null,
            biggestChain: null,
            activeChains: 0,
            totalChainValue: 0,
            chainLeaderboard: [],
            recentLinks: [],
            chainMap: {}
          })
          setIsLoading(false)
          return
        }

        // Load links for analysis - get ALL links, not just last 100
        const lastLinkId = totalLinks - 1
        const startId = 1 // Start from link #1 to show everything

        console.log('📊 Scanning ALL links from', startId, 'to', lastLinkId, '(inclusive)')
        console.log('📊 Total links to scan:', lastLinkId - startId + 1)
        console.log('========================================================')

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

        // Fetch GiftClaimed events to build actual chain relationships
        console.log('📡 Fetching GiftClaimed events to build chain map...')
        let chainMap = {}
        try {
          const logs = await publicClient.getLogs({
            address: contractAddress,
            event: CONTRACT_ABI.find(item => item.name === 'GiftClaimed'),
            fromBlock: 'earliest',
            toBlock: 'latest'
          })

          console.log(`📋 Found ${logs.length} GiftClaimed events`)

          // Build parent→child map
          logs.forEach(log => {
            const oldGiftId = Number(log.args.oldGiftId)
            const newGiftId = Number(log.args.newGiftId)
            chainMap[oldGiftId] = newGiftId
            console.log(`  Chain link: #${oldGiftId} → #${newGiftId}`)
          })

          console.log('✅ Chain map built:', Object.keys(chainMap).length, 'links')
        } catch (error) {
          console.error('❌ Error fetching GiftClaimed events:', error)
          // Continue without chain map
        }

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

        // Get recent links for visualization - show up to 50 for better visibility
        const recentLinks = links.slice(0, 50)

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
          recentLinks,
          chainMap // NEW: Parent-child relationship map
        })
        setIsLoading(false)
        console.log('✅ Stats loaded successfully:', {
          totalCreated: totalLinks - 1,
          totalClaimed: claimed,
          recentLinksCount: recentLinks.length
        })
      } catch (error) {
        console.error('❌ Error loading stats:', error)
        setIsLoading(false)
      }
    }

    loadStats()
  }, [activeChain, publicClient, nextGiftId])

  // Draw chain visualization with parent-child relationships
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
    const spacing = Math.min(180, width / (links.length + 1))
    const centerY = height / 2

    // Create position map for quick lookup
    const positions = {}
    links.forEach((link, index) => {
      positions[link.id] = {
        x: spacing * (index + 1),
        y: centerY + Math.sin(index * 0.5) * 60,
        index
      }
    })

    // Draw connections based on actual chain relationships
    links.forEach((link) => {
      const childId = stats.chainMap[link.id]
      if (childId && positions[childId]) {
        const fromPos = positions[link.id]
        const toPos = positions[childId]

        // Draw glowing arrow from this link to its child
        ctx.shadowBlur = 10
        ctx.shadowColor = '#00FF88'

        ctx.beginPath()
        ctx.moveTo(fromPos.x + 25, fromPos.y)
        ctx.lineTo(toPos.x - 25, toPos.y)
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)'
        ctx.lineWidth = 4
        ctx.stroke()

        // Draw larger arrowhead
        const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x)
        ctx.beginPath()
        ctx.moveTo(toPos.x - 25, toPos.y)
        ctx.lineTo(toPos.x - 35 * Math.cos(angle - Math.PI / 6), toPos.y - 35 * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(toPos.x - 35 * Math.cos(angle + Math.PI / 6), toPos.y - 35 * Math.sin(angle + Math.PI / 6))
        ctx.closePath()
        ctx.fillStyle = '#00FF88'
        ctx.fill()

        ctx.shadowBlur = 0
      }
    })

    // Draw nodes on top with glow effects
    links.forEach((link, index) => {
      const x = spacing * (index + 1)
      const y = centerY + Math.sin(index * 0.5) * 60
      const radius = 25
      const isHighlight = stats.chainMap[link.id] // Has a child (part of chain)

      // Outer glow
      if (link.claimed) {
        ctx.shadowBlur = 15
        ctx.shadowColor = '#00FF88'
      } else if (isHighlight) {
        ctx.shadowBlur = 15
        ctx.shadowColor = '#9D4EDD'
      }

      // Draw node
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)

      // Gradient fill
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      if (link.claimed) {
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.6)')
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0.2)')
      } else {
        gradient.addColorStop(0, 'rgba(157, 78, 221, 0.6)')
        gradient.addColorStop(1, 'rgba(157, 78, 221, 0.2)')
      }
      ctx.fillStyle = gradient
      ctx.fill()

      // Border
      ctx.strokeStyle = link.claimed ? '#00FF88' : '#9D4EDD'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.shadowBlur = 0

      // Link ID text
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`#${link.id}`, x, y + 45)

      // Status emoji
      ctx.font = '16px sans-serif'
      ctx.fillText(link.claimed ? '✅' : '⏳', x, y + 5)
    })
  }, [stats.recentLinks, stats.chainMap])

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
          ) : isError ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-4">⚠️</div>
              <h2 className="text-3xl font-bold text-white mb-4">Error Loading Chain Data</h2>
              <p className="text-gray-400 mb-4">{error?.message || 'Failed to load contract data'}</p>
              <div className="bg-dark-card rounded-xl p-4 mb-6 max-w-2xl mx-auto text-left">
                <div className="text-sm text-gray-400 space-y-2">
                  <div><span className="text-toxic">Chain:</span> {activeChain?.name} (ID: {activeChain?.id})</div>
                  <div><span className="text-toxic">Contract:</span> <code className="text-xs">{getContractAddress(activeChain?.id)}</code></div>
                  <div><span className="text-toxic">Next Gift ID:</span> {nextGiftId?.toString() || 'undefined'}</div>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Make sure you're connected to Base network and the contract is deployed.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Retry
              </button>
            </div>
          ) : stats.totalCreated === 0 ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-4">🔗</div>
              <h2 className="text-3xl font-bold text-white mb-4">No Chains Yet!</h2>
              <p className="text-gray-400 mb-4">Be the first to start the chain by creating a link</p>
              <div className="bg-dark-card rounded-xl p-4 mb-6 max-w-2xl mx-auto text-left">
                <div className="text-sm text-gray-400 space-y-2">
                  <div><span className="text-toxic">Chain:</span> {activeChain?.name} (ID: {activeChain?.id})</div>
                  <div><span className="text-toxic">Contract:</span> <code className="text-xs">{getContractAddress(activeChain?.id)}</code></div>
                  <div><span className="text-toxic">Next Gift ID:</span> {nextGiftId?.toString() || 'undefined'}</div>
                  <div><span className="text-toxic">Total Links:</span> {nextGiftId ? Number(nextGiftId) - 1 : 0}</div>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Create First Link
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Chain Visualization */}
              <div className="glass-card rounded-xl p-6 border-2 border-toxic/50 overflow-x-auto glow-toxic">
                <div className="mb-6 text-center">
                  <h3 className="text-3xl font-black text-white mb-3 flex items-center justify-center gap-3">
                    <span className="text-4xl animate-pulse">🔗</span>
                    <span className="gradient-text">Live Chain Flow</span>
                    <span className="text-4xl animate-pulse">🔗</span>
                  </h3>
                  <p className="text-lg text-gray-300 font-semibold mb-2">
                    Latest {stats.recentLinks.length} links showing actual parent→child relationships!
                  </p>
                  <p className="text-sm text-toxic">
                    Arrows show which link was created when another was claimed 🎯
                  </p>
                </div>
                <canvas
                  ref={canvasRef}
                  className="w-full cursor-pointer"
                  style={{ height: '350px' }}
                />
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-purple/20 rounded-lg p-3 border border-purple/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-purple border-2 border-purple"></div>
                      <span className="text-white font-bold">Active Link</span>
                    </div>
                    <span className="text-xs text-gray-400">⏳ Waiting for someone to claim</span>
                  </div>
                  <div className="bg-toxic/20 rounded-lg p-3 border border-toxic/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-toxic border-2 border-toxic"></div>
                      <span className="text-white font-bold">Claimed Link</span>
                    </div>
                    <span className="text-xs text-gray-400">✅ Coin drop claimed & chain continues!</span>
                  </div>
                </div>
                <div className="mt-4 bg-gradient-to-r from-toxic/10 to-purple/10 rounded-lg p-4 border border-toxic/30">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <span className="text-2xl">→</span>
                    <span className="font-bold">Green arrows</span>
                    <span className="text-gray-400">show the actual chain flow (Link #5 was claimed → created Link #12)</span>
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
                <div className="glass-card rounded-xl p-6 border-2 border-yellow-500/50 glow-yellow bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <span className="text-5xl animate-bounce">🏆</span>
                    <div className="text-center">
                      <div className="text-3xl font-black gradient-text mb-1">Chain Champions!</div>
                      <div className="text-sm text-gray-300">Longest unbroken chains - keep it going!</div>
                    </div>
                    <span className="text-5xl animate-bounce">🏆</span>
                  </div>
                  <div className="space-y-4">
                    {stats.chainLeaderboard.map((chain, idx) => (
                      <div
                        key={chain.startId}
                        className={`glass-card rounded-xl p-5 border-2 transition-all transform hover:scale-105 cursor-pointer ${
                          idx === 0
                            ? 'border-yellow-500 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 glow-yellow'
                            : idx === 1
                            ? 'border-gray-400/50 bg-gradient-to-r from-gray-400/10 to-gray-500/10'
                            : idx === 2
                            ? 'border-orange-700/50 bg-gradient-to-r from-orange-700/10 to-orange-800/10'
                            : 'border-yellow-500/20 hover:border-yellow-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`text-4xl font-black ${
                              idx === 0 ? 'text-yellow-500 animate-pulse' :
                              idx === 1 ? 'text-gray-400' :
                              idx === 2 ? 'text-orange-700' :
                              'text-yellow-600'
                            }`}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${chain.rank}`}
                            </div>
                            <div>
                              <div className="text-white font-bold text-lg flex items-center gap-2">
                                <span className="text-2xl">⛓️</span>
                                {chain.length} Coin Drops Passed On!
                                {idx === 0 && <span className="text-yellow-500 animate-pulse">👑</span>}
                              </div>
                              <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                                <span>Links:</span>
                                <span className="font-mono text-toxic">#{chain.startId} → #{chain.endId}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-toxic">
                              {chain.value.toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-400">Total Value</div>
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
                  <p className="text-sm text-gray-400">Latest coin drops in the chain</p>
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
                            Claimed: {formatTimeAgo(link.claimedAt)}
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
                      <div className="text-xs text-gray-600">Largest coin drop</div>
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
                      <div className="text-xs text-gray-600">Total coin drops</div>
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
                    <div className="text-xs text-gray-500">Most popular coins</div>
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
                    <span className="text-toxic">✅ Claimed</span>
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
                  <div className="text-sm text-gray-400 mb-1">Claimed by</div>
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
                  <div className="text-sm text-gray-400 mb-1">Claimed</div>
                  <div className="text-sm text-toxic">
                    {formatTimeAgo(selectedLink.claimedAt)}
                  </div>
                </div>
              )}

              {/* Show chain relationship */}
              {stats.chainMap && stats.chainMap[selectedLink.id] && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">⛓️ Chain Link</div>
                  <div className="text-sm text-white bg-purple/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-bold">Link #{selectedLink.id}</span>
                      <span className="text-toxic">→</span>
                      <span className="font-bold text-toxic">Link #{stats.chainMap[selectedLink.id]}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-center">
                      Claiming this created Link #{stats.chainMap[selectedLink.id]}
                    </div>
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
