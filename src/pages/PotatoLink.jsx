import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

export default function PotatoLink() {
  const { potatoId } = useParams()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  // Validate potatoId
  if (!potatoId || potatoId === 'undefined' || potatoId === 'null') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-red-500/50 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-3">Invalid Potato Link</h2>
          <p className="text-gray-400 mb-6">This potato link is invalid. Please check the URL.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const shareUrl = `${window.location.origin}/claim/${potatoId}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareMessages = [
    "I just passed on something... claim it 👀",
    "Mystery potato waiting for you 🥔",
    "Someone's gonna get lucky... is it you? 🍀",
    "I dare you to claim this blindly 😈",
    "Passed on a little something... what will you get? 🎲"
  ]

  const randomMessage = shareMessages[Math.floor(Math.random() * shareMessages.length)]

  return (
    <div className="min-h-screen bg-dark flex flex-col lg:flex-row">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="text-8xl mb-6">✨</div>
            <h2 className="text-5xl font-bold gradient-text mb-4">
              Potato Created!
            </h2>
            <p className="text-xl text-gray-400">
              Share your mystery potato link and watch someone claim it
            </p>
          </div>

          {/* Share Card */}
          <div className="bg-dark-card rounded-2xl p-8 border border-gray-800 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Your Potato Link</h3>
              <p className="text-gray-400">Share this with anyone. They won't see what it is!</p>
            </div>

            {/* URL Box */}
            <div className="bg-dark rounded-xl p-4 flex items-center justify-between space-x-4">
              <code className="text-toxic flex-1 overflow-x-auto whitespace-nowrap">
                {shareUrl}
              </code>
              <button
                onClick={copyToClipboard}
                className="bg-toxic text-dark px-6 py-2 rounded-lg font-bold hover:bg-toxic/90 transition-all flex-shrink-0"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>

            {/* Share Message */}
            <div className="bg-dark/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Suggested message:</p>
              <p className="text-white font-semibold mb-3">"{randomMessage}"</p>
              <p className="text-xs text-gray-500">
                {shareUrl}
              </p>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(randomMessage + '\n' + shareUrl)}`,
                    '_blank'
                  )
                }}
                className="bg-[#1DA1F2] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                🐦 Share on X
              </button>
              <button
                onClick={() => {
                  window.open(
                    `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(randomMessage)}`,
                    '_blank'
                  )
                }}
                className="bg-[#0088cc] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                ✈️ Share on Telegram
              </button>
            </div>

            {/* Info */}
            <div className="border-t border-gray-800 pt-6 space-y-3">
              <h4 className="font-bold text-white">What happens next?</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✅ Someone clicks your link</li>
                <li>🥔 They see "Mystery Potato" (no preview!)</li>
                <li>💰 To claim yours, they must give their own</li>
                <li>✨ They receive 99% of what you gave</li>
                <li>🔗 They get their own link to share</li>
                <li>♻️ The chain continues...</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gradient-to-r from-toxic to-purple text-dark py-4 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Create Another Potato
            </button>
            <button
              onClick={() => navigate('/stats')}
              className="flex-1 bg-dark-card border border-gray-700 text-white py-4 rounded-xl font-bold hover:border-toxic transition-all"
            >
              View Stats
            </button>
          </div>

          {/* Potato ID Badge */}
          <div className="mt-8 text-center">
            <span className="inline-block bg-dark-card border border-gray-800 px-6 py-3 rounded-full text-gray-400">
              Potato #{potatoId}
            </span>
          </div>
        </div>
      </main>
      </div>

      {/* Sidebar */}
      <Sidebar />
    </div>
  )
}
