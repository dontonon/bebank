import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { getContractAddress } from '../config/wagmi'
import { getTokenByAddress } from '../config/tokens'
import { formatUnits } from 'viem'

const GET_GIFT_ABI = [
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
        { name: 'secretHash', type: 'bytes32' } // V2: Added secretHash field!
      ]
    }]
  },
  {
    name: 'nextGiftId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()
  const [myLinks, setMyLinks] = useState({ created: [], claimed: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, active, claimed

  // Get total number of links in the chain
  const { data: nextGiftId } = useReadContract({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: GET_GIFT_ABI,
    functionName: 'nextGiftId',
    enabled: !!chain?.id && isConnected
  })

  // Fetch all user's links
  useEffect(() => {
    async function fetchMyLinks() {
      if (!address || !chain || !nextGiftId || !publicClient) {
        console.log('Dashboard: Waiting for data...', {
          hasAddress: !!address,
          hasChain: !!chain,
          hasNextGiftId: !!nextGiftId,
          hasPublicClient: !!publicClient
        })
        return
      }

      setIsLoading(true)
      try {
        const totalLinks = Number(nextGiftId)
        const created = []
        const claimed = []

        console.log('==================== DASHBOARD DEBUG ====================')
        console.log('nextGiftId (raw):', nextGiftId)
        console.log('Total links in contract:', totalLinks)
        console.log('Your wallet address:', address)

        // Edge case: No links created yet
        if (totalLinks <= 1) {
          console.log('⚠️ No links exist yet (nextGiftId <= 1)')
          setMyLinks({ created: [], claimed: [] })
          setIsLoading(false)
          return
        }

        // Link IDs start from 1 and go up to (but not including) nextGiftId
        // So if nextGiftId is 35, the last link is ID 34
        // If there are many links, we'll limit to last 200 for performance
        const lastLinkId = totalLinks - 1
        const startId = Math.max(1, lastLinkId - 199) // Scan up to 200 links

        console.log('Scanning links from', startId, 'to', lastLinkId, '(inclusive)')
        console.log('Total links to scan:', lastLinkId - startId + 1)
        console.log('========================================================')

        // Create array of promises to fetch all links in parallel
        const fetchPromises = []
        for (let i = startId; i <= lastLinkId; i++) {
          fetchPromises.push(
            publicClient.readContract({
              address: getContractAddress(chain.id),
              abi: GET_GIFT_ABI,
              functionName: 'getGift',
              args: [BigInt(i)]
            })
            .then(giftData => ({ id: i, giftData, error: null }))
            .catch(error => ({ id: i, giftData: null, error }))
          )
        }

        // Fetch all potatoes in parallel
        const results = await Promise.all(fetchPromises)

        // Process results
        for (const { id: i, giftData, error } of results) {
          if (error) {
            console.error(`❌ Error fetching potato ${i}:`, error)
            continue
          }

          try {
            // Always log each potato scan for debugging
            if (i <= startId + 5 || i >= lastPotatoId - 2) {
              console.log(`[Scan] Potato #${i}:`, giftData)
              console.log(`  Type: ${typeof giftData}, IsArray: ${Array.isArray(giftData)}`)
              console.log(`  Keys:`, Object.keys(giftData || {}))
              console.log(`  giftData[2]:`, giftData?.[2])
              console.log(`  giftData.giver:`, giftData?.giver)
            }

            // viem returns struct as both array AND object, check both
            const creator = giftData?.[2] || giftData?.giver
            const isValidPotato = creator && creator !== '0x0000000000000000000000000000000000000000'

            if (giftData && isValidPotato) {
              // Extract fields (viem returns tuple as both array and object)
              const tokenAddr = giftData[0] || giftData.token
              const amount = giftData[1] || giftData.amount
              const giver = giftData[2] || giftData.giver
              const isClaimed = giftData[3] !== undefined ? giftData[3] : giftData.claimed
              const claimer = giftData[4] || giftData.claimer
              const timestamp = giftData[5] || giftData.timestamp
              const claimedAt = giftData[6] || giftData.claimedAt

              const linkInfo = {
                id: i,
                token: getTokenByAddress(tokenAddr),
                amount: amount,
                giver: giver,
                claimed: isClaimed,
                claimer: claimer,
                timestamp: Number(timestamp),
                claimedAt: claimedAt ? Number(claimedAt) : null
              }

              // Check if user created this link
              const isCreator = giver.toLowerCase() === address.toLowerCase()
              if (isCreator) {
                console.log('✅ FOUND CREATED LINK #' + i)
                console.log('   Creator:', giver)
                console.log('   Your address:', address)
                created.push(linkInfo)
              }

              // Check if user claimed this link
              const isClaimer = isClaimed && claimer && claimer.toLowerCase() === address.toLowerCase()
              if (isClaimer) {
                console.log('✅ FOUND CLAIMED LINK #' + i)
                console.log('   Claimer:', claimer)
                console.log('   Your address:', address)
                console.log('   Pushing to claimed array')
                claimed.push(linkInfo)
              }
            } else {
              if (i <= startId + 5 || i >= lastLinkId - 2) {
                console.log(`⚠️ Link #${i} - Invalid or empty (creator: ${creator})`)
              }
            }
          } catch (error) {
            console.error(`❌ Error processing link ${i}:`, error)
          }
        }

        console.log('==================== SCAN COMPLETE ====================')
        console.log('📊 Final results:')
        console.log('   ✅ Created links found:', created.length)
        console.log('   ✅ Claimed links found:', claimed.length)
        if (created.length > 0) {
          console.log('   Created IDs:', created.map(p => p.id).join(', '))
        }
        if (claimed.length > 0) {
          console.log('   Claimed IDs:', claimed.map(p => p.id).join(', '))
        }
        console.log('======================================================')
        setMyLinks({ created, claimed })
      } catch (error) {
        console.error('❌ Error fetching links:', error)
        console.error('Error details:', error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyLinks()
  }, [address, chain, nextGiftId, publicClient])

  const copyLink = (linkId) => {
    // Try to get secret from localStorage
    let secret = ''
    try {
      const secrets = JSON.parse(localStorage.getItem('linkSecrets') || '{}')
      secret = secrets[linkId] || ''
      if (secret) {
        console.log(`✅ Found secret for link #${linkId} in localStorage`)
      } else {
        console.warn(`⚠️ No secret found for link #${linkId} in localStorage`)
      }
    } catch (error) {
      console.error('Failed to retrieve secret from localStorage:', error)
    }

    // Generate link with secret if available
    const link = secret
      ? `${window.location.origin}/claim/${linkId}/${secret}`
      : `${window.location.origin}/claim/${linkId}`

    navigator.clipboard.writeText(link)

    if (secret) {
      alert('Link copied! Share it to keep the chain going! 🔗')
    } else {
      alert('Link copied! ⚠️ Note: Secret not found. Link may not work for new claims.')
    }
  }

  const filteredCreated = myLinks.created.filter(p => {
    if (filter === 'active') return !p.claimed
    if (filter === 'claimed') return p.claimed
    return true
  })

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect to see your chain history</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Header />

      <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold gradient-text mb-2">My Links 🔗</h1>
            <p className="text-gray-400 mb-8">Track all the links you've created and claimed in the chain</p>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Total Created</div>
                <div className="text-3xl font-bold text-toxic">{myLinks.created.length}</div>
              </div>
              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Total Claimed</div>
                <div className="text-3xl font-bold text-purple">{myLinks.claimed.length}</div>
              </div>
              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Active (Unclaimed)</div>
                <div className="text-3xl font-bold text-cyan-500">
                  {myLinks.created.filter(p => !p.claimed).length}
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-toxic text-dark'
                    : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'active'
                    ? 'bg-toxic text-dark'
                    : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('claimed')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'claimed'
                    ? 'bg-toxic text-dark'
                    : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                Claimed
              </button>
            </div>

            {/* Created Links */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">🔗 Links I Created</h2>
              {isLoading ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-4 animate-spin">🔗</div>
                  <p>Loading your links...</p>
                </div>
              ) : filteredCreated.length === 0 ? (
                <div className="bg-dark-card rounded-xl p-12 text-center border border-gray-800">
                  <div className="text-4xl mb-4">🤷</div>
                  <p className="text-gray-400 mb-4">No links found</p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-gradient-to-r from-toxic to-purple text-dark px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    Create Your First Link
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCreated.map((link) => (
                    <div
                      key={link.id}
                      className="bg-dark-card rounded-xl p-6 border border-gray-800 hover:border-toxic transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Link #{link.id}</div>
                          {link.claimed ? (
                            <div className="text-2xl font-bold text-white">
                              {formatUnits(BigInt(link.amount), link.token?.decimals || 18)}{' '}
                              {link.token?.symbol || '???'}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-gray-500">
                              🎁 Surprise Inside!
                            </div>
                          )}
                        </div>
                        <div>
                          {link.claimed ? (
                            <span className="bg-purple/20 text-purple px-3 py-1 rounded-full text-sm font-semibold">
                              Claimed
                            </span>
                          ) : (
                            <span className="bg-toxic/20 text-toxic px-3 py-1 rounded-full text-sm font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        Created {new Date(link.timestamp * 1000).toLocaleDateString()}
                      </div>

                      {link.claimed ? (
                        <div className="bg-dark/50 rounded-lg p-3 mb-4">
                          <div className="text-xs text-gray-400 mb-1">Claimed by:</div>
                          <div className="text-xs text-toxic font-mono">
                            {link.claimer.substring(0, 10)}...{link.claimer.substring(38)}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(link.claimedAt * 1000).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => copyLink(link.id)}
                          className="w-full bg-gradient-to-r from-toxic to-purple text-dark py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                        >
                          📋 Copy Link to Share
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Claimed Links */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">✨ Links I Claimed</h2>
              {myLinks.claimed.length === 0 ? (
                <div className="bg-dark-card rounded-xl p-12 text-center border border-gray-800">
                  <div className="text-4xl mb-4">👀</div>
                  <p className="text-gray-400">You haven't claimed any links yet!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myLinks.claimed.map((link) => (
                    <div
                      key={link.id}
                      className="bg-dark-card rounded-xl p-6 border border-gray-800 hover:border-purple transition-all"
                    >
                      <div className="text-sm text-gray-400 mb-1">Claimed Link #{link.id}</div>
                      <div className="text-2xl font-bold text-toxic mb-2">
                        Received: {formatUnits(BigInt(link.amount) * 99n / 100n, link.token?.decimals || 18)}{' '}
                        {link.token?.symbol || '???'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Claimed on {new Date(link.claimedAt * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </main>

      {/* Bottom Bar */}
      <Sidebar isBottomBar={true} />
    </div>
  )
}
