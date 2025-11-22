import { useState } from 'react'
import { TOKENS, getMinimumAmount, getMinimumLabel, isStablecoin } from '../config/tokens'

export default function TokenSelector({ selectedToken, onSelect, amount, onAmountChange }) {
  const [isOpen, setIsOpen] = useState(false)

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
            <div className="absolute z-10 w-full mt-2 bg-dark-card border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
              {TOKENS.map((token) => (
                <button
                  key={token.symbol}
                  type="button"
                  onClick={() => {
                    onSelect(token)
                    setIsOpen(false)
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
            </div>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-gray-300 font-semibold mb-2">
          Amount ({getMinimumLabel(selectedToken)})
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={isStablecoin(selectedToken) ? "1.00" : "0.001"}
            step={isStablecoin(selectedToken) ? "0.01" : "0.0001"}
            min={getMinimumAmount(selectedToken)}
            className="w-full bg-dark-card border border-gray-700 rounded-xl px-4 py-4 text-white text-2xl font-bold focus:border-toxic focus:outline-none transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
            {selectedToken.symbol}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {isStablecoin(selectedToken) ? (
            `≈ $${amount && !isNaN(amount) ? parseFloat(amount).toFixed(2) : '0.00'} USD`
          ) : (
            `≈ $${amount && !isNaN(amount) ? (parseFloat(amount) * 3000).toFixed(2) : '0.00'} USD (at $3000/ETH)`
          )}
        </div>
      </div>
    </div>
  )
}
