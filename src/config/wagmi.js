import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'Pass It On',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '3fcbfaff90971f8b41972652f6a4d721', // WalletConnect Cloud (fallback for dev)
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: false,
})

// Contract addresses from environment variables
export const CONTRACTS = {
  [base.id]: import.meta.env.VITE_CONTRACT_ADDRESS_BASE || '0x0000000000000000000000000000000000000000', // Production Base
  [baseSepolia.id]: import.meta.env.VITE_CONTRACT_ADDRESS_BASE_SEPOLIA || '0x28e763e348B87DB401bE3FFe44BbDfE152B9f003', // Testnet - DEPLOYED! ✅
}

export const getContractAddress = (chainId) => {
  return CONTRACTS[chainId] || CONTRACTS[baseSepolia.id]
}
