import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import NetworkGuard from '../components/NetworkGuard'
import SuccessModal from '../components/SuccessModal'
import TransactionProgress from '../components/TransactionProgress'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import TokenSelector from '../components/TokenSelector'
import { TOKENS, isNativeToken } from '../config/tokens'
import { getContractAddress } from '../config/wagmi'
import { parseUnits, decodeEventLog } from 'viem'
import { validateMinimumUSD } from '../utils/prices'
import { trackPotatoCreated } from '../utils/analytics'

// ABI for createGift function and GiftCreated event (V2 with secrets)
const CREATE_GIFT_ABI = [
  {
    name: 'createGift',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [
      { name: 'giftId', type: 'uint256' },
      { name: 'secret', type: 'bytes32' }
    ]
  },
  {
    name: 'GiftCreated',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'giftId', type: 'uint256' },
      { indexed: true, name: 'giver', type: 'address' },
      { indexed: false, name: 'token', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
      { indexed: false, name: 'secret', type: 'bytes32' }
    ]
  }
]

export default function Home() {
  const navigate = useNavigate()
  const { address, isConnected, chain } = useAccount()
  const [selectedToken, setSelectedToken] = useState(TOKENS[0])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)

  const { writeContract, data: hash, isPending, isError: isWriteError, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

  // When transaction confirms, extract potato ID and secret and show success modal
  useEffect(() => {
    if (isSuccess && receipt) {
      try {
        const contractAddress = getContractAddress(chain.id)
        let potatoId = null
        let secret = null

        console.log('🔍 Processing transaction receipt...')
        console.log('📦 Receipt logs count:', receipt.logs?.length)

        // Find the GiftCreated event log from our contract
        const giftCreatedLog = receipt.logs?.find(log =>
          log.address.toLowerCase() === contractAddress.toLowerCase()
        )

        if (!giftCreatedLog) {
          console.error('❌ No GiftCreated event found in receipt!')
          console.log('Available logs:', receipt.logs)
          throw new Error('GiftCreated event not found')
        }

        console.log('✅ Found GiftCreated log:', giftCreatedLog)

        // Decode the event to extract giftId and secret
        try {
          const decodedEvent = decodeEventLog({
            abi: CREATE_GIFT_ABI,
            data: giftCreatedLog.data,
            topics: giftCreatedLog.topics,
          })

          console.log('✅ Decoded event:', decodedEvent)
          console.log('📍 Event args:', decodedEvent.args)

          potatoId = decodedEvent.args.giftId.toString()
          secret = decodedEvent.args.secret

          console.log('🎉 Extracted potatoId:', potatoId)
          console.log('🔐 Extracted secret:', secret)

          if (!secret || secret === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            console.error('❌ SECRET IS MISSING OR ZERO!')
            console.error('This means the contract did not emit a proper secret!')
          }
        } catch (decodeError) {
          console.error('❌ Event decode failed:', decodeError)
          console.error('Log data:', giftCreatedLog.data)
          console.error('Log topics:', giftCreatedLog.topics)

          // Fallback: Extract potatoId from topics (it's indexed at position 1)
          try {
            const potentialId = BigInt(giftCreatedLog.topics[1])
            potatoId = Number(potentialId)
            console.warn('⚠️ Using fallback extraction - potatoId:', potatoId)
            console.warn('⚠️ Secret extraction failed - URL will not have secret!')
          } catch (fallbackError) {
            console.error('❌ Fallback extraction also failed:', fallbackError)
            throw new Error('Could not extract potato ID from event')
          }
        }

        // Validate we got a potato ID (0 is valid!)
        if (potatoId === null || potatoId === undefined || isNaN(potatoId) || potatoId < 0) {
          console.error('❌ Invalid potato ID extracted:', potatoId)
          throw new Error('Invalid potato ID')
        }

        // Show success modal with secret
        const modalData = {
          potatoId,
          secret, // CRITICAL: Include secret for share URL!
          amount,
          token: selectedToken.symbol
        }

        console.log('🎊 Setting success data:', modalData)
        setSuccessData(modalData)
        setShowSuccess(true)

        // Track potato creation
        trackPotatoCreated(selectedToken.symbol, amount)
      } catch (error) {
        console.error('❌ Error extracting potato ID and secret:', error)
        setError('Potato created but failed to get ID. Check your wallet.')
      }
    }
  }, [isSuccess, receipt, chain, amount, selectedToken])

  // Handle write errors
  useEffect(() => {
    if (isWriteError && writeError) {
      let errorMsg = 'Failed to create potato.'

      if (writeError.message?.includes('User rejected')) {
        errorMsg = 'Transaction cancelled.'
      } else if (writeError.message?.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transaction + gas.'
      } else if (writeError.message?.includes('InsufficientValue')) {
        errorMsg = 'Amount too small. Minimum is $1 USD equivalent'
      }

      setError(errorMsg)
    }
  }, [isWriteError, writeError])

  const handleCreateGift = async () => {
    setError('')

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    // Validate minimum $1 USD
    const validation = await validateMinimumUSD(amount, selectedToken.symbol)
    if (!validation.isValid) {
      setError(`Amount must be at least $1 USD (≈ ${validation.minimumAmount.toFixed(6)} ${selectedToken.symbol})`)
      return
    }

    if (!chain) {
      setError('Please connect your wallet')
      return
    }

    try {
      const amountInWei = parseUnits(amount, selectedToken.decimals)
      const contractAddress = getContractAddress(chain.id)

      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        setError('Smart contract not deployed on this network')
        return
      }

      const config = {
        address: contractAddress,
        abi: CREATE_GIFT_ABI,
        functionName: 'createGift',
        args: [selectedToken.address, amountInWei],
      }

      // If native ETH, add value
      if (isNativeToken(selectedToken.address)) {
        config.value = amountInWei
      }

      await writeContract(config)
    } catch (error) {
      console.error('Error creating potato:', error)
      setError('Failed to create potato. Please try again.')
    }
  }

  const isLoading = isPending || isConfirming

  return (
    <NetworkGuard>
      <div className="min-h-screen bg-dark flex flex-col">
        <Header />

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">
              Give Mystery. Receive Wonder.
            </h2>

            {/* How It Works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-3xl mb-2">🥔</div>
                <h4 className="font-bold text-white mb-1 text-sm">1. You Give</h4>
                <p className="text-xs text-gray-400">Choose token + amount</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">❓</div>
                <h4 className="font-bold text-white mb-1 text-sm">2. They Claim in Mystery</h4>
                <p className="text-xs text-gray-400">Must give to receive</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">✨</div>
                <h4 className="font-bold text-white mb-1 text-sm">3. Reveal & Repeat</h4>
                <p className="text-xs text-gray-400">Pass it on forever</p>
              </div>
            </div>
          </div>

          {/* Create Gift Form */}
          {!isConnected ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <h3 className="text-2xl font-bold mb-4 text-gray-300">Connect Your Wallet</h3>
              <p className="text-gray-500 mb-6">Connect to start your first potato chain</p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 space-y-6 glow-toxic-strong">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Create Hot Potato</h3>
                <p className="text-gray-400">Choose what to pass on (they won't see it until they give)</p>
              </div>

              <TokenSelector
                selectedToken={selectedToken}
                onSelect={setSelectedToken}
                amount={amount}
                onAmountChange={setAmount}
              />

              {/* Transaction Progress */}
              <TransactionProgress
                isPending={isPending}
                isConfirming={isConfirming}
                isSuccess={isSuccess}
              />

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreateGift}
                disabled={!amount || isLoading}
                className="w-full bg-gradient-to-r from-toxic to-purple text-dark py-4 rounded-xl font-bold text-xl hover:shadow-lg hover:shadow-toxic/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isPending && <span>Confirm in wallet... 👛</span>}
                {isConfirming && <span>Creating potato... ⏳</span>}
                {!isLoading && <span>Create Hot Potato ✨</span>}
              </button>

              {/* Info */}
              <div className="bg-dark/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">You send:</span>
                  <span className="text-white font-semibold">{amount || '0'} {selectedToken.symbol}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Next person receives:</span>
                  <span className="text-toxic font-semibold">
                    {amount ? (parseFloat(amount) * 0.99).toFixed(4) : '0'} {selectedToken.symbol} (99%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Protocol fee:</span>
                  <span className="text-gray-500">1%</span>
                </div>
              </div>
            </div>
          )}
          </div>
        </main>

        {/* Bottom Bar (formerly Sidebar) */}
        <Sidebar isBottomBar={true} />
      </div>

      {/* Success Modal */}
      {showSuccess && successData && (
        <SuccessModal
          type="create"
          data={successData}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </NetworkGuard>
  )
}
