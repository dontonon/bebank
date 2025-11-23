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
    // V2: Include secret in URL
    const link = type === 'create'
      ? `${window.location.origin}/claim/${data.potatoId}/${data.secret || ''}`
      : `${window.location.origin}/claim/${data.newPotatoId}/${data.newSecret || ''}`
    navigator.clipboard.writeText(link)
    alert('Link copied! 🔗')
  }

  const shareTwitter = () => {
    // V2: Include secret in URL
    const link = type === 'create'
      ? `${window.location.origin}/claim/${data.potatoId}/${data.secret || ''}`
      : `${window.location.origin}/claim/${data.newPotatoId}/${data.newSecret || ''}`
    const text = type === 'create'
      ? `I just created a Mystery Hot Potato 🥔🎁 Can you claim it?`
      : `I just claimed a Hot Potato and received ${data.received} ${data.token}! 🔥 Can you claim mine?`
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
              {window.location.origin}/claim/{data.potatoId}/{data.secret || '...'}
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
        <div className="bg-gradient-to-br from-purple-900 to-dark-card rounded-2xl p-8 max-w-md w-full border-8 border-purple animate-scale-in shadow-2xl shadow-purple/50">

          {/* HUGE BANNER - WHAT YOU RECEIVED */}
          <div className="bg-gradient-to-r from-toxic to-purple rounded-2xl p-8 mb-6 text-center">
            <div className="text-white text-xl font-black mb-2">💰 YOU CLAIMED & RECEIVED 💰</div>
            <div className="text-6xl font-black text-dark mb-2">
              {data.received} {data.token}
            </div>
            <div className="text-dark text-sm font-bold">Successfully claimed potato!</div>
          </div>

          {/* Summary Box */}
          <div className="bg-purple/10 rounded-xl p-4 mb-6 border border-purple/30">
            <div className="text-center text-sm space-y-2">
              <div className="text-gray-400">Transaction Summary:</div>
              <div className="text-white">
                ✅ Claimed potato & received <span className="text-toxic font-bold">{data.received} {data.token}</span>
              </div>
              <div className="text-gray-400">
                ✅ Passed on <span className="text-white font-semibold">{data.gave} {data.gaveToken}</span> (your new potato)
              </div>
            </div>
          </div>

          {/* Your New Potato */}
          <div className="bg-gradient-to-r from-purple/30 to-toxic/30 rounded-xl p-5 mb-6 border-2 border-purple">
            <div className="text-base text-white mb-2 font-black text-center">🔗 NOW SHARE YOUR POTATO!</div>
            <div className="bg-dark rounded-lg p-3 mb-3 font-mono text-xs text-white break-all">
              {window.location.origin}/claim/{data.newPotatoId}/{data.newSecret || '...'}
            </div>
            <div className="text-xs text-center text-gray-300 font-semibold">
              ⬆️ This is YOUR new potato #{data.newPotatoId} - share it to continue the chain!
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                const link = `${window.location.origin}/claim/${data.newPotatoId}/${data.newSecret || ''}`
                navigator.clipboard.writeText(link)
                alert('New potato link copied! Share it to pass on your ' + data.gave + ' ' + data.gaveToken + ' 🔗')
              }}
              className="w-full bg-gradient-to-r from-purple to-toxic text-dark py-4 rounded-xl font-black text-lg hover:shadow-lg hover:shadow-purple/50 transition-all transform hover:scale-105"
            >
              📋 Copy NEW Potato Link (#{data.newPotatoId})
            </button>

            <button
              onClick={() => {
                const link = `${window.location.origin}/claim/${data.newPotatoId}/${data.newSecret || ''}`
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
