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

// Contract addresses (update after deployment)
export const CONTRACTS = {
  [base.id]: '0x0000000000000000000000000000000000000000', // Production Base
  [baseSepolia.id]: '0xA070058b311887653a2e6daA38177c2AcE633680', // Testnet V2 - WITH SECRETS! ✅ (CORRECT DEPLOYMENT)
}

export const getContractAddress = (chainId) => {
  return CONTRACTS[chainId] || CONTRACTS[baseSepolia.id]
}
