import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useGlobalStats, useRecentActivity } from '../services/eventIndexer'

export default function Sidebar() {
  const { chain } = useAccount()
  const globalStats = useGlobalStats()
  const recentActivity = useRecentActivity(3)

  return (
    <div className="hidden lg:block w-80 bg-dark-card border-l border-gray-800 p-6 overflow-y-auto shrink-0">
      {/* Stats */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">🔥 Stats</h3>

        <div className="space-y-4">
          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Total Potatoes</div>
            <div className="text-3xl font-bold gradient-text">
              {globalStats.isLoading ? '...' : globalStats.totalPotatoes}
            </div>
          </div>

          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Passed On</div>
            <div className="text-3xl font-bold text-toxic">
              {globalStats.isLoading ? '...' : globalStats.totalClaimed}
            </div>
          </div>

          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Active</div>
            <div className="text-3xl font-bold text-purple">
              {globalStats.isLoading ? '...' : globalStats.activePotatoes}
            </div>
          </div>

          <div className="bg-dark rounded-xl p-4 border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Total Claimed Value</div>
            <div className="text-3xl font-bold text-green-400">
              {globalStats.isLoading ? (
                <span className="text-xl">...</span>
              ) : (
                `$${globalStats.totalClaimedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">⚡ Recent Activity</h3>

        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, idx) => (
              <div key={`${activity.txHash}-${idx}`} className="bg-dark/50 rounded-lg p-3 border border-gray-800/50">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{activity.type === 'created' ? '🥔' : '🔥'}</span>
                  <span className={`text-sm font-semibold ${activity.type === 'claimed' ? 'text-toxic' : 'text-white'}`}>
                    Potato #{activity.potatoId}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {activity.type === 'created' ? 'Created' : 'Claimed'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">👀</div>
              <div className="text-sm">
                {globalStats.isLoading ? 'Loading...' : 'No activity yet'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-8 pt-8 border-t border-gray-800">
        <h3 className="text-lg font-bold text-white mb-3">How It Works</h3>
        <div className="space-y-2 text-xs text-gray-400">
          <div>🥔 Create a HotPotato with any token</div>
          <div>🔗 Share the link (they can't see what's inside!)</div>
          <div>🔥 They must pass on a potato to claim yours</div>
          <div>✨ Chain continues forever!</div>
        </div>
      </div>
    </div>
  )
}
