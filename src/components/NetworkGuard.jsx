import { useAccount, useSwitchChain } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'

export default function NetworkGuard({ children }) {
  const { chain, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  // If not connected, show children (they'll see connect button)
  if (!isConnected) {
    return children
  }

  // Check if on supported network
  const isSupportedNetwork = chain?.id === baseSepolia.id || chain?.id === base.id

  if (!isSupportedNetwork) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-red-500/50">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Wrong Network</h2>
            <p className="text-gray-400">
              HotPotato only works on Base Sepolia testnet or Base mainnet.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => switchChain({ chainId: baseSepolia.id })}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all"
            >
              Switch to Base Sepolia
            </button>

            <button
              onClick={() => switchChain({ chainId: base.id })}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all"
            >
              Switch to Base Mainnet
            </button>
          </div>

          <div className="mt-6 p-4 bg-dark/50 rounded-lg">
            <p className="text-xs text-gray-500">
              <strong className="text-gray-400">Current Network:</strong> {chain?.name || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <strong className="text-gray-400">Chain ID:</strong> {chain?.id || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return children
}
