import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'Pass It On',
  projectId: '3fcbfaff90971f8b41972652f6a4d721', // WalletConnect Cloud
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
  [baseSepolia.id]: '0x28e763e348B87DB401bE3FFe44BbDfE152B9f003', // Testnet - DEPLOYED! ✅
}

export const getContractAddress = (chainId) => {
  return CONTRACTS[chainId] || CONTRACTS[baseSepolia.id]
}
