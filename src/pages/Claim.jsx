import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import Header from '../components/Header'
import TokenSelector from '../components/TokenSelector'
import RevealAnimation from '../components/RevealAnimation'
import Sidebar from '../components/Sidebar'
import { TOKENS, getTokenByAddress, isNativeToken, getMinimumAmount } from '../config/tokens'
import { getContractAddress } from '../config/wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ERC20_ABI } from '../config/abis'

const CLAIM_POTATO_ABI = [
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

const GET_POTATO_ABI = [
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
  const [isApproving, setIsApproving] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [revealedPotato, setRevealedPotato] = useState(null)
  const [claimError, setClaimError] = useState(null)

  // Read potato data
  const { data: potatoData, isLoading: isLoadingPotato } = useReadContract({
    address: getContractAddress(chain?.id),
    abi: GET_POTATO_ABI,
    functionName: 'getGift',
    args: giftId ? [BigInt(giftId)] : undefined,
    enabled: isConnected && !!chain && !!giftId
  })

  // Check ERC20 allowance
  const { data: allowance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, getContractAddress(chain?.id)],
    enabled: !isNativeToken(selectedToken.address) && isConnected && !!chain && !!amount
  })

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

  // Check if potato exists and is claimed
  const potatoExists = potatoData && potatoData[2] !== '0x0000000000000000000000000000000000000000'
  const isPotatoClaimed = potatoData && potatoData[3] // claimed boolean
  const isCreator = potatoData && potatoData[2]?.toLowerCase() === address?.toLowerCase()

  useEffect(() => {
    if (isSuccess && potatoData && receipt) {
      console.log('Processing claim success:', { receipt, potatoData })
      try {
        // Show reveal animation
        const token = getTokenByAddress(potatoData[0])
        if (!token) {
          console.error('Unknown token address:', potatoData[0])
          setClaimError('Unknown token received. Please contact support.')
          setIsClaiming(false)
          return
        }

        // Safely handle BigInt conversion
        // potatoData[1] is already a BigInt from the contract
        const potatoAmount = potatoData[1]
        const receivedAmount = formatUnits((potatoAmount * 99n) / 100n, token.decimals)

        // Get new potato ID from logs - try multiple approaches
        let newPotatoId = null
        try {
          if (receipt.logs && receipt.logs.length > 0) {
            console.log('Analyzing transaction logs:', receipt.logs)

            // Try to find the GiftCreated event (should be in logs)
            // The event signature for GiftCreated will have the potatoId
            for (let i = receipt.logs.length - 1; i >= 0; i--) {
              const log = receipt.logs[i]
              if (log.topics && log.topics.length > 1) {
                // Try topics[1] which often contains the first indexed parameter (potatoId)
                try {
                  const potentialId = BigInt(log.topics[1])
                  if (potentialId > 0n && potentialId < 1000000n) { // Sanity check
                    newPotatoId = Number(potentialId)
                    console.log('Extracted potato ID from topics[1]:', newPotatoId)
                    break
                  }
                } catch (e) {
                  // Try next log
                }
              }
            }
          }
        } catch (logError) {
          console.warn('Could not parse log for potato ID:', logError)
        }

        // Fallback: increment current giftId
        if (!newPotatoId || isNaN(newPotatoId) || newPotatoId <= 0) {
          newPotatoId = Number(giftId) + 1
          console.log('Using fallback potato ID:', newPotatoId)
        }

        console.log('Final potato ID:', newPotatoId)

        setRevealedPotato({
          token,
          amount: receivedAmount,
          newPotatoId
        })
        setShowReveal(true)
        setIsClaiming(false)
      } catch (error) {
        console.error('Error processing claim result:', error)
        setClaimError('Claim succeeded but could not process result. Please check your wallet.')
        setIsClaiming(false)
      }
    }
  }, [isSuccess, potatoData, receipt, giftId])

  const needsApproval = () => {
    if (isNativeToken(selectedToken.address)) return false
    if (!amount || !allowance) return true

    const amountInWei = parseUnits(amount, selectedToken.decimals)
    return BigInt(allowance) < BigInt(amountInWei)
  }

  const handleApprove = async () => {
    setIsApproving(true)
    setClaimError(null)

    try {
      const amountInWei = parseUnits(amount, selectedToken.decimals)
      const contractAddress = getContractAddress(chain.id)

      await writeContract({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress, amountInWei],
      })

      // Wait a bit for approval to confirm
      setTimeout(() => setIsApproving(false), 3000)
    } catch (error) {
      console.error('Error approving token:', error)
      setClaimError('Failed to approve token. Please try again.')
      setIsApproving(false)
    }
  }

  const handleClaimGift = async () => {
    const minAmount = getMinimumAmount(selectedToken)
    if (!amount || parseFloat(amount) < minAmount) {
      setClaimError(`Amount must be at least $1 USD (${minAmount} ${selectedToken.symbol})`)
      return
    }

    setIsClaiming(true)
    setClaimError(null)

    try {
      const amountInWei = parseUnits(amount, selectedToken.decimals)
      const contractAddress = getContractAddress(chain.id)

      const config = {
        address: contractAddress,
        abi: CLAIM_POTATO_ABI,
        functionName: 'claimGift',
        args: [BigInt(giftId), selectedToken.address, amountInWei],
      }

      // If native ETH, add value
      if (isNativeToken(selectedToken.address)) {
        config.value = amountInWei
      }

      await writeContract(config)
    } catch (error) {
      console.error('Error claiming potato:', error)
      let errorMsg = 'Failed to claim potato.'

      if (error.message?.includes('InsufficientValue')) {
        errorMsg = 'Amount too small. Minimum is 0.0001'
      } else if (error.message?.includes('GiftAlreadyClaimed')) {
        errorMsg = 'This HotPotato has already been claimed!'
      } else if (error.message?.includes('GiftDoesNotExist')) {
        errorMsg = 'This HotPotato does not exist.'
      } else if (error.message?.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for gas + potato amount.'
      }

      setClaimError(errorMsg)
      setIsClaiming(false)
    }
  }

  const handleRevealComplete = () => {
    setShowReveal(false)
    // Navigate to the new potato link page
    if (revealedPotato?.newPotatoId && revealedPotato.newPotatoId > 0) {
      console.log('Navigating to potato:', revealedPotato.newPotatoId)
      navigate(`/potato/${revealedPotato.newPotatoId}`)
    } else {
      console.warn('Invalid potato ID, navigating home:', revealedPotato)
      navigate('/')
    }
  }

  if (isLoadingPotato) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🥔</div>
          <p className="text-gray-400">Loading potato...</p>
        </div>
      </div>
    )
  }

  if (!potatoExists) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-red-500/50 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-3">Potato Not Found</h2>
          <p className="text-gray-400 mb-6">This HotPotato ID does not exist. Check the link and try again.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Create Your Own Potato
          </button>
        </div>
      </div>
    )
  }

  if (isCreator) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-yellow-500/50 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-3">Can't Claim Your Own Potato!</h2>
          <p className="text-gray-400 mb-6">You created this HotPotato. Share it with someone else to keep the chain going!</p>
          <button
            onClick={() => navigate(`/potato/${giftId}`)}
            className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all mb-3"
          >
            View Share Link
          </button>
          <button
            onClick={() => navigate('/')}
            className="block w-full bg-gray-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-600 transition-all"
          >
            Create New Potato
          </button>
        </div>
      </div>
    )
  }

  if (isPotatoClaimed) {
    const claimedBy = potatoData[4]
    const claimedAt = new Date(Number(potatoData[6]) * 1000).toLocaleString()

    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-yellow-500/50 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-white mb-3">Already Claimed</h2>
          <p className="text-gray-400 mb-4">This HotPotato has already been passed on.</p>
          <div className="bg-dark/50 rounded-xl p-4 mb-6 text-sm text-left">
            <div className="text-gray-500 mb-1">Claimed by:</div>
            <div className="text-toxic font-mono text-xs break-all">{claimedBy}</div>
            <div className="text-gray-500 mt-3 mb-1">Claimed at:</div>
            <div className="text-gray-300">{claimedAt}</div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Create Your Own Potato
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col lg:flex-row">
      {/* Reveal Animation */}
      {showReveal && revealedPotato && (
        <RevealAnimation
          token={revealedPotato.token}
          amount={revealedPotato.amount}
          onComplete={handleRevealComplete}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Mystery Section */}
          <div className="text-center mb-12">
            <div className="text-9xl mb-6 animate-float">🥔</div>
            <h2 className="text-5xl font-bold gradient-text mb-4">
              HotPotato #{giftId}
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
              <p className="text-gray-500 mb-6">Connect your wallet using the button in the top right to claim this HotPotato</p>
              <div className="text-6xl animate-bounce">
                ☝️
              </div>
            </div>
          ) : (
            <div className="bg-dark-card rounded-2xl p-8 border border-gray-800 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">To Claim: Pass On a Potato</h3>
                <p className="text-gray-400">You must pass on a potato to receive this one</p>
              </div>

              <TokenSelector
                selectedToken={selectedToken}
                onSelect={setSelectedToken}
                amount={amount}
                onAmountChange={setAmount}
              />

              {/* Error Message */}
              {claimError && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4">
                  <p className="text-red-400 font-semibold">⚠️ {claimError}</p>
                </div>
              )}

              {/* Approval Button (for ERC20) */}
              {needsApproval() && !isNativeToken(selectedToken.address) && (
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full bg-yellow-600 text-dark py-4 rounded-xl font-bold text-xl hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApproving ? (
                    <span>Approving... ⏳</span>
                  ) : (
                    <span>1️⃣ Approve {selectedToken.symbol} First</span>
                  )}
                </button>
              )}

              {/* Claim Button */}
              <button
                onClick={handleClaimGift}
                disabled={!amount || isClaiming || isConfirming || needsApproval()}
                className="w-full bg-gradient-to-r from-toxic to-purple text-dark py-4 rounded-xl font-bold text-xl hover:shadow-lg hover:shadow-toxic/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isClaiming || isConfirming ? (
                  <span>Claiming... ⏳</span>
                ) : needsApproval() && !isNativeToken(selectedToken.address) ? (
                  <span>2️⃣ Claim HotPotato 🥔</span>
                ) : (
                  <span>Claim HotPotato 🥔</span>
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
                  <span className="text-toxic font-semibold">HotPotato 🥔</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Your next potato link:</span>
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

      {/* Sidebar */}
      <Sidebar />
    </div>
  )
}
