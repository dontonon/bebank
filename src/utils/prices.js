// Real-time price fetching for tokens
// Uses CoinGecko free API (no API key required)

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Map token symbols to CoinGecko IDs
const TOKEN_IDS = {
  'ETH': 'ethereum',
  'WETH': 'weth',
  'USDC': 'usd-coin',
  'DAI': 'dai',
  'cbETH': 'coinbase-wrapped-staked-eth'
}

// Cache prices to avoid excessive API calls
let priceCache = {}
let lastFetchTime = 0
const CACHE_DURATION = 60000 // 1 minute

/**
 * Fetch current USD prices for all supported tokens
 * Returns object with token symbols as keys and USD prices as values
 */
export async function fetchTokenPrices() {
  // Return cached prices if still fresh
  const now = Date.now()
  if (now - lastFetchTime < CACHE_DURATION && Object.keys(priceCache).length > 0) {
    console.log('💰 Using cached prices')
    return priceCache
  }

  try {
    const ids = Object.values(TOKEN_IDS).join(',')
    const url = `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`

    console.log('💰 Fetching fresh prices from CoinGecko...')
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    // Convert CoinGecko IDs back to token symbols
    const prices = {}
    for (const [symbol, id] of Object.entries(TOKEN_IDS)) {
      if (data[id] && data[id].usd) {
        prices[symbol] = data[id].usd
      }
    }

    console.log('💰 Fresh prices:', prices)

    // Update cache
    priceCache = prices
    lastFetchTime = now

    return prices
  } catch (error) {
    console.error('❌ Error fetching prices:', error)

    // Return fallback prices if API fails
    console.log('⚠️ Using fallback prices due to API error')
    return getFallbackPrices()
  }
}

/**
 * Get fallback prices (used when API is unavailable)
 */
function getFallbackPrices() {
  return {
    'ETH': 3000,
    'WETH': 3000,
    'USDC': 1,
    'DAI': 1,
    'cbETH': 3100
  }
}

/**
 * Get price for a specific token symbol
 */
export async function getTokenPrice(symbol) {
  const prices = await fetchTokenPrices()
  return prices[symbol] || 0
}

/**
 * Calculate minimum token amount needed to meet $1 USD minimum
 */
export async function getMinimumAmount(tokenSymbol) {
  const price = await getTokenPrice(tokenSymbol)
  if (price === 0) {
    console.warn(`⚠️ No price found for ${tokenSymbol}, using 0.0001 minimum`)
    return 0.0001
  }

  // Minimum $1 USD
  const minAmount = 1 / price
  console.log(`💰 ${tokenSymbol} minimum for $1: ${minAmount}`)
  return minAmount
}

/**
 * Calculate USD value of a token amount
 */
export async function calculateUSDValue(amount, tokenSymbol) {
  const price = await getTokenPrice(tokenSymbol)
  return parseFloat(amount) * price
}

/**
 * Validate that amount meets $1 minimum in USD
 */
export async function validateMinimumUSD(amount, tokenSymbol) {
  const usdValue = await calculateUSDValue(amount, tokenSymbol)
  return {
    isValid: usdValue >= 1,
    usdValue,
    minimumAmount: await getMinimumAmount(tokenSymbol)
  }
}
