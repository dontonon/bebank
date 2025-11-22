import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { TOKENS, isNativeToken } from '../config/tokens'
import { ERC20_ABI } from '../config/abis'
import { formatUnits } from 'viem'
import { fetchTokenPrices, calculateUSDValue } from '../utils/prices'
import { debounce } from '../utils/debounce'

export default function TokenSelector({ selectedToken, onSelect, amount, onAmountChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [tokensWithBalances, setTokensWithBalances] = useState([])
  const [usdValue, setUsdValue] = useState(0)
  const { address, isConnected } = useAccount()

  // Fetch prices on mount
  useEffect(() => {
    fetchTokenPrices() // Pre-fetch prices
  }, [])

  // Debounced USD value calculation (500ms delay)
  const debouncedUpdateUsdValue = useCallback(
    debounce(async (amt, token) => {
      if (amt && !isNaN(amt) && parseFloat(amt) > 0) {
        const value = await calculateUSDValue(amt, token.symbol)
        setUsdValue(value)
      } else {
        setUsdValue(0)
      }
    }, 500),
    []
  )

  // Calculate USD value when amount or token changes (debounced)
  useEffect(() => {
    debouncedUpdateUsdValue(amount, selectedToken)
  }, [amount, selectedToken, debouncedUpdateUsdValue])

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    enabled: !!address
  })

  // Get balances for all ERC20 tokens
  const tokenBalanceResults = TOKENS.filter(t => !isNativeToken(t.address)).map(token =>
    useReadContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
      enabled: !!address
    })
  )

  // Update tokens with balances when data changes
  useEffect(() => {
    if (!isConnected || !address) {
      setTokensWithBalances([])
      return
    }

    const tokensWithBalance = []

    // Add ETH if user has balance
    const ethToken = TOKENS.find(t => isNativeToken(t.address))
    if (ethToken && ethBalance && ethBalance.value > 0n) {
      tokensWithBalance.push({
        ...ethToken,
        balance: formatUnits(ethBalance.value, ethToken.decimals),
        rawBalance: ethBalance.value
      })
    }

    // Add ERC20 tokens with balance
    TOKENS.filter(t => !isNativeToken(t.address)).forEach((token, index) => {
      const result = tokenBalanceResults[index]
      if (result.data && result.data > 0n) {
        tokensWithBalance.push({
          ...token,
          balance: formatUnits(result.data, token.decimals),
          rawBalance: result.data
        })
      }
    })

    setTokensWithBalances(tokensWithBalance)

    // Auto-select first token with balance if no token selected
    if (tokensWithBalance.length > 0 && !selectedToken) {
      onSelect(tokensWithBalance[0])
    }
  }, [isConnected, address, ethBalance, ...tokenBalanceResults.map(r => r.data)])

  return (
    <div className="space-y-4">
      {/* Token Selector */}
      <div>
        <label className="block text-gray-300 font-semibold mb-2">
          Select Token
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-dark-card border border-gray-700 rounded-xl px-4 py-4 text-white hover:border-toxic transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{selectedToken.logo}</span>
              <div className="text-left">
                <div className="font-bold">{selectedToken.symbol}</div>
                <div className="text-sm text-gray-400">{selectedToken.name}</div>
              </div>
            </div>
            <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-dark-card border border-gray-700 rounded-xl overflow-hidden shadow-2xl max-h-96 overflow-y-auto">
              {tokensWithBalances.length > 0 ? (
                tokensWithBalances.map((token) => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => {
                      onSelect(token)
                      setIsOpen(false)
                    }}
                    className="w-full px-4 py-3 hover:bg-gray-800 transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{token.logo}</span>
                      <div>
                        <div className="font-bold text-white">{token.symbol}</div>
                        <div className="text-sm text-gray-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-toxic">
                        {parseFloat(token.balance).toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-500">balance</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-400">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-sm">No tokens found in wallet</div>
                  <div className="text-xs text-gray-500 mt-1">Get some ETH or tokens first</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-gray-300 font-semibold mb-2">
          Amount (min equivalent to $1)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.001"
            step="0.0001"
            min="0.0001"
            className="w-full bg-dark-card border border-gray-700 rounded-xl px-4 py-4 text-white text-2xl font-bold focus:border-toxic focus:outline-none transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
            {selectedToken.symbol}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          ≈ ${usdValue.toFixed(2)} USD
        </div>
      </div>
    </div>
  )
}
