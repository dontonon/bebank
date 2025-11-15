// ERC20 Token ABI (standard functions we need)
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  }
]

// PassItOn Contract ABI
export const PASS_IT_ON_ABI = [
  {
    name: 'createGift',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'giftId', type: 'uint256' }]
  },
  {
    name: 'claimGift',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'giftIdToClaim', type: 'uint256' },
      { name: 'newGiftToken', type: 'address' },
      { name: 'newGiftAmount', type: 'uint256' }
    ],
    outputs: [{ name: 'newGiftId', type: 'uint256' }]
  },
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
        { name: 'claimedAt', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'isGiftClaimable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'giftId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }]
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
  },
  {
    type: 'event',
    name: 'GiftCreated',
    inputs: [
      { name: 'giftId', type: 'uint256', indexed: true },
      { name: 'giver', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'GiftClaimed',
    inputs: [
      { name: 'oldGiftId', type: 'uint256', indexed: true },
      { name: 'newGiftId', type: 'uint256', indexed: true },
      { name: 'claimer', type: 'address', indexed: true },
      { name: 'receivedToken', type: 'address', indexed: false },
      { name: 'receivedAmount', type: 'uint256', indexed: false },
      { name: 'givenToken', type: 'address', indexed: false },
      { name: 'givenAmount', type: 'uint256', indexed: false }
    ]
  }
]
