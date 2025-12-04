import { useAccount } from 'wagmi'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { useUserStats, calculateAchievements } from '../services/eventIndexer'
import { getTokenByAddress } from '../config/tokens'
import { formatUnits } from 'viem'

export default function Stats() {
  const { address, isConnected } = useAccount()
  const userStats = useUserStats(address)
  const achievements = calculateAchievements(userStats)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
              <div className="text-6xl mb-6">📊</div>
              <h2 className="text-3xl font-bold text-white mb-4">Your Stats Dashboard</h2>
              <p className="text-gray-400 mb-8">Connect your wallet to view your HotPotato history</p>
            </div>
          </main>
        </div>
        <Sidebar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold gradient-text mb-2">📊 Your Stats</h1>
              <p className="text-gray-400">Track your HotPotato activity and achievements</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-2">Potatoes Given</div>
                <div className="text-4xl font-bold text-toxic">
                  {userStats.isLoading ? '...' : userStats.potatoesGiven}
                </div>
              </div>

              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-2">Potatoes Received</div>
                <div className="text-4xl font-bold text-purple">
                  {userStats.isLoading ? '...' : userStats.potatoesReceived}
                </div>
              </div>

              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-2">Active Potatoes</div>
                <div className="text-4xl font-bold gradient-text">
                  {userStats.isLoading ? '...' : userStats.activePotatoes}
                </div>
              </div>

              <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm mb-2">Total Value Given</div>
                <div className="text-4xl font-bold text-green-400">
                  ${userStats.isLoading ? '...' : userStats.totalValueGiven.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Activity Tabs */}
            <div className="bg-dark-card rounded-xl border border-gray-800 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>

              {userStats.isLoading ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-400">Loading your activity...</p>
                </div>
              ) : userStats.potatoesGiven === 0 && userStats.potatoesReceived === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🥔</div>
                  <p className="text-gray-400 mb-4">No activity yet</p>
                  <p className="text-sm text-gray-500">Create your first potato to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Given Potatoes */}
                  {userStats.givenPotatoes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-toxic mb-3">🥔 Potatoes You Created</h3>
                      <div className="space-y-2">
                        {userStats.givenPotatoes.slice(0, 5).map(potato => {
                          const token = getTokenByAddress(potato.token)
                          const amount = token ? formatUnits(potato.amount, token.decimals) : '?'
                          return (
                            <div key={potato.potatoId} className="bg-dark/50 rounded-lg p-3 border border-gray-800/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">🥔</span>
                                  <span className="font-semibold text-white">Potato #{potato.potatoId}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-400">{amount} {token?.symbol}</div>
                                  <div className="text-xs text-gray-600">
                                    {new Date(potato.timestamp * 1000).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Received Potatoes */}
                  {userStats.receivedPotatoes.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-purple mb-3">🔥 Potatoes You Claimed</h3>
                      <div className="space-y-2">
                        {userStats.receivedPotatoes.slice(0, 5).map(potato => {
                          const token = getTokenByAddress(potato.receivedToken)
                          const amount = token ? formatUnits(potato.receivedAmount, token.decimals) : '?'
                          return (
                            <div key={potato.oldPotatoId} className="bg-dark/50 rounded-lg p-3 border border-gray-800/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">🔥</span>
                                  <span className="font-semibold text-purple">Potato #{potato.oldPotatoId}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-toxic">{amount} {token?.symbol}</div>
                                  <div className="text-xs text-gray-600">Claimed</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Achievements Section */}
            <div className="mt-8 bg-dark-card rounded-xl border border-gray-800 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">🏆 Achievements</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.values(achievements).map((achievement, idx) => (
                  <div
                    key={idx}
                    className={`bg-dark/50 rounded-lg p-4 text-center border ${
                      achievement.unlocked
                        ? 'border-toxic/50 shadow-lg shadow-toxic/20'
                        : 'border-gray-800/50 opacity-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{achievement.emoji}</div>
                    <div className={`text-sm font-semibold mb-1 ${achievement.unlocked ? 'text-toxic' : 'text-gray-400'}`}>
                      {achievement.title}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{achievement.description}</div>
                    {achievement.unlocked ? (
                      <div className="text-xs text-toxic font-bold">✓ Unlocked</div>
                    ) : (
                      <div className="text-xs text-gray-600">
                        {achievement.progress}/{achievement.total}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <Sidebar />
    </div>
  )
}
