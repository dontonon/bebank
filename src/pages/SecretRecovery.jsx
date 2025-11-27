import { useState } from 'react'
import { usePublicClient } from 'wagmi'
import Header from '../components/Header'
import { decodeEventLog } from 'viem'

const GIFT_CREATED_ABI = {
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

export default function SecretRecovery() {
  const publicClient = usePublicClient()
  const [txHash, setTxHash] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const recoverSecret = async () => {
    if (!txHash || !publicClient) {
      setError('Please enter a transaction hash')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      console.log('Fetching transaction receipt for:', txHash)
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash })

      console.log('Receipt:', receipt)
      console.log('Logs:', receipt.logs)

      // Find GiftCreated event
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: [GIFT_CREATED_ABI],
            data: log.data,
            topics: log.topics
          })

          if (decoded.eventName === 'GiftCreated') {
            const linkId = Number(decoded.args.giftId)
            const secret = decoded.args.secret

            console.log('Found GiftCreated event!')
            console.log('Link ID:', linkId)
            console.log('Secret:', secret)

            // Save to localStorage
            try {
              const secrets = JSON.parse(localStorage.getItem('linkSecrets') || '{}')
              secrets[linkId] = secret
              localStorage.setItem('linkSecrets', JSON.stringify(secrets))
              console.log(`💾 Saved secret for link #${linkId} to localStorage`)
            } catch (e) {
              console.error('Failed to save to localStorage:', e)
            }

            setResult({
              linkId,
              secret,
              shareUrl: `${window.location.origin}/claim/${linkId}/${secret}`
            })
            setLoading(false)
            return
          }
        } catch (e) {
          // Not a GiftCreated event, continue
        }
      }

      setError('No GiftCreated event found in this transaction')
      setLoading(false)
    } catch (err) {
      console.error('Error recovering secret:', err)
      setError(err.message || 'Failed to recover secret')
      setLoading(false)
    }
  }

  const copyUrl = () => {
    if (result) {
      navigator.clipboard.writeText(result.shareUrl)
      alert('Link copied! 🔗')
    }
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Header />

      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black gradient-text mb-3">🔍 Secret Recovery Tool</h1>
            <p className="text-gray-400">
              Recover secrets for old links by entering the transaction hash from when you created them.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">How to find your transaction hash:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
              <li>Go to your wallet (MetaMask, Rainbow, etc.)</li>
              <li>Find the transaction where you created the link</li>
              <li>Click on it to view details</li>
              <li>Copy the transaction hash (starts with "0x...")</li>
              <li>Paste it below</li>
            </ol>
          </div>

          <div className="glass-card rounded-xl p-6 mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transaction Hash
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-toxic"
            />

            <button
              onClick={recoverSecret}
              disabled={loading || !txHash}
              className="w-full mt-4 bg-gradient-to-r from-toxic to-purple text-dark py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? '🔍 Recovering...' : '🔓 Recover Secret'}
            </button>
          </div>

          {error && (
            <div className="glass-card rounded-xl p-4 mb-6 border border-red-500/50 bg-red-500/10">
              <p className="text-red-400">❌ {error}</p>
            </div>
          )}

          {result && (
            <div className="glass-card rounded-xl p-6 border-2 border-toxic animate-scale-in">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">✅</div>
                <h3 className="text-2xl font-bold gradient-text mb-2">Secret Recovered!</h3>
                <p className="text-gray-400 text-sm">Automatically saved to localStorage</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Link ID</div>
                  <div className="text-2xl font-bold text-white">#{result.linkId}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Secret</div>
                  <div className="bg-dark rounded-lg p-3 font-mono text-xs text-gray-300 break-all">
                    {result.secret}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Share URL</div>
                  <div className="bg-dark rounded-lg p-3 font-mono text-xs text-toxic break-all">
                    {result.shareUrl}
                  </div>
                </div>

                <button
                  onClick={copyUrl}
                  className="w-full bg-gradient-to-r from-toxic to-purple text-dark py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  📋 Copy Share URL
                </button>

                <p className="text-xs text-gray-500 text-center">
                  ✅ This secret has been saved to localStorage. You can now copy this link from "My Links"!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
