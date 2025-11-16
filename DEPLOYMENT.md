# 🚀 DEPLOYMENT GUIDE - PASS IT ON

<!-- Last updated: Nov 16, 2025 - Fixed Claim page ConnectButton bug -->

## Step 1: Deploy Smart Contract to Base Sepolia ✅

### Using Remix IDE (Easiest Method)

#### 1.1 Open Remix
Go to: **https://remix.ethereum.org/**

#### 1.2 Create the Contract File
1. In the left sidebar, click "File Explorer" (📁)
2. Click the "+" icon to create a new file
3. Name it: `PassItOn.sol`
4. Copy the entire contract from `contracts/PassItOn.sol` in this repo
5. Paste it into Remix

#### 1.3 Compile the Contract
1. Click "Solidity Compiler" icon (left sidebar)
2. Select compiler version: **0.8.20** or higher
3. Click "Compile PassItOn.sol"
4. Wait for green checkmark ✓

#### 1.4 Deploy to Base Sepolia
1. Click "Deploy & Run Transactions" icon (left sidebar)
2. In "ENVIRONMENT" dropdown, select **"Injected Provider - MetaMask"**
3. MetaMask will pop up → Connect your wallet
4. **IMPORTANT:** Switch MetaMask to **Base Sepolia** network
   - Network name: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency: ETH
   - Block Explorer: https://sepolia.basescan.org

5. Under "CONTRACT" dropdown, select **PassItOn**
6. You'll see a constructor parameter box (orange)
7. Enter your treasury address (the address that will receive the 1% fees)
   - Example: `0xYourWalletAddress`
   - **Use your own wallet address to receive fees**

8. Click **"Deploy"** (orange button)
9. MetaMask will pop up asking to confirm transaction
10. Confirm and wait ~5 seconds

#### 1.5 Get Your Contract Address
Once deployed:
1. Look at the bottom of the Deploy panel
2. You'll see "Deployed Contracts" section
3. Copy the contract address (starts with 0x...)
4. **SAVE THIS ADDRESS** - you'll need it in Step 2

Example: `0x1234567890abcdef1234567890abcdef12345678`

---

## Step 2: Verify Contract on BaseScan (Optional but Recommended)

1. Go to: https://sepolia.basescan.org/
2. Search for your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Fill in:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.20+commit.xxxx
   - License: MIT
6. Paste your contract code
7. Enter constructor arguments (your treasury address)
8. Click "Verify and Publish"

This makes your contract publicly verified (green checkmark on BaseScan)

---

## Step 3: Update Contract Address in Code

**Once you have the deployed contract address, give it to me and I'll update the code!**

Just paste the address here and I'll:
1. Update `src/config/wagmi.js` with your contract address
2. Rebuild the app
3. Commit and push to GitHub

---

## Step 4: Test Locally

After I update the address:
```bash
cd /home/user/bebank
npm run dev
```

Then:
1. Open http://localhost:5173
2. Connect your wallet (MetaMask on Base Sepolia)
3. Create a test gift (min 0.0001 ETH)
4. Share the link
5. Open in another browser/wallet to claim

---

## Troubleshooting

**"Insufficient funds"**
- You need Base Sepolia ETH
- Get free testnet ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

**"Wrong network"**
- Make sure MetaMask is on Base Sepolia (Chain ID: 84532)

**"Contract not deploying"**
- Check you have enough ETH for gas (~$0.50 worth)
- Make sure compiler version is 0.8.20+

**"Constructor parameter error"**
- Make sure you enter a valid Ethereum address (0x...)
- Use your own wallet address

---

## 🎯 What You Need to Do NOW:

1. ✅ Go to https://remix.ethereum.org/
2. ✅ Create PassItOn.sol
3. ✅ Copy contract code from `contracts/PassItOn.sol`
4. ✅ Compile with 0.8.20
5. ✅ Deploy to Base Sepolia with your treasury address
6. ✅ Copy the deployed contract address
7. ✅ Give me the address here

Then I'll handle the rest! 🚀
