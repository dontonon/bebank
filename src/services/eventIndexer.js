import { useEffect, useState } from 'react'
import { usePublicClient, useAccount } from 'wagmi'
import { getContractAddress } from '../config/wagmi'
import { PASS_IT_ON_ABI } from '../config/abis'
import { getTokenByAddress } from '../config/tokens'
import { formatUnits } from 'viem'

const ETH_USD_RATE = 3000 // Hardcoded rate matching other components

/**
 * Hook to fetch and track all potatoes created and claimed
 * Uses blockchain events for accurate real-time data
 */
export function usePotatoEvents(address = null) {
  const { chain } = useAccount()
  const publicClient = usePublicClient()
  const [events, setEvents] = useState({
    created: [],
    claimed: [],
    isLoading: true,
    error: null
  })

  useEffect(() => {
    async function fetchEvents() {
      if (!chain?.id || !publicClient) {
        setEvents(prev => ({ ...prev, isLoading: false }))
        return
      }

      try {
        const contractAddress = getContractAddress(chain.id)

        // Get current block number
        const currentBlock = await publicClient.getBlockNumber()

        // Fetch events from the last 10,000 blocks (adjust as needed)
        // For production, you'd want to index from deployment block
        const fromBlock = currentBlock - 10000n > 0n ? currentBlock - 10000n : 0n

        // Fetch GiftCreated events
        const createdEvents = await publicClient.getLogs({
          address: contractAddress,
          event: PASS_IT_ON_ABI.find(item => item.name === 'GiftCreated'),
          fromBlock,
          toBlock: 'latest'
        })

        // Fetch GiftClaimed events
        const claimedEvents = await publicClient.getLogs({
          address: contractAddress,
          event: PASS_IT_ON_ABI.find(item => item.name === 'GiftClaimed'),
          fromBlock,
          toBlock: 'latest'
        })

        // Parse created events
        const parsedCreated = createdEvents.map(event => ({
          potatoId: Number(event.args.giftId),
          giver: event.args.giver,
          token: event.args.token,
          amount: event.args.amount,
          timestamp: Number(event.args.timestamp),
          blockNumber: Number(event.blockNumber),
          txHash: event.transactionHash
        }))

        // Parse claimed events
        const parsedClaimed = claimedEvents.map(event => ({
          oldPotatoId: Number(event.args.oldGiftId),
          newPotatoId: Number(event.args.newGiftId),
          claimer: event.args.claimer,
          receivedToken: event.args.receivedToken,
          receivedAmount: event.args.receivedAmount,
          givenToken: event.args.givenToken,
          givenAmount: event.args.givenAmount,
          blockNumber: Number(event.blockNumber),
          txHash: event.transactionHash
        }))

        setEvents({
          created: parsedCreated,
          claimed: parsedClaimed,
          isLoading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }))
      }
    }

    fetchEvents()
  }, [chain?.id, publicClient, address])

  return events
}

/**
 * Hook to calculate user-specific stats from events
 */
export function useUserStats(userAddress) {
  const events = usePotatoEvents()
  const [stats, setStats] = useState({
    potatoesGiven: 0,
    potatoesReceived: 0,
    activePotatoes: 0,
    totalValueGiven: 0,
    totalValueReceived: 0,
    givenPotatoes: [],
    receivedPotatoes: [],
    isLoading: true
  })

  useEffect(() => {
    if (events.isLoading || !userAddress) {
      setStats(prev => ({ ...prev, isLoading: events.isLoading }))
      return
    }

    const lowerAddress = userAddress.toLowerCase()

    // Potatoes user created
    const givenPotatoes = events.created.filter(
      event => event.giver.toLowerCase() === lowerAddress
    )

    // Potatoes user claimed
    const receivedPotatoes = events.claimed.filter(
      event => event.claimer.toLowerCase() === lowerAddress
    )

    // Get IDs of claimed potatoes to determine active count
    const claimedIds = new Set(events.claimed.map(e => e.oldPotatoId))
    const activePotatoes = givenPotatoes.filter(
      potato => !claimedIds.has(potato.potatoId)
    )

    // Calculate total value given (approximate USD)
    const valueGiven = givenPotatoes.reduce((sum, potato) => {
      const token = getTokenByAddress(potato.token)
      if (!token) return sum

      const amountInToken = parseFloat(formatUnits(potato.amount, token.decimals))

      // Rough USD conversion
      if (token.symbol === 'USDC' || token.symbol === 'DAI') {
        return sum + amountInToken
      } else {
        // ETH, WETH, cbETH - use ETH rate
        return sum + (amountInToken * ETH_USD_RATE)
      }
    }, 0)

    // Calculate total value received (approximate USD)
    const valueReceived = receivedPotatoes.reduce((sum, potato) => {
      const token = getTokenByAddress(potato.receivedToken)
      if (!token) return sum

      const amountInToken = parseFloat(formatUnits(potato.receivedAmount, token.decimals))

      // Rough USD conversion
      if (token.symbol === 'USDC' || token.symbol === 'DAI') {
        return sum + amountInToken
      } else {
        // ETH, WETH, cbETH - use ETH rate
        return sum + (amountInToken * ETH_USD_RATE)
      }
    }, 0)

    setStats({
      potatoesGiven: givenPotatoes.length,
      potatoesReceived: receivedPotatoes.length,
      activePotatoes: activePotatoes.length,
      totalValueGiven: valueGiven,
      totalValueReceived: valueReceived,
      givenPotatoes,
      receivedPotatoes,
      isLoading: false
    })
  }, [events, userAddress])

  return stats
}

