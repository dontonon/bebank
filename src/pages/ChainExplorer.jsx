import { useState, useEffect, useRef } from 'react'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import ChainBackground from '../components/ChainBackground'
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

export default function ChainExplorer() {
  const { chain } = useAccount()
  const publicClient = usePublicClient()
  const canvasRef = useRef(null)
  const [links, setLinks] = useState([])
  const [selectedLink, setSelectedLink] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const { data: nextGiftId } = useReadContract({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: CONTRACT_ABI,
    functionName: 'nextGiftId',
    enabled: !!chain?.id
  })

  useEffect(() => {
    async function loadChainData() {
      if (!chain || !publicClient || !nextGiftId) {
        setIsLoading(false)
        return
      }

      try {
        const contractAddress = getContractAddress(chain.id)
        const totalLinks = Number(nextGiftId)

        // Load last 30 links for visualization
        const startId = Math.max(0, totalLinks - 30)
        const linkPromises = []

        for (let i = totalLinks - 1; i >= startId && i >= 0; i--) {
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

        const loadedLinks = await Promise.all(linkPromises)
        setLinks(loadedLinks)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading chain data:', error)
        setIsLoading(false)
      }
    }

    loadChainData()
  }, [chain, publicClient, nextGiftId])

  // Draw chain visualization on canvas
  useEffect(() => {
    if (!links.length || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)

    // Draw links as a flowing chain
    const spacing = Math.min(150, width / (links.length + 1))
    const centerY = height / 2

    links.forEach((link, index) => {
      const x = spacing * (index + 1)
      const y = centerY + Math.sin(index * 0.5) * 50
      const radius = 20

      // Draw connection line to previous link
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

      // Draw link node
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = link.claimed
        ? 'rgba(0, 255, 136, 0.3)'
        : 'rgba(157, 78, 221, 0.3)'
      ctx.fill()
      ctx.strokeStyle = link.claimed ? '#00FF88' : '#9D4EDD'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw link ID
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`#${link.id}`, x, y + 40)
    })
  }, [links])

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
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-black gradient-text mb-3">⛓️ Chain Explorer</h1>
            <p className="text-gray-400 text-lg">Visualize the network of connected links</p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-4 animate-spin inline-block">🔗</div>
              <p className="text-gray-400">Loading chain...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Chain Visualization Canvas */}
              <div className="glass-card rounded-xl p-6 border border-toxic/30 overflow-x-auto">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">Chain Flow</h3>
                  <p className="text-sm text-gray-400">Latest {links.length} links in the chain</p>
                </div>
                <canvas
                  ref={canvasRef}
                  className="w-full"
                  style={{ height: '300px' }}
                />
                <div className="mt-4 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple"></div>
                    <span className="text-gray-400">Unclaimed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-toxic"></div>
                    <span className="text-gray-400">Claimed</span>
                  </div>
                </div>
              </div>

              {/* Link List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {links.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => setSelectedLink(link)}
                    className={`glass-card rounded-xl p-6 border cursor-pointer transition-all hover:scale-105 ${
                      link.claimed
                        ? 'border-toxic/30 hover:border-toxic'
                        : 'border-purple/30 hover:border-purple'
                    } ${selectedLink?.id === link.id ? 'ring-2 ring-toxic' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">
                        {link.claimed ? '✅' : '⏳'}
                      </div>
                      <div className="text-sm font-mono text-gray-500">
                        #{link.id}
                      </div>
                    </div>

                    <div className="text-2xl font-bold gradient-text mb-2">
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

              {/* Selected Link Details Modal */}
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
                            <span className="text-purple">⏳ Unclaimed</span>
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
                          <div className="text-sm text-gray-400 mb-1">Claimer</div>
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
            </div>
          )}
        </div>
      </main>

      <Sidebar isBottomBar={true} />
    </div>
  )
}
