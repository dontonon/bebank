import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'Pass It On',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: false,
})

// Contract addresses
export const CONTRACTS = {
  [base.id]: '0x28e763e348B87DB401bE3FFe44BbDfE152B9f003', // Production Base Mainnet - V2 WITH SECRETS! 🚀
  [baseSepolia.id]: '0xA070058b311887653a2e6daA38177c2AcE633680', // Testnet V2 - WITH SECRETS! ✅
}

export const getContractAddress = (chainId) => {
  return CONTRACTS[chainId] || CONTRACTS[baseSepolia.id]
}
