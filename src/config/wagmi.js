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
  [baseSepolia.id]: '0x911e9dcd78aCE1135bB7c4bC07adDA2b34d4774F', // Testnet V2 - WITH SECRETS! ✅
}

export const getContractAddress = (chainId) => {
  return CONTRACTS[chainId] || CONTRACTS[baseSepolia.id]
}
