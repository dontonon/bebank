import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import Header from '../components/Header'
import NetworkGuard from '../components/NetworkGuard'
import TokenSelector from '../components/TokenSelector'
import RevealAnimation from '../components/RevealAnimation'
import SuccessModal from '../components/SuccessModal'
import TransactionProgress from '../components/TransactionProgress'
import Sidebar from '../components/Sidebar'
import { TOKENS, getTokenByAddress, isNativeToken } from '../config/tokens'
import { getContractAddress } from '../config/wagmi'
import { parseUnits, formatUnits, decodeEventLog, getCode } from 'viem'
import { usePublicClient } from 'wagmi'
import { ERC20_ABI } from '../config/abis'
import { trackPotatoClaimed } from '../utils/analytics'

// V2 ABI with secrets
const CLAIM_GIFT_ABI = [
  {
    name: 'claimGift',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'giftIdToClaim', type: 'uint256' },
      { name: 'secret', type: 'bytes32' },
      { name: 'newGiftToken', type: 'address' },
      { name: 'newGiftAmount', type: 'uint256' }
    ],
    outputs: [{ name: 'newGiftId', type: 'uint256' }]
  },
  {
    name: 'GiftCreated',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'giftId', type: 'uint256' },
      { indexed: true, name: 'giver', type: 'address' },
      { indexed: false, name: 'token', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
      { indexed: false, name: 'secret', type: 'bytes32' }
    ]
  },
  {
    name: 'GiftClaimed',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'oldGiftId', type: 'uint256' },
      { indexed: true, name: 'newGiftId', type: 'uint256' },
      { indexed: true, name: 'claimer', type: 'address' },
      { indexed: false, name: 'tokenReceived', type: 'address' },
      { indexed: false, name: 'amountReceived', type: 'uint256' },
      { indexed: false, name: 'tokenGiven', type: 'address' },
      { indexed: false, name: 'amountGiven', type: 'uint256' }
    ]
  }
]

const GET_GIFT_ABI = [
  {
    name: 'getGift',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'giftId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'giver', type: 'address' },
        { name: 'claimed', type: 'bool' },
        { name: 'claimer', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'claimedAt', type: 'uint256' },
        { name: 'secretHash', type: 'bytes32' }
      ]
    }]
  },
  {
    name: 'nextGiftId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'treasury',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
]

