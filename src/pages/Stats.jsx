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
  const [animationFrame, setAnimationFrame] = useState(0)
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
        const errorMessages = [] // Collect ALL error messages

        for (let i = totalLinks - 1; i >= startId && i >= 1; i--) {
          linkPromises.push(
            publicClient.readContract({
              address: contractAddress,
              abi: CONTRACT_ABI,
              functionName: 'getGift',
              args: [BigInt(i)]
            }).then(data => {
              // Validate contract data exists
              if (!data) {
                const msg = `Link #${i}: No data returned`
                console.error(`❌ ${msg}`)
                errorMessages.push(msg)
                return null
              }

              // Viem returns tuple as both array and object - handle both!
              const tokenAddr = data[0] || data.token
              const amountRaw = data[1] || data.amount
              const giver = data[2] || data.giver
              const claimed = data[3] !== undefined ? data[3] : data.claimed
              const claimer = data[4] || data.claimer
              const timestamp = data[5] || data.timestamp
              const claimedAt = data[6] || data.claimedAt

              if (!tokenAddr || amountRaw === undefined || amountRaw === null) {
                const msg = `Link #${i}: Missing token or amount`
                console.error(`❌ ${msg}`, { tokenAddr, amountRaw, data })
                errorMessages.push(msg)
                return null
              }

              let token = getTokenByAddress(tokenAddr)

              // Fallback for unknown tokens - assume 18 decimals
              if (!token) {
                console.warn(`⚠️ Unknown token address for link #${i}:`, tokenAddr, '- using fallback')
                token = {
                  symbol: 'Unknown',
                  name: 'Unknown Token',
                  address: tokenAddr,
                  decimals: 18,
                  logo: '❓',
                  color: '#999999'
                }
              }

              const amount = formatUnits(amountRaw, token.decimals)
              console.log(`[Link #${i}] Token: ${token.symbol}, Amount: ${amount}, Claimed: ${claimed}`)

              return {
                id: i,
                token: token,
                amount: amount,
                giver: giver,
                claimed: claimed,
                claimer: claimer,
                timestamp: Number(timestamp),
                claimedAt: claimedAt ? Number(claimedAt) : null
              }
            }).catch(err => {
              const msg = `Link #${i}: ${err.message || err.toString()}`
              console.error(`❌ ${msg}`)
              errorMessages.push(msg)
              return null
            })
          )
        }

        console.log(`⏳ Waiting for ${linkPromises.length} link reads...`)
        const allLinks = await Promise.all(linkPromises)
        const links = allLinks.filter(link => link !== null)
        const failedCount = allLinks.filter(link => link === null).length
        console.log(`✅ Successfully loaded ${links.length} links`)
        console.log(`❌ Failed to load ${failedCount} links`)

        if (links.length === 0 && linkPromises.length > 0) {
          const firstErr = errorMessages[0] || 'Unknown error'
          const errorMsg = `All ${linkPromises.length} link reads failed. First error: ${firstErr}`
          console.error('🚨 CRITICAL:', errorMsg)
          console.log('All errors:', errorMessages.slice(0, 5)) // Show first 5
          console.log('Debug info:', {
            contractAddress,
            chainId: activeChain.id,
            publicClientType: connectedPublicClient ? 'connected' : 'fallback',
            totalPromises: linkPromises.length
          })
        } else if (errorMessages.length > 0) {
          console.warn(`⚠️ ${errorMessages.length} link(s) failed to load, but ${links.length} succeeded`)
        }

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

        const finalStats = {
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
        }

        console.log('✅ Stats loaded successfully!')
        console.log('  📊 Total Created:', finalStats.totalCreated)
        console.log('  ✅ Total Claimed:', finalStats.totalClaimed)
        console.log('  ⏳ Active:', finalStats.activePotatoes)
        console.log('  🔗 Recent Links:', finalStats.recentLinks.length)
        console.log('  ⛓️ Chain Map Size:', Object.keys(finalStats.chainMap).length)
        console.log('  🏆 Chains Found:', chains.length)

        setStats(finalStats)
        setIsLoading(false)
      } catch (error) {
        console.error('❌ Error loading stats:', error)
        setIsLoading(false)
      }
    }

    loadStats()
  }, [activeChain, publicClient, nextGiftId])

  // Animation loop - trigger canvas redraw continuously
  useEffect(() => {
    if (!stats.recentLinks.length) return

    const animate = () => {
      setAnimationFrame(f => f + 1)
      return requestAnimationFrame(animate)
    }

    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [stats.recentLinks.length])

  // EPIC Chain Visualization - Build actual chain paths
  useEffect(() => {
    if (!stats.recentLinks.length || !canvasRef.current) {
      console.log('⚠️ Canvas render skipped:', {
        hasLinks: !!stats.recentLinks.length,
        hasCanvas: !!canvasRef.current,
        linksCount: stats.recentLinks.length
      })
      return
    }

    console.log('🎨 Rendering canvas with', stats.recentLinks.length, 'links')

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width
    canvas.height = height

    console.log('📐 Canvas size:', width, 'x', height)

    // Build reverse map (child -> parent) to trace chains
    const reverseMap = {}
    Object.entries(stats.chainMap).forEach(([parent, child]) => {
      reverseMap[child] = parseInt(parent)
    })

    // Find chain roots (links that were claimed but aren't children of anything)
    const allLinkIds = new Set(stats.recentLinks.map(l => l.id))
    const linkMap = {}
    stats.recentLinks.forEach(l => linkMap[l.id] = l)

    // Build actual chain structures
    const chains = []
    const processed = new Set()

    stats.recentLinks.forEach(link => {
      if (processed.has(link.id)) return

      // Find the root of this chain
      let current = link.id
      let chainPath = [current]

      // Trace backwards to root
      while (reverseMap[current] && allLinkIds.has(reverseMap[current])) {
        current = reverseMap[current]
        chainPath.unshift(current)
      }

      // Trace forwards to end
      current = chainPath[chainPath.length - 1]
      while (stats.chainMap[current] && allLinkIds.has(stats.chainMap[current])) {
        current = stats.chainMap[current]
        chainPath.push(current)
      }

      // Mark all as processed
      chainPath.forEach(id => processed.add(id))

      if (chainPath.length > 0) {
        chains.push(chainPath.map(id => linkMap[id]).filter(Boolean))
      }
    })

    // Sort chains by length (longest first)
    chains.sort((a, b) => b.length - a.length)

    console.log(`⛓️ Built ${chains.length} chains:`)
    chains.forEach((chain, idx) => {
      console.log(`  Chain ${idx + 1}: ${chain.length} links [${chain.map(l => '#' + l.id).join(' → ')}]`)
    })

    ctx.clearRect(0, 0, width, height)

    // Draw each chain with unique color and vertical spacing
    const chainSpacing = Math.min(120, height / (chains.length + 1))
    const colors = [
      { main: '#00FF88', glow: '#00FF88', name: 'Toxic Green' },
      { main: '#9D4EDD', glow: '#9D4EDD', name: 'Purple' },
      { main: '#FF006E', glow: '#FF006E', name: 'Hot Pink' },
      { main: '#00B4D8', glow: '#00B4D8', name: 'Cyan' },
      { main: '#FFD60A', glow: '#FFD60A', name: 'Gold' },
      { main: '#FF5400', glow: '#FF5400', name: 'Orange' }
    ]

    chains.forEach((chain, chainIndex) => {
      const y = chainSpacing * (chainIndex + 1)
      const color = colors[chainIndex % colors.length]
      const nodeSpacing = Math.min(140, (width - 100) / (chain.length + 1))

      // Draw connecting lines with glow
      for (let i = 0; i < chain.length - 1; i++) {
        const x1 = 50 + nodeSpacing * (i + 1)
        const x2 = 50 + nodeSpacing * (i + 2)

        // Curved path
        ctx.shadowBlur = 15
        ctx.shadowColor = color.glow
        ctx.beginPath()
        ctx.moveTo(x1 + 30, y)

        const ctrlX = (x1 + x2) / 2
        const ctrlY = y - 30
        ctx.quadraticCurveTo(ctrlX, ctrlY, x2 - 30, y)

        ctx.strokeStyle = color.main
        ctx.lineWidth = 5
        ctx.stroke()

        // Animated particles flowing along the curve
        const t = (Date.now() / 2000 + i * 0.3) % 1
        const particleX = (1-t)*(1-t)*x1 + 2*(1-t)*t*ctrlX + t*t*x2
        const particleY = (1-t)*(1-t)*y + 2*(1-t)*t*ctrlY + t*t*y

        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.arc(particleX, particleY, 4, 0, Math.PI * 2)
        ctx.fillStyle = color.main
        ctx.fill()

        // Arrowhead
        const angle = Math.atan2(y - ctrlY, x2 - ctrlX)
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.moveTo(x2 - 30, y)
        ctx.lineTo(x2 - 40, y - 8)
        ctx.lineTo(x2 - 40, y + 8)
        ctx.closePath()
        ctx.fillStyle = color.main
        ctx.fill()
      }

      ctx.shadowBlur = 0

      // Draw nodes
      chain.forEach((link, index) => {
        const x = 50 + nodeSpacing * (index + 1)
        const radius = 30
        const pulse = Math.sin(Date.now() / 500 + index) * 3

        // Mega glow for claimed links
        if (link.claimed) {
          ctx.shadowBlur = 25 + pulse
          ctx.shadowColor = color.glow
        }

        // Draw node with gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)

        const gradient = ctx.createRadialGradient(x - 8, y - 8, 0, x, y, radius)
        if (link.claimed) {
          gradient.addColorStop(0, color.main + 'EE')
          gradient.addColorStop(0.6, color.main + '99')
          gradient.addColorStop(1, color.main + '33')
        } else {
          gradient.addColorStop(0, '#555')
          gradient.addColorStop(1, '#222')
        }
        ctx.fillStyle = gradient
        ctx.fill()

        // Border ring with double stroke
        ctx.shadowBlur = 0
        ctx.strokeStyle = color.main
        ctx.lineWidth = 4
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2)
        ctx.strokeStyle = color.main + '44'
        ctx.lineWidth = 2
        ctx.stroke()

        // Link ID
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 13px monospace'
        ctx.textAlign = 'center'
        ctx.shadowBlur = 3
        ctx.shadowColor = '#000'
        ctx.fillText(`#${link.id}`, x, y + 50)

        // Amount
        ctx.font = 'bold 10px sans-serif'
        ctx.fillStyle = color.main
        ctx.fillText(`${parseFloat(link.amount).toFixed(2)}`, x, y + 4)

        ctx.shadowBlur = 0
      })

      // Chain label
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`⛓️ ${chain.length} links`, 10, y + 5)
    })
  }, [stats.recentLinks, stats.chainMap, animationFrame])

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

          {isLoading || !nextGiftId ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-4 animate-spin inline-block">🔗</div>
              <p className="text-gray-400">Loading the chain...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Chain Visualization */}
              <div className="glass-card rounded-xl p-6 border-2 border-toxic/50 overflow-x-auto glow-toxic">
                <div className="mb-6 text-center">
                  <h3 className="text-3xl font-black text-white mb-3 flex items-center justify-center gap-3">
                    <span className="text-4xl">🌊</span>
                    <span className="gradient-text">The Chain Never Ends</span>
                    <span className="text-4xl">⚡</span>
                  </h3>
                  <p className="text-lg text-gray-300 font-semibold mb-2">
                    {stats.recentLinks.length} coin drops flowing through the chain!
                  </p>
                  <p className="text-sm text-toxic animate-pulse">
                    Watch the energy flow from link to link ✨
                  </p>
                </div>
                <canvas
                  ref={canvasRef}
                  className="w-full cursor-pointer"
                  style={{ height: '500px' }}
                />
                <div className="mt-6 bg-gradient-to-r from-toxic/5 via-purple/5 to-cyan-500/5 rounded-xl p-5 border border-toxic/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl mb-2">💫</div>
                      <div className="text-white font-bold mb-1">Animated Flow</div>
                      <div className="text-xs text-gray-400">Particles show energy moving through chains</div>
                    </div>
                    <div>
                      <div className="text-3xl mb-2">🎨</div>
                      <div className="text-white font-bold mb-1">Unique Colors</div>
                      <div className="text-xs text-gray-400">Each chain gets its own vibrant color</div>
                    </div>
                    <div>
                      <div className="text-3xl mb-2">⛓️</div>
                      <div className="text-white font-bold mb-1">Real Connections</div>
                      <div className="text-xs text-gray-400">Chains show actual parent→child links</div>
                    </div>
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
