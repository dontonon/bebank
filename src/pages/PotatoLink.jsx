import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
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
        { name: 'secretHash', type: 'bytes32' }
      ]
    }]
  }
]

export default function PotatoLink() {
  const { giftId, secret } = useParams()
  const navigate = useNavigate()
  const { chain } = useAccount()
  const [copied, setCopied] = useState(false)

  // Validate giftId parameter
  const isValidGiftId = giftId && !isNaN(giftId) && Number(giftId) > 0 && Number.isInteger(Number(giftId))

  // Read gift data with polling (refresh every 5 seconds to detect claims)
  const { data: giftData, isLoading, refetch } = useReadContract({
    address: chain?.id ? getContractAddress(chain.id) : undefined,
    abi: GET_GIFT_ABI,
    functionName: 'getGift',
    args: isValidGiftId ? [BigInt(giftId)] : undefined,
    enabled: !!chain && isValidGiftId
  })

  // Poll every 5 seconds to check if link was claimed
  useEffect(() => {
    if (!giftData || giftData[3]) return // Stop polling if claimed

    const interval = setInterval(() => {
      console.log('Polling link status...')
      refetch()
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [giftData, refetch])

  // Extract gift data
  const isClaimed = giftData && giftData[3]
  const claimer = giftData && giftData[4]
  const claimedAt = giftData && giftData[6] ? Number(giftData[6]) : null
  const token = giftData && getTokenByAddress(giftData[0])
  const amount = giftData && token ? formatUnits(BigInt(giftData[1]), token.decimals) : null

  // Show error if invalid
  if (!isValidGiftId) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-red-500/50 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-3">Invalid Link</h2>
          <p className="text-gray-400 mb-6">This link is invalid. Please check the URL.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Include secret in share URL (V2 format: /claim/[id]/[secret])
  const shareUrl = `${window.location.origin}/claim/${giftId}/${secret || ''}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareMessages = [
    "I just passed on something... claim it 👀",
    "Mystery link waiting for you 🔗",
    "Someone's gonna get lucky... is it you? 🍀",
    "I dare you to claim this blindly 😈",
    "Passed on a little something... what will you get? 🎲"
  ]

  const randomMessage = shareMessages[Math.floor(Math.random() * shareMessages.length)]

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-float">🔗</div>
            <p className="text-gray-400">Loading link status...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Claimed Banner */}
          {isClaimed && (
            <div className="bg-gradient-to-r from-purple/30 to-toxic/30 border-2 border-toxic rounded-2xl p-8 mb-8 text-center animate-scale-in">
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold text-toxic mb-3">
                Link Claimed!
              </h2>
              <p className="text-xl text-white mb-4">
                Someone passed it on and the chain continues! 🔗
              </p>
              {amount && token && (
                <div className="bg-dark/50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-400 mb-1">They received:</div>
                  <div className="text-3xl font-bold gradient-text">
                    {amount} {token.symbol}
                  </div>
                </div>
              )}
              <div className="bg-dark/50 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">Claimed by:</div>
                <div className="text-xs text-toxic font-mono break-all">
                  {claimer}
                </div>
                {claimedAt && (
                  <>
                    <div className="text-sm text-gray-400 mt-3 mb-1">Claimed at:</div>
                    <div className="text-gray-300">
                      {new Date(claimedAt * 1000).toLocaleString()}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="text-8xl mb-6">{isClaimed ? '✅' : '✨'}</div>
            <h2 className="text-5xl font-bold gradient-text mb-4">
              {isClaimed ? 'Link Was Passed On!' : 'Link Created!'}
            </h2>
            <p className="text-xl text-gray-400">
              {isClaimed
                ? 'Your link was successfully claimed and the chain continues!'
                : 'Share your mystery link and watch someone claim it'}
            </p>
          </div>

          {/* Share Card - Only show if not claimed */}
          {!isClaimed && (
            <div className="bg-dark-card rounded-2xl p-8 border border-gray-800 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Your Link</h3>
              <p className="text-gray-400">Share this with anyone. They won't see what it is!</p>
            </div>

            {/* URL Box */}
            <div className="bg-dark rounded-xl p-4 flex items-center justify-between space-x-4">
              <code className="text-toxic flex-1 overflow-x-auto whitespace-nowrap">
                {shareUrl}
              </code>
              <button
                onClick={copyToClipboard}
                className="bg-toxic text-dark px-6 py-2 rounded-lg font-bold hover:bg-toxic/90 transition-all flex-shrink-0"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>

            {/* Share Message */}
            <div className="bg-dark/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Suggested message:</p>
              <p className="text-white font-semibold mb-3">"{randomMessage}"</p>
              <p className="text-xs text-gray-500">
                {shareUrl}
              </p>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(randomMessage + '\n' + shareUrl)}`,
                    '_blank'
                  )
                }}
                className="bg-[#1DA1F2] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                🐦 Share on X
              </button>
              <button
                onClick={() => {
                  window.open(
                    `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(randomMessage)}`,
                    '_blank'
                  )
                }}
                className="bg-[#0088cc] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                ✈️ Share on Telegram
              </button>
            </div>

            {/* Info */}
            <div className="border-t border-gray-800 pt-6 space-y-3">
              <h4 className="font-bold text-white">What happens next?</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✅ Someone clicks your link</li>
                <li>🔗 They see "Mystery Link" (no preview!)</li>
                <li>💰 To claim yours, they must pass on their own</li>
                <li>✨ They receive 99% of what you gave</li>
                <li>🔗 They get their own link to share</li>
                <li>♻️ The chain continues...</li>
              </ul>
            </div>

            {/* Live Status Indicator */}
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 rounded-full bg-toxic animate-pulse"></div>
                <span>Checking claim status live...</span>
              </div>
            </div>
          </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            {isClaimed ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-gradient-to-r from-toxic to-purple text-dark py-4 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  View My Links
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-dark-card border border-gray-700 text-white py-4 rounded-xl font-bold hover:border-toxic transition-all"
                >
                  Pass On Another
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gradient-to-r from-toxic to-purple text-dark py-4 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Pass On Another
                </button>
                <button
                  onClick={() => navigate('/stats')}
                  className="flex-1 bg-dark-card border border-gray-700 text-white py-4 rounded-xl font-bold hover:border-toxic transition-all"
                >
                  View The Chain
                </button>
              </>
            )}
          </div>

          {/* Link ID Badge with Status */}
          <div className="mt-8 text-center">
            <span className={`inline-block border px-6 py-3 rounded-full ${
              isClaimed
                ? 'bg-toxic/20 border-toxic text-toxic'
                : 'bg-dark-card border-gray-800 text-gray-400'
            }`}>
              Link #{giftId} {isClaimed ? '✅ Claimed' : '⏳ Active'}
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <Sidebar isBottomBar={true} />
    </div>
  )
}