export default function Claim() {
  const { giftId, secret } = useParams() // V2: Extract secret from URL
  const navigate = useNavigate()
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()

  // Validate giftId parameter
  const isValidGiftId = giftId && !isNaN(giftId) && Number(giftId) > 0 && Number.isInteger(Number(giftId))

  const [selectedToken, setSelectedToken] = useState(TOKENS[0])
  const [amount, setAmount] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [revealedGift, setRevealedGift] = useState(null)
  const [claimError, setClaimError] = useState(null)
  const [isClaimerContract, setIsClaimerContract] = useState(false)
  const [contractBalance, setContractBalance] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [claimingGiftData, setClaimingGiftData] = useState(null) // Store gift data before claiming
  const [expectedNewPotatoId, setExpectedNewPotatoId] = useState(null) // Store expected new potato ID

  // Read gift data
  const { data: giftData, isLoading: isLoadingGift } = useReadContract({
    address: getContractAddress(chain?.id),
    abi: GET_GIFT_ABI,
    functionName: 'getGift',
    args: isValidGiftId ? [BigInt(giftId)] : undefined,
    enabled: isConnected && !!chain && isValidGiftId
  })

  // Read nextGiftId to know what ID the new potato will have
  const { data: nextGiftId } = useReadContract({
    address: getContractAddress(chain?.id),
    abi: GET_GIFT_ABI,
    functionName: 'nextGiftId',
    enabled: isConnected && !!chain
  })

  // Read treasury address for debugging
  const { data: treasuryAddress } = useReadContract({
    address: getContractAddress(chain?.id),
    abi: GET_GIFT_ABI,
    functionName: 'treasury',
    enabled: isConnected && !!chain
  })

  // Check ERC20 allowance
  const { data: allowance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, getContractAddress(chain?.id)],
    enabled: !isNativeToken(selectedToken.address) && isConnected && !!chain && !!amount
  })

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

  // Check if gift exists and is claimed
  const giftExists = giftData && giftData[2] !== '0x0000000000000000000000000000000000000000'
  const isGiftClaimed = giftData && giftData[3] // claimed boolean
  const isCreator = giftData && giftData[2]?.toLowerCase() === address?.toLowerCase()

  // Check if claimer address is a smart contract AND get contract balance
  useEffect(() => {
    async function checkWalletAndBalance() {
      if (address && publicClient && chain) {
        try {
          // Check if wallet is a contract
          const code = await publicClient.getCode({ address })
          const isContract = code && code !== '0x'
          setIsClaimerContract(isContract)
          console.log('Your wallet is a contract?', isContract)

          // Get contract ETH balance
          const contractAddr = getContractAddress(chain.id)
          const balance = await publicClient.getBalance({ address: contractAddr })
          setContractBalance(balance)
          console.log('Contract ETH balance:', formatUnits(balance, 18), 'ETH')
        } catch (error) {
          console.error('Error checking wallet/balance:', error)
        }
      }
    }
    checkWalletAndBalance()
  }, [address, publicClient, chain])

  // Debug logging
  useEffect(() => {
    if (giftData && address && contractBalance !== null) {
      try {
        const isETHGift = giftData[0] === '0x0000000000000000000000000000000000000000'
        const giftAmount = BigInt(giftData[1] || 0)
        const claimerWillGet = (giftAmount * 99n) / 100n
        const treasuryWillGet = giftAmount - claimerWillGet
        const totalNeeded = giftAmount // Contract needs full amount to distribute

        console.log('=== CLAIM DEBUG ===')
        console.log('Potato creator:', giftData[2])
        console.log('Current wallet (YOU):', address)
        console.log('Is same wallet?', isCreator)
        console.log('Treasury address:', treasuryAddress)
        console.log('Gift token address:', giftData[0])
        console.log('Gift is ETH?', isETHGift)
        console.log('Gift amount (raw):', giftAmount?.toString())
        if (isETHGift) {
          console.log('Gift amount (ETH):', formatUnits(giftAmount, 18))
          console.log('Contract balance (ETH):', formatUnits(contractBalance, 18))
          console.log('Claimer will get (ETH):', formatUnits(claimerWillGet, 18))
          console.log('Treasury will get (ETH):', formatUnits(treasuryWillGet, 18))
          console.log('Contract has enough?', BigInt(contractBalance) >= totalNeeded)
          if (BigInt(contractBalance) < totalNeeded) {
            console.error('❌ CONTRACT INSUFFICIENT BALANCE! Needs:', formatUnits(totalNeeded, 18), 'Has:', formatUnits(contractBalance, 18))
          }
        }
        console.log('Your wallet is smart contract?', isClaimerContract)
        console.log('==================')
      } catch (error) {
        console.error('Error in debug logging:', error)
      }
    }
  }, [giftData, address, isCreator, treasuryAddress, isClaimerContract, contractBalance])

  // Process claim success with robust error handling
  useEffect(() => {
    if (isSuccess && receipt && isClaiming && claimingGiftData && expectedNewPotatoId !== null) {
      console.log('✅ Processing claim success!')
      console.log('Receipt:', receipt)
      console.log('Stored gift data:', claimingGiftData)
      try {
        // Extract token and amount from STORED gift data (not current giftData which may be stale)
        const tokenAddr = claimingGiftData[0] || claimingGiftData.token
        const giftAmount = claimingGiftData[1] || claimingGiftData.amount

        console.log('Token address from stored data:', tokenAddr)
        console.log('Amount from stored data:', giftAmount)

        // Verify we have required fields
        if (!tokenAddr || !giftAmount) {
          console.error('❌ Stored gift data incomplete:', claimingGiftData)
          setClaimError(`Claim succeeded! Your new potato ID is probably ${Number(giftId) + 1}. Navigate to /potato/${Number(giftId) + 1}`)
          setIsClaiming(false)
          setTimeout(() => navigate(`/potato/${Number(giftId) + 1}`), 2000)
          return
        }

        // Get token info
        console.log('Step 1: Looking for token:', tokenAddr)
        const token = getTokenByAddress(tokenAddr)
        console.log('Token found:', token)

        if (!token) {
          console.error('Unknown token address:', tokenAddr)
          setClaimError(`Claim succeeded! Token: ${tokenAddr}. Your new potato ID is ${Number(giftId) + 1}`)
          setIsClaiming(false)
          // Navigate anyway
          setTimeout(() => navigate(`/potato/${Number(giftId) + 1}`), 2000)
          return
        }

        // Safely handle BigInt conversion
        console.log('Step 2: Converting gift amount:', giftAmount)
        const giftAmountBigInt = BigInt(giftAmount)
        const receivedAmount = formatUnits((giftAmountBigInt * 99n) / 100n, token.decimals)
        console.log('Received amount formatted:', receivedAmount)

        // Get new potato ID and secret from logs - try multiple approaches
        console.log('🔍 Step 3: Extracting new potato ID and secret from claim transaction logs')
        let newGiftId = null
        let newSecret = null
        const contractAddress = getContractAddress(chain.id)

        try {
          if (receipt.logs && receipt.logs.length > 0) {
            console.log('📦 Total logs in receipt:', receipt.logs.length)

            // Look for GiftCreated event to get newSecret
            for (let i = receipt.logs.length - 1; i >= 0; i--) {
              const log = receipt.logs[i]

              // Skip logs not from our contract
              if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
                continue
              }

              // Try to decode as GiftCreated event
              try {
                const decodedEvent = decodeEventLog({
                  abi: CLAIM_GIFT_ABI,
                  data: log.data,
                  topics: log.topics,
                })

                console.log(`📋 Decoded event ${i}:`, decodedEvent.eventName)

                if (decodedEvent.eventName === 'GiftCreated') {
                  newGiftId = Number(decodedEvent.args.giftId)
                  newSecret = decodedEvent.args.secret
                  console.log('✅ Found GiftCreated event!')
                  console.log('   New potato ID:', newGiftId)
                  console.log('   New secret:', newSecret)

                  if (!newSecret || newSecret === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    console.error('❌ NEW SECRET IS MISSING OR ZERO!')
                    console.error('   This means the contract did not emit a proper secret for your new potato!')
                  }
                  break
                }
              } catch (e) {
                // Not a GiftCreated event or decode failed
                console.log(`  Log ${i}: Not GiftCreated or decode failed`)
              }

              // Fallback: Manual extraction from topics if decode failed
              if (!newGiftId && log.topics && log.topics.length > 1) {
                try {
                  // Try topics[2] first (newGiftId from GiftClaimed event)
                  if (log.topics.length > 2) {
                    const potentialNewId = BigInt(log.topics[2])
                    if (potentialNewId > 0n && potentialNewId < 1000000n) {
                      newGiftId = Number(potentialNewId)
                      console.warn('⚠️ Extracted NEW potato ID from topics[2]:', newGiftId)
                      console.warn('⚠️ Secret extraction failed - URL will not have secret!')
                    }
                  }

                  // Fallback: Try topics[1] (giftId from GiftCreated event)
                  if (!newGiftId) {
                    const potentialId = BigInt(log.topics[1])
                    if (potentialId > 0n && potentialId < 1000000n) {
                      newGiftId = Number(potentialId)
                      console.warn('⚠️ Extracted potato ID from topics[1]:', newGiftId)
                      console.warn('⚠️ Secret extraction failed - URL will not have secret!')
                    }
                  }
                } catch (e) {
                  console.log(`  Failed to parse log ${i}:`, e)
                }
              }
            }
          }
        } catch (logError) {
          console.error('❌ Error parsing logs for potato ID and secret:', logError)
        }

        // Fallback: use expected new potato ID (stored before claiming)
        if (!newGiftId || isNaN(newGiftId) || newGiftId <= 0) {
          newGiftId = expectedNewPotatoId
          console.warn('⚠️ Could not extract from logs, using expected potato ID:', newGiftId)
          console.warn('   (This is nextGiftId from before the claim transaction)')
        }

        console.log('🎊 Final new potato ID:', newGiftId)
        console.log('🔐 Final new secret:', newSecret || 'NONE (URL will not work!)')

        // Show success modal with claim details
        const modalData = {
          received: receivedAmount,
          token: token.symbol,
          gave: amount,
          gaveToken: selectedToken.symbol,
          newPotatoId: newGiftId,
          newSecret: newSecret // V2: Include new secret for share URL!
        }

        console.log('========== ABOUT TO SHOW SUCCESS MODAL ==========')
        console.log('Modal will show with TYPE: "claim"')
        console.log('Modal data being passed:', modalData)
        console.log('All fields present?', {
          received: !!modalData.received,
          token: !!modalData.token,
          gave: !!modalData.gave,
          gaveToken: !!modalData.gaveToken,
          newPotatoId: !!modalData.newPotatoId
        })
        console.log('================================================')

        setSuccessData(modalData)
        setShowSuccess(true)
        setIsClaiming(false)
        setClaimingGiftData(null) // Clear stored data after using it
        setExpectedNewPotatoId(null) // Clear expected ID

        // Track potato claim
        trackPotatoClaimed(modalData.token, modalData.received, modalData.gaveToken, modalData.gave)
      } catch (error) {
        console.error('❌ Error processing claim result:', error)
        console.error('Error stack:', error.stack)
        setClaimError(`Claim succeeded but failed to process: ${error.message}. Your new potato ID might be ${expectedNewPotatoId}`)
        setIsClaiming(false)
        setClaimingGiftData(null) // Clear stored data on error too
        setExpectedNewPotatoId(null) // Clear expected ID on error too
      }
    }
  }, [isSuccess, claimingGiftData, expectedNewPotatoId, receipt, giftId, isClaiming, amount, selectedToken, navigate])

  const needsApproval = () => {
    if (isNativeToken(selectedToken.address)) return false
    if (!amount || !allowance) return true

    const amountInWei = parseUnits(amount, selectedToken.decimals)
    return BigInt(allowance) < BigInt(amountInWei)
  }

  const handleApprove = async () => {
    setIsApproving(true)
    setClaimError(null)

    try {
      const amountInWei = parseUnits(amount, selectedToken.decimals)
      const contractAddress = getContractAddress(chain.id)

      await writeContract({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress, amountInWei],
      })

      // Wait a bit for approval to confirm
      setTimeout(() => setIsApproving(false), 3000)
    } catch (error) {
      console.error('Error approving token:', error)
      setClaimError('Failed to approve token. Please try again.')
      setIsApproving(false)
    }
  }

  const handleClaimGift = async () => {
    if (!amount || parseFloat(amount) < 0.0001) {
      setClaimError('Amount must be at least 0.0001')
      return
    }

    // Check if trying to claim own potato
    if (isCreator) {
      setClaimError("You can't claim your own Hot Potato! Share it with someone else.")
      return
    }

    // CRITICAL: Store the gift data AND expected new potato ID BEFORE claiming
    console.log('💾 Storing gift data before claiming:', giftData)
    console.log('💾 Current nextGiftId (this will be YOUR new potato ID):', nextGiftId)
    setClaimingGiftData(giftData)
    setExpectedNewPotatoId(nextGiftId ? Number(nextGiftId) : null)

    setIsClaiming(true)
    setClaimError(null)

    try {
      const amountInWei = parseUnits(amount, selectedToken.decimals)
      const contractAddress = getContractAddress(chain.id)

      const config = {
        address: contractAddress,
        abi: CLAIM_GIFT_ABI,
        functionName: 'claimGift',
        args: [BigInt(giftId), secret || '0x0000000000000000000000000000000000000000000000000000000000000000', selectedToken.address, amountInWei], // V2: Include secret
      }

      // If native ETH, add value
      if (isNativeToken(selectedToken.address)) {
        config.value = amountInWei
      }

      await writeContract(config)
    } catch (error) {
      console.error('Error claiming gift:', error)
      console.error('Full error:', JSON.stringify(error, null, 2))
      let errorMsg = 'Failed to claim gift.'

      const errStr = error.message || error.toString()

      if (errStr.includes('InsufficientValue')) {
        errorMsg = 'Amount too small. Minimum is 0.0001 ETH'
      } else if (errStr.includes('GiftAlreadyClaimed')) {
        errorMsg = 'This Hot Potato has already been claimed!'
      } else if (errStr.includes('GiftDoesNotExist')) {
        errorMsg = 'This Hot Potato does not exist.'
      } else if (errStr.includes('TransferFailed') || errStr.includes('f;')) {
        if (isClaimerContract) {
          errorMsg = `Transfer failed! Your wallet (${address?.substring(0, 10)}...) is a SMART CONTRACT WALLET and cannot receive ETH transfers from the contract. Please use a regular wallet (MetaMask, Rainbow, etc.) to claim.`
        } else {
          errorMsg = `Transfer failed. Either the treasury (${treasuryAddress?.substring(0, 10)}...) or your wallet cannot receive ETH. Both must be regular wallets, not smart contract wallets.`
        }
      } else if (errStr.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for gas + gift amount.'
      } else if (errStr.includes('User rejected') || errStr.includes('user rejected')) {
        errorMsg = 'Transaction cancelled.'
      } else {
        errorMsg = `Failed to claim: ${errStr.substring(0, 100)}`
      }

      setClaimError(errorMsg)
      setIsClaiming(false)
    }
  }

  const handleRevealComplete = () => {
    setShowReveal(false)
    // Navigate to the new potato link page
    if (revealedGift?.newGiftId && revealedGift.newGiftId > 0) {
      console.log('Navigating to potato:', revealedGift.newGiftId)
      navigate(`/potato/${revealedGift.newGiftId}`)
    } else {
      console.warn('Invalid potato ID, navigating home:', revealedGift)
      navigate('/')
    }
  }

  if (isLoadingGift) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🥔</div>
          <p className="text-gray-400">Loading gift...</p>
        </div>
      </div>
    )
  }

  if (!giftExists) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-red-500/50 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-3">Potato Not Found</h2>
          <p className="text-gray-400 mb-6">This Hot Potato ID does not exist. Check the link and try again.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Create Your Own Gift
          </button>
        </div>
      </div>
    )
  }

  if (isCreator) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-yellow-500/50 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-3">Can't Claim Your Own Potato!</h2>
          <p className="text-gray-400 mb-6">You created this Hot Potato. Share it with someone else to keep the chain going!</p>
          <button
            onClick={() => navigate(`/potato/${giftId}`)}
            className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all mb-3"
          >
            View Share Link
          </button>
          <button
            onClick={() => navigate('/')}
            className="block w-full bg-gray-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-600 transition-all"
          >
            Create New Potato
          </button>
        </div>
      </div>
    )
  }

  if (isGiftClaimed) {
    const claimedBy = giftData[4]
    const claimedAt = new Date(Number(giftData[6] * 1000n)).toLocaleString()

    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card rounded-2xl p-8 border border-yellow-500/50 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-white mb-3">Already Claimed</h2>
          <p className="text-gray-400 mb-4">This Hot Potato has already been passed on.</p>
          <div className="bg-dark/50 rounded-xl p-4 mb-6 text-sm text-left">
            <div className="text-gray-500 mb-1">Claimed by:</div>
            <div className="text-toxic font-mono text-xs break-all">{claimedBy}</div>
            <div className="text-gray-500 mt-3 mb-1">Claimed at:</div>
            <div className="text-gray-300">{claimedAt}</div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-toxic to-purple text-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Create Your Own Potato
          </button>
        </div>
      </div>
    )
  }

  return (
    <NetworkGuard>
      {/* Invalid Gift ID Error */}
      {!isValidGiftId ? (
        <div className="min-h-screen bg-dark flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-3xl font-bold text-white mb-4">Invalid Potato ID</h2>
              <p className="text-gray-400 mb-6">
                The potato ID "{giftId}" is not valid. Please check the link and try again.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-toxic to-purple text-dark px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Go Home
              </button>
            </div>
          </main>
        </div>
      ) : (
      <div className="min-h-screen bg-dark flex flex-col">
        {/* Reveal Animation */}
        {showReveal && revealedGift && (
          <RevealAnimation
            token={revealedGift.token}
            amount={revealedGift.amount}
            onComplete={handleRevealComplete}
          />
        )}

        <Header />

        <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* CLAIMING BANNER - Simplified Single Box */}
          <div className="glass-card bg-gradient-to-r from-purple/30 to-toxic/30 border-2 border-purple rounded-2xl p-8 mb-8 text-center glow-purple-strong">
            <div className="text-7xl mb-4 animate-float">🔗</div>
            <h1 className="text-4xl font-black gradient-text mb-3">
              Claim Your Gift
            </h1>
            <p className="text-xl text-white font-semibold mb-2">
              Someone sent you crypto! 🎁
            </p>
            <p className="text-gray-300 mb-2">
              Pass on your own gift to claim theirs
            </p>
            <p className="text-toxic font-bold text-lg animate-glow-pulse">
              What's inside? You'll find out after! 🤔
            </p>
          </div>

          {/* Claim Form */}
          {!isConnected ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <h3 className="text-2xl font-bold mb-4 text-gray-300">Connect to Claim Your Gift</h3>
              <p className="text-gray-500 mb-6">Connect your wallet to see what you'll receive</p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 border-2 border-toxic/50 space-y-6 glow-toxic-strong">
              {/* Clear Instructions */}
              <div className="bg-gradient-to-r from-purple/20 to-toxic/20 rounded-xl p-5 border border-purple/30">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <span>🔄</span>
                  <span>How Claiming Works</span>
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>1️⃣ You choose a token & amount to pass on</p>
                  <p>2️⃣ Click "CLAIM NOW" - this creates YOUR link AND claims theirs</p>
                  <p>3️⃣ You instantly receive their crypto (99% of it)</p>
                  <p>4️⃣ Get your new link to share with someone else!</p>
                </div>
              </div>

              {/* Can't Claim Own Gift Warning */}
              {isCreator && (
                <div className="bg-yellow-900/40 border-2 border-yellow-500 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🚫</div>
                    <div>
                      <p className="text-yellow-400 font-bold text-lg mb-2">YOU CAN'T CLAIM YOUR OWN GIFT!</p>
                      <p className="text-yellow-300 text-sm mb-3">
                        You created this gift. You need to share it with someone else to claim it!
                      </p>
                      <p className="text-yellow-200 text-sm font-semibold">
                        👉 Share the link with a friend and they can claim it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Already Claimed Warning */}
              {isGiftClaimed && !isCreator && (
                <div className="bg-red-900/40 border-2 border-red-500 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">😢</div>
                    <div>
                      <p className="text-red-400 font-bold text-lg mb-2">GIFT ALREADY CLAIMED!</p>
                      <p className="text-red-300 text-sm mb-3">
                        Someone else already claimed this gift at {new Date(Number(giftData[6] * 1000n)).toLocaleString()}
                      </p>
                      <p className="text-red-200 text-sm">
                        Claimed by: <span className="font-mono text-xs">{giftData[4]}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Only show form if can claim */}
              {!isCreator && !isGiftClaimed && (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Choose What to Pass On:</h3>
                    <p className="text-gray-400 text-sm">This will be YOUR gift that you give to claim theirs</p>
                  </div>

                  {/* Smart Contract Wallet Warning */}
                  {isClaimerContract && (
                <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">⚠️</div>
                    <div>
                      <p className="text-red-400 font-bold text-lg mb-2">SMART CONTRACT WALLET DETECTED!</p>
                      <p className="text-red-300 text-sm mb-3">
                        Your wallet (<code className="text-xs">{address?.substring(0, 20)}...</code>) is a smart contract wallet (like Coinbase Smart Wallet).
                      </p>
                      <p className="text-red-200 text-sm font-semibold">
                        ❌ Claims will FAIL because the contract cannot send ETH to smart wallets.
                      </p>
                      <p className="text-yellow-300 text-sm mt-2">
                        ✅ Please use a regular wallet: MetaMask, Rainbow, Rabby, etc.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Insufficient Balance Warning */}
              {giftData && giftData[1] && contractBalance !== null && giftData[0] === '0x0000000000000000000000000000000000000000' && BigInt(contractBalance) < BigInt(giftData[1]) && (
                <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">💸</div>
                    <div>
                      <p className="text-red-400 font-bold text-lg mb-2">CONTRACT HAS INSUFFICIENT ETH!</p>
                      <p className="text-red-300 text-sm mb-3">
                        The contract needs <strong>{formatUnits(BigInt(giftData[1]), 18)} ETH</strong> to pay out this gift, but only has <strong>{formatUnits(BigInt(contractBalance), 18)} ETH</strong>.
                      </p>
                      <p className="text-red-200 text-sm font-semibold">
                        ❌ This is a CRITICAL BUG in the smart contract!
                      </p>
                      <p className="text-yellow-300 text-sm mt-2">
                        The potato creator's ETH should be in the contract. Check the contract on BaseScan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <TokenSelector
                selectedToken={selectedToken}
                onSelect={setSelectedToken}
                amount={amount}
                onAmountChange={setAmount}
              />

              {/* Transaction Progress */}
              <TransactionProgress
                isPending={isClaiming && !isConfirming}
                isConfirming={isConfirming}
                isSuccess={isSuccess}
              />

              {/* Error Message */}
              {claimError && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4">
                  <p className="text-red-400 font-semibold">⚠️ {claimError}</p>
                </div>
              )}

              {/* Approval Button (for ERC20) */}
              {needsApproval() && !isNativeToken(selectedToken.address) && (
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full bg-yellow-600 text-dark py-4 rounded-xl font-bold text-xl hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApproving ? (
                    <span>Approving... ⏳</span>
                  ) : (
                    <span>1️⃣ Approve {selectedToken.symbol} First</span>
                  )}
                </button>
              )}

              {/* Claim Button */}
              <button
                onClick={handleClaimGift}
                disabled={!amount || isClaiming || isConfirming || needsApproval() || isCreator || isGiftClaimed}
                className="w-full bg-gradient-to-r from-toxic to-purple text-dark py-5 rounded-xl font-black text-2xl hover:shadow-lg hover:shadow-toxic/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-pulse"
              >
                {isClaiming || isConfirming ? (
                  <span>⏳ CLAIMING... PLEASE WAIT</span>
                ) : needsApproval() && !isNativeToken(selectedToken.address) ? (
                  <span>2️⃣ Claim Your Gift Now 🔗</span>
                ) : (
                  <span>🔗 Claim Your Gift Now</span>
                )}
              </button>

              {/* Info */}
              <div className="bg-gradient-to-r from-dark/90 to-dark-card/90 rounded-xl p-5 space-y-3 border border-toxic/30">
                <div className="text-center text-base text-toxic font-bold mb-3 border-b border-toxic/20 pb-2">
                  ⚡ What Happens When You Click:
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">✅ You give:</span>
                  <span className="text-white font-bold">{amount || '0'} {selectedToken.symbol}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">✅ You receive:</span>
                  <span className="text-toxic font-bold text-lg">??? (Surprise! 🎁)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">✅ You get new link:</span>
                  <span className="text-purple font-bold">To share next!</span>
                </div>
                <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-800">
                  All in ONE transaction - instant swap!
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* Why This Is Fun */}
          <div className="mt-8 bg-dark-card/50 rounded-xl p-6 border border-purple/30">
            <h4 className="text-lg font-bold gradient-text mb-3">🎰 Why This Is Fun:</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>🎁 <strong>Surprise factor:</strong> You don't know what you're getting!</li>
              <li>🤝 <strong>Fair trade:</strong> You give something to receive something</li>
              <li>⛓️ <strong>Endless chain:</strong> Your potato continues the game</li>
              <li>💰 <strong>Real value:</strong> Actual crypto, not fake internet points</li>
              <li>⚡ <strong>Instant:</strong> One click = claim + create new potato</li>
            </ul>
          </div>
        </div>
        </main>

        {/* Bottom Bar (formerly Sidebar) */}
        <Sidebar isBottomBar={true} />

        {/* Success Modal */}
        {showSuccess && successData && (
          <>
            {console.log('🚨🚨🚨 CLAIM PAGE RENDERING SUCCESS MODAL 🚨🚨🚨')}
            {console.log('showSuccess:', showSuccess)}
            {console.log('successData:', successData)}
            {console.log('Type being passed:', "claim")}
            <SuccessModal
              type="claim"
              data={successData}
              onClose={() => {
                console.log('Claim modal closed')
                setShowSuccess(false)
              }}
            />
          </>
        )}
      </div>
      )}
    </NetworkGuard>
  )
}
