import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import NetworkGuard from '../components/NetworkGuard'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import TokenSelector from '../components/TokenSelector'
import { TOKENS, isNativeToken } from '../config/tokens'
import { getContractAddress } from '../config/wagmi'
import { parseUnits } from 'viem'

// ABI for createGift function
const CREATE_GIFT_ABI = [
  {
    name: 'createGift',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'potatoId', type: 'uint256' }]
  }
]

export default function Home() {
  const navigate = useNavigate()
  const { address, isConnected, chain } = useAccount()
  const [selectedToken, setSelectedToken] = useState(TOKENS[0])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const { writeContract, data: hash, isPending, isError: isWriteError, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

  // When transaction confirms, extract potato ID and navigate
  useEffect(() => {
    if (isSuccess && receipt) {
      try {
        // Extract giftId from GiftCreated event
        // Event signature: GiftCreated(uint256 indexed giftId, address indexed giver, address token, uint256 amount, uint256 timestamp)
        // The giftId is the first indexed parameter (topic[1])
        const giftCreatedEvent = receipt.logs.find(log => {
          // GiftCreated event signature hash
          return log.topics[0] === '0x...' || log.topics.length >= 2
        })

        let potatoId
        if (giftCreatedEvent && giftCreatedEvent.topics[1]) {
          // Extract giftId from indexed parameter (topic[1])
          potatoId = BigInt(giftCreatedEvent.topics[1]).toString()
        } else {
          // Fallback: use transaction hash as ID
          potatoId = receipt.transactionHash.slice(-8)
        }

        // Navigate to share page
        setTimeout(() => {
          navigate(`/potato/${potatoId}`)
        }, 500)
      } catch (error) {
        console.error('Error extracting potato ID:', error)
        setError('Potato created but failed to get ID. Check your wallet.')
      }
    }
  }, [isSuccess, receipt, navigate])

  // Handle write errors
  useEffect(() => {
    if (isWriteError && writeError) {
      let errorMsg = 'Failed to create potato.'

      if (writeError.message?.includes('User rejected')) {
        errorMsg = 'Transaction cancelled.'
      } else if (writeError.message?.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transaction + gas.'
      } else if (writeError.message?.includes('InsufficientValue')) {
        errorMsg = 'Amount too small. Minimum is 0.0001'
      }

      setError(errorMsg)
    }
  }, [isWriteError, writeError])

  const handleCreateGift = async () => {
    setError('')

    if (!amount || parseFloat(amount) < 0.0001) {
      setError('Amount must be at least 0.0001')
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
      <div className="min-h-screen bg-dark flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header />

        <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">
              Give Blindly. Receive Surprisingly.
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
                <h4 className="font-bold text-white mb-1 text-sm">2. They Claim Blindly</h4>
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
            <div className="bg-dark-card rounded-2xl p-12 text-center border border-gray-800">
              <h3 className="text-2xl font-bold mb-4 text-gray-300">Connect Your Wallet</h3>
              <p className="text-gray-500 mb-6">Connect to start your first potato chain</p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <div className="bg-dark-card rounded-2xl p-8 border border-gray-800 space-y-6">
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
      </div>

        {/* Sidebar */}
        <Sidebar />
      </div>
    </NetworkGuard>
  )
}
