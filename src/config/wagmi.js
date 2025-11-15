import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Pass It On',
  projectId: 'YOUR_PROJECT_ID', // Get from WalletConnect Cloud
  chains: [base, baseSepolia],
  ssr: false,
})

// Contract addresses (update after deployment)
export const CONTRACTS = {
  [base.id]: '0x0000000000000000000000000000000000000000', // Production Base
  [baseSepolia.id]: '0x0000000000000000000000000000000000000000', // Testnet
}

export const getContractAddress = (chainId) => {
  return CONTRACTS[chainId] || CONTRACTS[baseSepolia.id]
}
