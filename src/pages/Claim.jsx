import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import TokenSelector from '../components/TokenSelector'
import RevealAnimation from '../components/RevealAnimation'
import { TOKENS, getTokenByAddress, isNativeToken } from '../config/tokens'
import { getContractAddress } from '../config/wagmi'
import { parseUnits, formatUnits } from 'viem'

const CLAIM_GIFT_ABI = [
  {
    name: 'claimGift',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'giftIdToClaim', type: 'uint256' },
      { name: 'newGiftToken', type: 'address' },
      { name: 'newGiftAmount', type: 'uint256' }
    ],
    outputs: [{ name: 'newGiftId', type: 'uint256' }]
  }
]

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
        { name: 'claimedAt', type: 'uint256' }
      ]
    }]
  }
]

export default function Claim() {
  const { giftId } = useParams()
  const navigate = useNavigate()
  const { address, isConnected, chain } = useAccount()

  const [selectedToken, setSelectedToken] = useState(TOKENS[0])
  const [amount, setAmount] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [revealedGift, setRevealedGift] = useState(null)

  // Read gift data
  const { data: giftData, isLoading: isLoadingGift } = useReadContract({
    address: getContractAddress(chain?.id),
    abi: GET_GIFT_ABI,
    functionName: 'getGift',
    args: [BigInt(giftId)],
    enabled: isConnected && !!chain
  })

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Check if gift is already claimed
  const isGiftClaimed = giftData && giftData[3] // claimed boolean

  useEffect(() => {
    if (isSuccess && giftData) {
      // Show reveal animation
      const token = getTokenByAddress(giftData[0])
      const receivedAmount = formatUnits(giftData[1] * 99n / 100n, token.decimals)

      setRevealedGift({
        token,
        amount: receivedAmount
      })
      setShowReveal(true)
    }
  }, [isSuccess, giftData])

  const handleClaimGift = async () => {
    if (!amount || parseFloat(amount) < 0.0001) {
      alert('Amount must be at least 0.0001')
      return
    }

    setIsClaiming(true)

    try {
      const amountInWei = parseUnits(amount, selectedToken.decimals)
      const contractAddress = getContractAddress(chain.id)

      const config = {
        address: contractAddress,
        abi: CLAIM_GIFT_ABI,
        functionName: 'claimGift',
        args: [BigInt(giftId), selectedToken.address, amountInWei],
      }

      // If native ETH, add value
      if (isNativeToken(selectedToken.address)) {
        config.value = amountInWei
      }

      await writeContract(config)
    } catch (error) {
      console.error('Error claiming gift:', error)
      alert('Failed to claim gift. Check console for details.')
      setIsClaiming(false)
    }
  }

  const handleRevealComplete = () => {
    setShowReveal(false)
    // TODO: Get new gift ID and navigate
    navigate('/gift/2') // Replace with actual new gift ID
  }

  if (isLoadingGift) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🎁</div>
          <p className="text-gray-400">Loading gift...</p>
        </div>
      </div>
    )
  }

  if (isGiftClaimed) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-gray-800 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-white mb-3">Already Claimed</h2>
          <p className="text-gray-400 mb-6">This gift has already been claimed by someone else.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Create Your Own Gift
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Reveal Animation */}
      {showReveal && revealedGift && (
        <RevealAnimation
          token={revealedGift.token}
          amount={revealedGift.amount}
          onComplete={handleRevealComplete}
        />
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-dark-card">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold gradient-text">PASS IT ON</h1>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Mystery Section */}
          <div className="text-center mb-12">
            <div className="text-9xl mb-6 animate-float">🎁</div>
            <h2 className="text-5xl font-bold gradient-text mb-4">
              Mystery Gift #{giftId}
            </h2>
            <p className="text-xl text-gray-400 mb-2">
              Someone passed something on... but what? 🤔
            </p>
            <p className="text-lg text-toxic font-semibold">
              Give to find out!
            </p>
          </div>

          {/* Claim Form */}
          {!isConnected ? (
            <div className="bg-dark-card rounded-2xl p-12 text-center border border-gray-800">
              <h3 className="text-2xl font-bold mb-4 text-gray-300">Connect to Claim</h3>
              <p className="text-gray-500 mb-6">Connect your wallet to claim this mystery gift</p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <div className="bg-dark-card rounded-2xl p-8 border border-gray-800 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">To Claim: Give Your Gift</h3>
                <p className="text-gray-400">You must pass on a gift to receive this one</p>
              </div>

              <TokenSelector
                selectedToken={selectedToken}
                onSelect={setSelectedToken}
                amount={amount}
                onAmountChange={setAmount}
              />

              {/* Claim Button */}
              <button
                onClick={handleClaimGift}
                disabled={!amount || isClaiming || isConfirming}
                className="w-full bg-gradient-to-r from-toxic to-purple text-dark py-4 rounded-xl font-bold text-xl hover:shadow-lg hover:shadow-toxic/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isClaiming || isConfirming ? (
                  <span>Claiming... ⏳</span>
                ) : (
                  <span>Claim Mystery Gift 🎁</span>
                )}
              </button>

              {/* Info */}
              <div className="bg-dark/50 rounded-xl p-4 space-y-3">
                <div className="text-center text-sm text-gray-400 mb-3">
                  ⚠️ You won't see what you're getting until AFTER you claim
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">You give:</span>
                  <span className="text-white font-semibold">{amount || '0'} {selectedToken.symbol}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">You receive:</span>
                  <span className="text-toxic font-semibold">Mystery Gift 🎁</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Your next gift link:</span>
                  <span className="text-purple font-semibold">After claiming</span>
                </div>
              </div>
            </div>
          )}

          {/* Psychological Hook */}
          <div className="mt-12 bg-dark-card/50 rounded-xl p-6 border border-gray-800">
            <h4 className="text-lg font-bold text-white mb-3">The Rules:</h4>
            <ul className="space-y-2 text-gray-400">
              <li>✅ Fair trade: Give to receive</li>
              <li>🙈 Blind commitment: No preview</li>
              <li>✨ Delayed gratification: Reveal after claim</li>
              <li>🔗 Pass it on: Share your link next</li>
              <li>💚 99% goes to you, 1% to protocol</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
