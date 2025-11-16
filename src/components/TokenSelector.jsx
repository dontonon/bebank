import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { TOKENS, isNativeToken } from '../config/tokens'
import { ERC20_ABI } from '../config/abis'
import { formatUnits } from 'viem'

export default function TokenSelector({ selectedToken, onSelect, amount, onAmountChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [tokenBalances, setTokenBalances] = useState({})
  const [customTokenAddress, setCustomTokenAddress] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const { address, isConnected } = useAccount()

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
              {TOKENS.map((token) => (
                <button
                  key={token.symbol}
                  type="button"
                  onClick={() => {
                    onSelect(token)
                    setIsOpen(false)
                    setShowCustomInput(false)
                  }}
                  className="w-full px-4 py-3 hover:bg-gray-800 transition-colors flex items-center space-x-3 text-left"
                >
                  <span className="text-2xl">{token.logo}</span>
                  <div>
                    <div className="font-bold text-white">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </div>
                </button>
              ))}

              {/* Custom Token Button */}
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(!showCustomInput)
                }}
                className="w-full px-4 py-3 hover:bg-gray-800 transition-colors flex items-center space-x-3 text-left border-t border-gray-700"
              >
                <span className="text-2xl">➕</span>
                <div>
                  <div className="font-bold text-white">Custom Token</div>
                  <div className="text-sm text-gray-400">Add any ERC20 by address</div>
                </div>
              </button>

              {/* Custom Token Input */}
              {showCustomInput && (
                <div className="px-4 py-3 border-t border-gray-700 bg-gray-900">
                  <input
                    type="text"
                    value={customTokenAddress}
                    onChange={(e) => setCustomTokenAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-dark border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-toxic focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customTokenAddress && customTokenAddress.startsWith('0x')) {
                        onSelect({
                          symbol: 'CUSTOM',
                          name: 'Custom Token',
                          logo: '🪙',
                          address: customTokenAddress,
                          decimals: 18 // Default, could query this
                        })
                        setIsOpen(false)
                        setShowCustomInput(false)
                        setCustomTokenAddress('')
                      }
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2 rounded-lg font-bold hover:opacity-90 transition-all text-sm"
                  >
                    Add Token
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-gray-300 font-semibold mb-2">
          Amount (min 0.0001 {selectedToken.symbol})
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
          ≈ ${amount && !isNaN(amount) ? (parseFloat(amount) * 3000).toFixed(2) : '0.00'} USD
        </div>
      </div>
    </div>
  )
}
