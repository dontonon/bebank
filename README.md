# 🎁 PASS IT ON - Blind Gifting Chain

> Give blindly. Receive surprisingly. Pass it on.

A crypto gifting game where mystery meets pay-it-forward. You don't know what you're getting until you give.

![Base](https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=ethereum&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)

## 🎮 How It Works

### Step 1: Create Mystery Gift
- Connect wallet
- Choose token (ETH, USDC, DAI, etc.) + amount (min 0.0001)
- Get shareable link
- Share: "I just passed on something... claim it 👀"

### Step 2: Claim Blindly
- Receiver clicks link → sees "Mystery Gift 🎁" (NO PREVIEW!)
- To claim, must give their own gift (min 0.0001 of any token)
- Transaction executes:
  - Claimer receives **99%** of previous gift
  - **1%** → protocol treasury
  - Claimer's gift becomes new mystery

### Step 3: Reveal & Repeat
- **REVEAL**: Claimer finally sees what they got! ✨
- Gets new shareable link for their mystery
- Chain continues infinitely...

## 🧠 Psychological Hooks

- **Blind commitment** = higher engagement
- **Delayed gratification** = dopamine hit on reveal
- **Fair trade** = everyone gives $1+, gets $1+ back (minus 1%)
- **Curiosity > greed** = must participate to satisfy curiosity

## ⚡ Features

- ✅ **Multi-token support** (ETH, USDC, DAI, WETH, cbETH)
- ✅ **Blind claiming** (no preview before commitment)
- ✅ **Reveal animation** (epic dopamine hit)
- ✅ **Shareable links** (viral spreading)
- ✅ **99/1 split** (sustainable revenue model)
- ✅ **Base blockchain** (fast, cheap transactions)
- ✅ **RainbowKit wallet** (best wallet UX)

## 🛠️ Tech Stack

**Smart Contract:**
- Solidity ^0.8.20
- Base (EVM)
- 99% to claimer, 1% protocol fee

**Frontend:**
- React 18.3.1
- Vite 5.4.2
- TailwindCSS 3.4.1
- wagmi + viem (Web3)
- RainbowKit (wallet)
- Framer Motion (animations)
- React Router (routing)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Configuration

1. **Get WalletConnect Project ID:**
   - Go to https://cloud.walletconnect.com/
   - Create a project
   - Copy your Project ID

2. **Update wagmi config:**
   - Edit `src/config/wagmi.js`
   - Replace `YOUR_PROJECT_ID` with your WalletConnect ID

3. **Deploy Smart Contract:**
   - Deploy `contracts/PassItOn.sol` to Base
   - Update contract address in `src/config/wagmi.js`

## 📝 Smart Contract

**PassItOn.sol** - Main contract

Key functions:
- `createGift(address token, uint256 amount)` - Create new mystery gift
- `claimGift(uint256 giftIdToClaim, address newGiftToken, uint256 newGiftAmount)` - Claim gift + create new one
- `getGift(uint256 giftId)` - View gift details

**Fee Structure:**
- 99% to claimer
- 1% to protocol treasury

**Minimum:** 0.0001 tokens (prevents spam)

## 🎨 Design

**Colors:**
- Dark background: `#0A0E27`
- Cards: `#1A1F3A`
- Toxic green: `#00FF88`
- Neon purple: `#9D4EDD`

**Animations:**
- Float animation for gift emoji
- Reveal animation (scale + rotate)
- Smooth transitions everywhere

## 🔮 Future Features

- [ ] Leaderboards (fastest claims, longest chains, biggest surprises)
- [ ] Chain visualization graph
- [ ] "Mystery meter" showing avg value
- [ ] Premium features (custom messages, gift bombs)
- [ ] Sponsored gifts (protocols seed chains)
- [ ] Rarity tracker (% distribution of tokens)
- [ ] Social proof (recent claims feed)

## 📊 Example Flow

```
Alice adds 5 USDC
  ↓
Bob claims blindly, adds 0.001 ETH
  ↓ Bob gets 4.95 USDC (99%)
  ↓ 0.05 USDC → treasury (1%)
  ↓
Carol claims blindly, adds 100 DAI
  ↓ Carol gets 0.00099 ETH (99%)
  ↓ 0.00001 ETH → treasury (1%)
  ↓
[continues...]
```

## 🤝 Contributing

This is a hackathon/experimental project. Feel free to fork and build on it!

## 📄 License

MIT

## 🔗 Links

- **Base:** https://base.org
- **WalletConnect:** https://walletconnect.com
- **RainbowKit:** https://rainbowkit.com

---

**Built with ❤️ on Base**

*Give blindly. Receive surprisingly. Pass it on.*
