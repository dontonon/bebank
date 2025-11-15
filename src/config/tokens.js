// Supported tokens on Base
export const TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    decimals: 18,
    logo: '⟠',
    color: '#627EEA'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
    decimals: 6,
    logo: '💵',
    color: '#2775CA'
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // Base DAI
    decimals: 18,
    logo: '◈',
    color: '#F4B731'
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x4200000000000000000000000000000000000006', // Base WETH
    decimals: 18,
    logo: '⟠',
    color: '#627EEA'
  },
  {
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', // Base cbETH
    decimals: 18,
    logo: '🔷',
    color: '#0052FF'
  },
]

export const getTokenByAddress = (address) => {
  return TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase())
}

export const getTokenBySymbol = (symbol) => {
  return TOKENS.find(t => t.symbol === symbol)
}

export const isNativeToken = (address) => {
  return address === '0x0000000000000000000000000000000000000000'
}