/**
 * Hook to calculate global stats from events
 */
export function useGlobalStats() {
  const events = usePotatoEvents()
  const [stats, setStats] = useState({
    totalPotatoes: 0,
    totalClaimed: 0,
    activePotatoes: 0,
    totalClaimedValue: 0,
    isLoading: true
  })

  useEffect(() => {
    if (events.isLoading) {
      setStats(prev => ({ ...prev, isLoading: true }))
      return
    }

    const totalPotatoes = events.created.length
    const totalClaimed = events.claimed.length
    const activePotatoes = totalPotatoes - totalClaimed

    // Calculate total claimed value (approximate USD)
    const totalClaimedValue = events.claimed.reduce((sum, potato) => {
      const token = getTokenByAddress(potato.receivedToken)
      if (!token) return sum

      const amountInToken = parseFloat(formatUnits(potato.receivedAmount, token.decimals))

      // Rough USD conversion
      if (token.symbol === 'USDC' || token.symbol === 'DAI') {
        return sum + amountInToken
      } else {
        // ETH, WETH, cbETH - use ETH rate
        return sum + (amountInToken * ETH_USD_RATE)
      }
    }, 0)

    setStats({
      totalPotatoes,
      totalClaimed,
      activePotatoes,
      totalClaimedValue,
      isLoading: false
    })
  }, [events])

  return stats
}

/**
 * Hook to get recent activity across the entire network
 */
export function useRecentActivity(limit = 10) {
  const events = usePotatoEvents()
  const [activity, setActivity] = useState([])

  useEffect(() => {
    if (events.isLoading) {
      setActivity([])
      return
    }

    // Combine all events and sort by block number (descending)
    const allActivity = [
      ...events.created.map(e => ({
        type: 'created',
        potatoId: e.potatoId,
        address: e.giver,
        token: e.token,
        amount: e.amount,
        blockNumber: e.blockNumber,
        txHash: e.txHash,
        timestamp: e.timestamp
      })),
      ...events.claimed.map(e => ({
        type: 'claimed',
        potatoId: e.oldPotatoId,
        newPotatoId: e.newPotatoId,
        address: e.claimer,
        token: e.receivedToken,
        amount: e.receivedAmount,
        blockNumber: e.blockNumber,
        txHash: e.txHash
      }))
    ]

    // Sort by block number descending
    allActivity.sort((a, b) => b.blockNumber - a.blockNumber)

    setActivity(allActivity.slice(0, limit))
  }, [events, limit])

  return activity
}

/**
 * Calculate achievements based on user stats
 */
export function calculateAchievements(userStats) {
  return {
    firstPotato: {
      unlocked: userStats.potatoesGiven >= 1,
      progress: Math.min(userStats.potatoesGiven, 1),
      total: 1,
      emoji: '🥔',
      title: 'First Potato',
      description: 'Create your first HotPotato'
    },
    hotStreak: {
      unlocked: userStats.potatoesGiven >= 5,
      progress: Math.min(userStats.potatoesGiven, 5),
      total: 5,
      emoji: '🔥',
      title: 'Hot Streak',
      description: 'Create 5 HotPotatoes'
    },
    highRoller: {
      unlocked: userStats.totalValueGiven >= 100,
      progress: Math.min(userStats.totalValueGiven, 100),
      total: 100,
      emoji: '💎',
      title: 'High Roller',
      description: 'Give $100+ worth of value'
    },
    speedDemon: {
      unlocked: userStats.potatoesReceived >= 3,
      progress: Math.min(userStats.potatoesReceived, 3),
      total: 3,
      emoji: '⚡',
      title: 'Speed Demon',
      description: 'Claim 3 HotPotatoes'
    }
  }
}
