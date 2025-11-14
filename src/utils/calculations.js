/**
 * Calculate diversification score (1-10)
 * Based on number of sources and how evenly distributed the income is
 */
export function calculateDiversificationScore(sources) {
  if (sources.length === 0) return 0
  if (sources.length === 1) return 1

  const totalIncome = sources.reduce((sum, s) => sum + parseFloat(s.monthlyAmount || 0), 0)

  // Calculate Herfindahl-Hirschman Index (HHI)
  // HHI ranges from 1/n to 1, where n is number of sources
  // Lower HHI = more diversified
  const hhi = sources.reduce((sum, s) => {
    const share = parseFloat(s.monthlyAmount) / totalIncome
    return sum + (share * share)
  }, 0)

  // Convert HHI to a 1-10 score
  // If perfectly distributed: HHI = 1/n
  // If concentrated in one source: HHI = 1
  const minHHI = 1 / sources.length // Best case (perfectly distributed)
  const maxHHI = 1 // Worst case (all in one source)

  // Normalize: lower HHI = higher score
  const normalizedScore = 1 - ((hhi - minHHI) / (maxHHI - minHHI))

  // Scale to 1-10
  const score = Math.max(1, Math.min(10, Math.round(1 + (normalizedScore * 9))))

  return score
}

/**
 * Calculate stability score (percentage of recurring income)
 * Recurring = Monthly, Bi-weekly, Weekly, Quarterly, Annually
 * Non-recurring = One-time
 */
export function calculateStabilityScore(sources) {
  if (sources.length === 0) return 0

  const recurringFrequencies = ['Monthly', 'Bi-weekly', 'Weekly', 'Quarterly', 'Annually']

  const totalIncome = sources.reduce((sum, s) => sum + parseFloat(s.monthlyAmount || 0), 0)
  const recurringIncome = sources
    .filter(s => recurringFrequencies.includes(s.frequency))
    .reduce((sum, s) => sum + parseFloat(s.monthlyAmount || 0), 0)

  const percentage = Math.round((recurringIncome / totalIncome) * 100)

  return percentage
}

/**
 * Get breakdown by category
 * Returns object with category as key and {amount, count} as value
 */
export function getCategoryBreakdown(sources) {
  const breakdown = {}

  sources.forEach(source => {
    const category = source.category
    const amount = parseFloat(source.monthlyAmount || 0)

    if (!breakdown[category]) {
      breakdown[category] = {
        amount: 0,
        count: 0
      }
    }

    breakdown[category].amount += amount
    breakdown[category].count += 1
  })

  // Sort by amount (descending)
  return Object.fromEntries(
    Object.entries(breakdown).sort((a, b) => b[1].amount - a[1].amount)
  )
}
