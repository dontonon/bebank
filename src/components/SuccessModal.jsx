import { useNavigate } from 'react-router-dom'

export default function SuccessModal({ type, data, onClose }) {
  const navigate = useNavigate()

  console.log('========== SUCCESS MODAL DEBUG ==========')
  console.log('Modal type:', type)
  console.log('Modal data:', data)
  console.log('Data keys:', data ? Object.keys(data) : 'NO DATA')
  console.log('=======================================')

  // Defensive check - ensure we have required data
  if (!type || !data) {
    console.error('❌ SuccessModal missing required props:', { type, data })
    return null
  }

  const copyLink = () => {
    const link = `${window.location.origin}/claim/${data.potatoId}`
    navigator.clipboard.writeText(link)
    alert('Link copied! 🔗')
  }

  const shareTwitter = () => {
    const link = `${window.location.origin}/claim/${data.potatoId}`
    const text = type === 'create'
      ? `I just created a Hot Potato 🥔 with ${data.amount} ${data.token}! Can you claim it?`
      : `I just claimed a Hot Potato and received ${data.received} ${data.token}! 🔥`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`
    window.open(twitterUrl, '_blank')
  }

  if (type === 'create') {
    console.log('🎉 Rendering CREATE modal (green border)')
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-dark-card rounded-2xl p-8 max-w-md w-full border-4 border-toxic animate-scale-in">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-toxic mb-2">✅ Hot Potato CREATED!</h2>
            <p className="text-gray-400">Your gift is ready to be passed on</p>
          </div>

          {/* Gift Info */}
          <div className="bg-dark rounded-xl p-6 mb-6 border border-gray-800">
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-1">Your Hot Potato</div>
              <div className="text-4xl font-bold gradient-text mb-2">
                {data.amount} {data.token}
              </div>
              <div className="text-gray-500 text-sm">Potato #{data.potatoId}</div>
            </div>
          </div>

          {/* Share Link */}
          <div className="bg-gradient-to-r from-toxic/20 to-purple/20 rounded-xl p-4 mb-6 border border-toxic/50">
            <div className="text-sm text-gray-300 mb-2 font-semibold">📋 Share This Link:</div>
            <div className="bg-dark rounded-lg p-3 mb-3 font-mono text-xs text-gray-400 break-all">
              {window.location.origin}/claim/{data.potatoId}
            </div>
            <div className="text-xs text-gray-400">
              💡 They won't see what's inside until they pass on their own potato!
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={copyLink}
              className="w-full bg-gradient-to-r from-toxic to-purple text-dark py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-toxic/50 transition-all transform hover:scale-105"
            >
              📋 Copy Link to Share
            </button>

            <button
              onClick={shareTwitter}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"
            >
              Share on 𝕏 (Twitter)
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-dark-card text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all border border-gray-700"
              >
                My Potatoes
              </button>
              <button
                onClick={() => { onClose(); navigate('/') }}
                className="bg-dark-card text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all border border-gray-700"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'claim') {
    console.log('🔥 Rendering CLAIM modal')
    console.log('Claim data - received:', data.received, 'token:', data.token)
    console.log('Claim data - gave:', data.gave, 'gaveToken:', data.gaveToken)
    console.log('Claim data - newPotatoId:', data.newPotatoId)

    // Validate required fields for claim modal
    if (!data.received || !data.token || !data.gave || !data.gaveToken || !data.newPotatoId) {
      console.error('❌ Claim modal missing required data fields:', data)
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card rounded-2xl p-8 max-w-md w-full border-2 border-red-500">
            <h2 className="text-xl font-bold text-white mb-2">Claim Succeeded!</h2>
            <p className="text-gray-400">But we're missing some data. Check console for details.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 w-full bg-toxic text-dark py-3 rounded-xl font-bold">
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    }

    console.log('🔥🔥🔥 Rendering CLAIM modal (PURPLE border) 🔥🔥🔥')
    console.log('Claim modal data received:', data.received, data.token)
    console.log('Claim modal data gave:', data.gave, data.gaveToken)
    console.log('Claim modal new potato ID:', data.newPotatoId)

    return (
      <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[9999] animate-fade-in">
        <div className="bg-gradient-to-br from-purple-900 to-dark-card rounded-2xl p-8 max-w-md w-full border-4 border-purple animate-scale-in shadow-2xl shadow-purple/50">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="text-8xl mb-4 animate-bounce">🎁</div>
            <h2 className="text-4xl font-black text-purple mb-2">🔥 YOU GOT CRYPTO! 🔥</h2>
            <p className="text-white font-bold text-lg">Claim Successful!</p>
          </div>

          {/* What You Got */}
          <div className="bg-gradient-to-r from-toxic/20 to-purple/20 rounded-xl p-6 mb-4 border border-toxic/50">
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-1">You Received</div>
              <div className="text-5xl font-bold text-toxic mb-2">
                {data.received} {data.token}
              </div>
              <div className="text-gray-500 text-xs">99% of the potato (1% protocol fee)</div>
            </div>
          </div>

          {/* What You Gave */}
          <div className="bg-dark rounded-xl p-4 mb-6 border border-gray-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">You gave:</span>
              <span className="text-white font-semibold">{data.gave} {data.gaveToken}</span>
            </div>
          </div>

          {/* Your New Potato */}
          <div className="bg-gradient-to-r from-purple/20 to-toxic/20 rounded-xl p-4 mb-6 border border-purple/50">
            <div className="text-sm text-gray-300 mb-2 font-semibold">🥔 Your NEW Hot Potato Link:</div>
            <div className="bg-dark rounded-lg p-3 mb-3 font-mono text-xs text-gray-400 break-all">
              {window.location.origin}/claim/{data.newPotatoId}
            </div>
            <div className="text-xs text-gray-400">
              💡 Keep the chain going! Share this link to pass on your gift.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                const link = `${window.location.origin}/claim/${data.newPotatoId}`
                navigator.clipboard.writeText(link)
                alert('Link copied! 🔗')
              }}
              className="w-full bg-gradient-to-r from-purple to-toxic text-dark py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple/50 transition-all transform hover:scale-105"
            >
              📋 Copy My Link to Share
            </button>

            <button
              onClick={() => {
                const link = `${window.location.origin}/claim/${data.newPotatoId}`
                const text = `I just claimed a Hot Potato and got ${data.received} ${data.token}! 🔥 Can you claim mine?`
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`
                window.open(twitterUrl, '_blank')
              }}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"
            >
              Share on 𝕏 (Twitter)
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-dark-card text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all border border-gray-700"
              >
                My Potatoes
              </button>
              <button
                onClick={() => { onClose(); navigate('/') }}
                className="bg-dark-card text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all border border-gray-700"
              >
                Create New
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
