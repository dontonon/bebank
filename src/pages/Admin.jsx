import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { getContractAddress } from '../config/wagmi'

const ADMIN_ABI = [
  {
    name: 'treasury',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'updateTreasury',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newTreasury', type: 'address' }],
    outputs: []
  }
]

export default function Admin() {
  const { address, isConnected, chain } = useAccount()
  const [newTreasuryAddress, setNewTreasuryAddress] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: currentTreasury } = useReadContract({
    address: getContractAddress(chain?.id),
    abi: ADMIN_ABI,
    functionName: 'treasury',
    enabled: isConnected && !!chain
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const isTreasuryOwner = currentTreasury && address && currentTreasury.toLowerCase() === address.toLowerCase()

  const handleUpdateTreasury = async () => {
    setError('')
    setSuccess('')

    if (!newTreasuryAddress || !newTreasuryAddress.startsWith('0x') || newTreasuryAddress.length !== 42) {
      setError('Invalid Ethereum address')
      return
    }

    if (!isTreasuryOwner) {
      setError('Only the current treasury address can update the treasury')
      return
    }

    try {
      await writeContract({
        address: getContractAddress(chain.id),
        abi: ADMIN_ABI,
        functionName: 'updateTreasury',
        args: [newTreasuryAddress],
      })
    } catch (error) {
      console.error('Error updating treasury:', error)
      setError('Failed to update treasury. Please try again.')
    }
  }

  // Show success message when transaction confirms
  if (isSuccess && !success) {
    setSuccess('Treasury updated successfully!')
    setNewTreasuryAddress('')
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold gradient-text mb-4">
                Admin Panel
              </h2>
              <p className="text-gray-400">
                Manage contract treasury settings
              </p>
            </div>

            {!isConnected ? (
              <div className="bg-dark-card rounded-2xl p-12 text-center border border-gray-800">
                <h3 className="text-2xl font-bold mb-4 text-gray-300">Connect Your Wallet</h3>
                <p className="text-gray-500 mb-6">Connect to manage treasury settings</p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Treasury Info */}
                <div className="bg-dark-card rounded-2xl p-8 border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-4">Current Treasury Address</h3>
                  <div className="bg-dark rounded-xl p-4 mb-4">
                    <code className="text-toxic text-sm break-all">
                      {currentTreasury || 'Loading...'}
                    </code>
                  </div>

                  <div className="bg-dark/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Your wallet:</span>
                      <code className="text-white text-xs">{address?.substring(0, 10)}...{address?.substring(address.length - 8)}</code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">You are treasury owner:</span>
                      <span className={isTreasuryOwner ? 'text-green-400' : 'text-red-400'}>
                        {isTreasuryOwner ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Update Treasury */}
                {isTreasuryOwner && (
                  <div className="bg-dark-card rounded-2xl p-8 border border-gray-800 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Update Treasury Address</h3>
                      <p className="text-gray-400 text-sm">
                        Change the address that receives 1% protocol fees.
                        <span className="text-orange-400"> Use a regular wallet address (EOA), not a smart contract wallet.</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        New Treasury Address
                      </label>
                      <input
                        type="text"
                        value={newTreasuryAddress}
                        onChange={(e) => setNewTreasuryAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-toxic focus:outline-none font-mono text-sm"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        💡 Recommended: Use a regular wallet (MetaMask, Rainbow, etc.), not a Coinbase Smart Wallet or Safe
                      </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Success Message */}
                    {success && (
                      <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
                        <p className="text-green-400 text-sm">{success}</p>
                      </div>
                    )}

                    {/* Update Button */}
                    <button
                      onClick={handleUpdateTreasury}
                      disabled={!newTreasuryAddress || isPending || isConfirming}
                      className="w-full bg-gradient-to-r from-toxic to-purple text-dark py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending && <span>Confirm in wallet... 👛</span>}
                      {isConfirming && <span>Updating treasury... ⏳</span>}
                      {!isPending && !isConfirming && <span>Update Treasury Address</span>}
                    </button>
                  </div>
                )}

                {/* Not Treasury Owner */}
                {!isTreasuryOwner && (
                  <div className="bg-dark-card rounded-2xl p-8 border border-yellow-500/50 text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-white mb-2">Not Authorized</h3>
                    <p className="text-gray-400">
                      Only the current treasury address can update the treasury settings.
                    </p>
                    <p className="text-gray-500 text-sm mt-4">
                      Connect with the treasury wallet to manage these settings.
                    </p>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-dark-card/50 rounded-xl p-6 border border-gray-800">
                  <h4 className="text-lg font-bold text-white mb-3">Why update the treasury?</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>✅ If claims are failing due to "TransferFailed" errors</li>
                    <li>✅ Smart contract wallets (Coinbase, Safe) can't receive direct ETH transfers</li>
                    <li>✅ Use a regular wallet (MetaMask, Rainbow, Rabby, etc.) instead</li>
                    <li>✅ The treasury receives 1% of all claims as protocol fees</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
      </main>

      {/* Bottom Bar */}
      <Sidebar isBottomBar={true} />
    </div>
  )
}
