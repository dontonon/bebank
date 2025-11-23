import { Alchemy, Network } from 'alchemy-sdk';

/**
 * Get Alchemy network from chain ID
 */
function getAlchemyNetwork(chainId) {
  switch (chainId) {
    case 8453: // Base Mainnet
      return Network.BASE_MAINNET;
    case 84532: // Base Sepolia
      return Network.BASE_SEPOLIA;
    default:
      return Network.BASE_SEPOLIA;
  }
}

/**
 * Get all ERC20 tokens in a wallet with balances > 0
 */
export async function getWalletTokens(walletAddress, chainId) {
  try {
    const config = {
      apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
      network: getAlchemyNetwork(chainId),
    };

    const alchemy = new Alchemy(config);

    // Get all token balances
    const balances = await alchemy.core.getTokenBalances(walletAddress);

    // Filter out zero balances
    const nonZeroBalances = balances.tokenBalances.filter(
      token => token.tokenBalance !== '0' && token.tokenBalance !== null
    );

    if (nonZeroBalances.length === 0) {
      return [];
    }

    // Fetch metadata for each token in parallel
    const tokensWithMetadata = await Promise.all(
      nonZeroBalances.map(async (token) => {
        try {
          const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);

          return {
            address: token.contractAddress,
            balance: token.tokenBalance,
            symbol: metadata.symbol || 'UNKNOWN',
            name: metadata.name || 'Unknown Token',
            decimals: metadata.decimals || 18,
            logo: metadata.logo || null,
          };
        } catch (error) {
          console.error(`Failed to get metadata for ${token.contractAddress}:`, error);
          return null;
        }
      })
    );

    // Filter out failed metadata fetches
    return tokensWithMetadata.filter(token => token !== null);
  } catch (error) {
    console.error('Error fetching wallet tokens:', error);
    return [];
  }
}

/**
 * Get USD prices for multiple tokens from CoinGecko
 */
export async function getTokenPrices(tokenAddresses, chainId) {
  try {
    if (tokenAddresses.length === 0) return {};

    // For Base mainnet use 'base', for testnet we can't get real prices
    const platform = chainId === 8453 ? 'base' : 'base';

    // CoinGecko supports up to 250 addresses per request
    const addressesString = tokenAddresses.join(',');

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/${platform}` +
      `?contract_addresses=${addressesString}` +
      `&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('CoinGecko API error:', response.status);
      return {};
    }

    const prices = await response.json();
    return prices;
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error);
    return {};
  }
}

/**
 * Enrich tokens with USD prices and filter by minimum value
 */
export async function getValidTokensForPotato(walletAddress, chainId, minUSD = 1) {
  try {
    // 1. Get all tokens in wallet
    const tokens = await getWalletTokens(walletAddress, chainId);

    if (tokens.length === 0) {
      console.log('No tokens found in wallet');
      return [];
    }

    console.log(`Found ${tokens.length} tokens in wallet`);

    // 2. Get prices for all tokens
    const tokenAddresses = tokens.map(t => t.address);
    const prices = await getTokenPrices(tokenAddresses, chainId);

    // 3. Calculate USD values and filter
    const enrichedTokens = tokens
      .map(token => {
        const priceUSD = prices[token.address.toLowerCase()]?.usd || 0;
        const balanceInTokens = Number(token.balance) / Math.pow(10, token.decimals);
        const valueUSD = balanceInTokens * priceUSD;

        return {
          ...token,
          priceUSD,
          balanceFormatted: balanceInTokens.toFixed(6),
          valueUSD: Number(valueUSD.toFixed(2)),
          icon: token.logo || '🪙',
        };
      })
      .filter(token => {
        // On testnet, we can't get real prices, so allow all tokens
        if (chainId !== 8453) {
          return true;
        }
        // On mainnet, only show tokens worth >= $1
        return token.valueUSD >= minUSD;
      })
      .sort((a, b) => b.valueUSD - a.valueUSD); // Sort by value (highest first)

    console.log(`${enrichedTokens.length} tokens meet minimum value requirement`);
    return enrichedTokens;
  } catch (error) {
    console.error('Error in getValidTokensForPotato:', error);
    return [];
  }
}
