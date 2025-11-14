import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { calculateDiversificationScore, calculateStabilityScore, getCategoryBreakdown } from '../utils/calculations'

ChartJS.register(ArcElement, Tooltip, Legend)

function Dashboard({ sources }) {
  if (sources.length === 0) {
    return (
      <div className="bg-dark-card rounded-2xl p-12 text-center border border-gray-800">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-300 mb-2">No Active Income Sources</h2>
        <p className="text-gray-500">Add your first income source to see your dashboard</p>
      </div>
    )
  }

  const totalIncome = sources.reduce((sum, s) => sum + parseFloat(s.monthlyAmount || 0), 0)
  const diversificationScore = calculateDiversificationScore(sources)
  const stabilityScore = calculateStabilityScore(sources)
  const categoryBreakdown = getCategoryBreakdown(sources)

  // Find if any single source is > 50%
  const concentrationWarning = sources.find(s => (parseFloat(s.monthlyAmount) / totalIncome) > 0.5)

  // Prepare chart data
  const chartData = {
    labels: sources.map(s => s.name),
    datasets: [
      {
        data: sources.map(s => parseFloat(s.monthlyAmount)),
        backgroundColor: [
          '#00FF88',
          '#9D4EDD',
          '#FF6B9D',
          '#FFD700',
          '#00D9FF',
          '#FF4500',
          '#32CD32',
          '#FF1493',
        ],
        borderColor: '#1A1F3A',
        borderWidth: 3,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#ffffff',
          padding: 15,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: '#1A1F3A',
        titleColor: '#00FF88',
        bodyColor: '#ffffff',
        borderColor: '#00FF88',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const value = context.parsed
            const percentage = ((value / totalIncome) * 100).toFixed(1)
            return ` $${value.toLocaleString()} (${percentage}%)`
          }
        }
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Concentration Warning */}
      {concentrationWarning && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-red-400">High Concentration Risk</h3>
            <p className="text-red-300 text-sm">
              "{concentrationWarning.name}" represents more than 50% of your income. Consider diversifying.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income */}
        <div className="bg-dark-card rounded-xl p-6 border border-gray-800 hover:border-toxic-green transition-all duration-300">
          <div className="text-gray-400 text-sm font-semibold mb-2">TOTAL MONTHLY INCOME</div>
          <div className="text-4xl font-bold gradient-text">
            ${totalIncome.toLocaleString()}
          </div>
          <div className="text-gray-500 text-sm mt-2">{sources.length} active sources</div>
        </div>

        {/* Diversification Score */}
        <div className="bg-dark-card rounded-xl p-6 border border-gray-800 hover:border-neon-purple transition-all duration-300">
          <div className="text-gray-400 text-sm font-semibold mb-2">DIVERSIFICATION SCORE</div>
          <div className="flex items-end space-x-2">
            <div className="text-4xl font-bold text-neon-purple">
              {diversificationScore}
            </div>
            <div className="text-gray-400 text-lg mb-1">/ 10</div>
          </div>
          <div className="text-gray-500 text-sm mt-2">
            {diversificationScore >= 7 ? '✅ Well diversified' :
             diversificationScore >= 4 ? '⚠️ Moderate risk' :
             '🚨 High concentration'}
          </div>
        </div>

        {/* Stability Score */}
        <div className="bg-dark-card rounded-xl p-6 border border-gray-800 hover:border-toxic-green transition-all duration-300">
          <div className="text-gray-400 text-sm font-semibold mb-2">STABILITY SCORE</div>
          <div className="flex items-end space-x-2">
            <div className="text-4xl font-bold text-toxic-green">
              {stabilityScore}%
            </div>
          </div>
          <div className="text-gray-500 text-sm mt-2">
            {stabilityScore >= 70 ? '✅ Highly stable' :
             stabilityScore >= 40 ? '⚠️ Moderately stable' :
             '🚨 Low stability'}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-6 text-gray-200">Income Distribution</h2>
          <div style={{ height: '350px' }}>
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-6 text-gray-200">Category Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown).map(([category, data]) => {
              const percentage = ((data.amount / totalIncome) * 100).toFixed(1)
              return (
                <div key={category}>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300 font-medium">{category}</span>
                    <span className="text-gray-400">${data.amount.toLocaleString()} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: 'linear-gradient(90deg, #00FF88 0%, #9D4EDD 100%)',
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{data.count} sources</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sources Detail Table */}
      <div className="bg-dark-card rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-6 text-gray-200">Income Sources Detail</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Source</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Category</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">% of Total</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {sources
                .sort((a, b) => parseFloat(b.monthlyAmount) - parseFloat(a.monthlyAmount))
                .map(source => {
                  const percentage = ((parseFloat(source.monthlyAmount) / totalIncome) * 100).toFixed(1)
                  return (
                    <tr key={source.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{source.name}</td>
                      <td className="py-3 px-4 text-gray-400">{source.category}</td>
                      <td className="py-3 px-4 text-toxic-green font-semibold">${parseFloat(source.monthlyAmount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-300">{percentage}%</td>
                      <td className="py-3 px-4 text-gray-400">{source.frequency}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
