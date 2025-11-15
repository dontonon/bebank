import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Sidebar from '../components/Sidebar'
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
  const [isCreating, setIsCreating] = useState(false)

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const handleCreateGift = async () => {
    if (!amount || parseFloat(amount) < 0.0001) {
      alert('Amount must be at least 0.0001')
      return
    }

    setIsCreating(true)

    try {
      const amountInWei = parseUnits(amount, selectedToken.decimals)
      const contractAddress = getContractAddress(chain.id)

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

      // TODO: Get potato ID from transaction receipt and navigate
      // For now, simulate navigation after success
      setTimeout(() => {
        navigate('/potato/1') // Replace with actual potato ID
      }, 2000)
    } catch (error) {
      console.error('Error creating potato:', error)
      alert('Failed to create potato. Check console for details.')
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800 bg-dark-card">
          <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
            <Link to="/" className="text-3xl font-bold gradient-text hover:opacity-80 transition-opacity cursor-pointer">
              HOT POTATO 🥔
            </Link>
            <ConnectButton />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="text-8xl mb-6 animate-float">🥔</div>
            <h2 className="text-5xl font-bold gradient-text mb-4">
              Give Blindly. Receive Surprisingly.
            </h2>
            <p className="text-xl text-gray-400">
              Start a HotPotato chain. Someone will claim yours without knowing what it is.
            </p>
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
                <h3 className="text-2xl font-bold text-white mb-2">Create HotPotato</h3>
                <p className="text-gray-400">Choose what to pass on (they won't see it until they give)</p>
              </div>

              <TokenSelector
                selectedToken={selectedToken}
                onSelect={setSelectedToken}
                amount={amount}
                onAmountChange={setAmount}
              />

              {/* Create Button */}
              <button
                onClick={handleCreateGift}
                disabled={!amount || isCreating || isConfirming}
                className="w-full bg-gradient-to-r from-toxic to-purple text-dark py-4 rounded-xl font-bold text-xl hover:shadow-lg hover:shadow-toxic/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCreating || isConfirming ? (
                  <span>Creating Gift... ⏳</span>
                ) : (
                  <span>Create HotPotato ✨</span>
                )}
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

          {/* How It Works */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🥔</div>
              <h4 className="font-bold text-white mb-2">1. You Give</h4>
              <p className="text-sm text-gray-400">Choose token + amount, create HotPotato</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">❓</div>
              <h4 className="font-bold text-white mb-2">2. They Claim Blindly</h4>
              <p className="text-sm text-gray-400">Must give to receive - no preview!</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">✨</div>
              <h4 className="font-bold text-white mb-2">3. Reveal & Repeat</h4>
              <p className="text-sm text-gray-400">See what they got, pass it on</p>
            </div>
          </div>
        </div>
      </main>
      </div>

      {/* Sidebar */}
      <Sidebar />
    </div>
  )
}
