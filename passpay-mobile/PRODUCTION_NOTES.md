# Production Implementation Notes

This file contains detailed notes for implementing the full production version of the Raydium swap functionality.

## 🔄 Raydium Swap - Full Implementation

The current swap screen (`app/(tabs)/swap.tsx`) shows a **demonstration flow**. Here's how to implement the actual Raydium swap:

### 1. Fetch Pool Information

You need to fetch pool data from Raydium's API:

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import {
  Liquidity,
  LiquidityPoolKeys,
  jsonInfo2PoolKeys,
} from "@raydium-io/raydium-sdk";

// Fetch pool keys for a token pair
async function fetchPoolKeys(
  tokenAMint: string,
  tokenBMint: string
): Promise<LiquidityPoolKeys> {
  // Option 1: Use Raydium API
  const response = await fetch(
    "https://api.raydium.io/v2/sdk/liquidity/mainnet.json"
  );
  const data = await response.json();

  // Find the pool for your token pair
  const pool = data.official.find(
    (p: any) =>
      (p.baseMint === tokenAMint && p.quoteMint === tokenBMint) ||
      (p.baseMint === tokenBMint && p.quoteMint === tokenAMint)
  );

  if (!pool) throw new Error("Pool not found");

  // Convert to pool keys
  return jsonInfo2PoolKeys(pool);
}
```

### 2. Get User Token Accounts

```typescript
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenAccount } from "@raydium-io/raydium-sdk";

async function getWalletTokenAccount(
  connection: Connection,
  wallet: PublicKey
): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });

  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPLToken.AccountLayout.decode(i.account.data),
  }));
}
```

### 3. Calculate Swap Amounts

```typescript
import {
  Liquidity,
  TokenAmount,
  Token,
  Percent,
} from "@raydium-io/raydium-sdk";
import Decimal from "decimal.js";

async function calculateSwapAmounts(
  connection: Connection,
  poolKeys: LiquidityPoolKeys,
  inputToken: Token,
  outputToken: Token,
  amountIn: number,
  slippage: number = 0.5 // 0.5%
) {
  // Fetch pool info
  const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

  // Calculate amount in (with decimals)
  const amountInToken = new TokenAmount(
    inputToken,
    new Decimal(amountIn).mul(10 ** inputToken.decimals).toFixed(0)
  );

  // Calculate amount out
  const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
    poolKeys,
    poolInfo,
    amountIn: amountInToken,
    currencyOut: outputToken,
    slippage: new Percent(slippage * 100, 10000), // 0.5% = 50/10000
  });

  return {
    amountOut,
    minAmountOut, // Use this to prevent slippage
  };
}
```

### 4. Create Swap Instruction

```typescript
async function createSwapInstruction(
  connection: Connection,
  poolKeys: LiquidityPoolKeys,
  wallet: PublicKey,
  tokenAccounts: TokenAccount[],
  fromTokenMint: PublicKey,
  toTokenMint: PublicKey,
  amountIn: TokenAmount,
  minAmountOut: TokenAmount
) {
  // Find user's token accounts
  const fromTokenAccount = tokenAccounts.find(
    (acc) => acc.accountInfo.mint.toBase58() === fromTokenMint.toBase58()
  );

  const toTokenAccount = tokenAccounts.find(
    (acc) => acc.accountInfo.mint.toBase58() === toTokenMint.toBase58()
  );

  if (!fromTokenAccount || !toTokenAccount) {
    throw new Error("Token accounts not found");
  }

  // Create swap instruction
  const { innerTransaction } = await Liquidity.makeSwapInstruction({
    poolKeys,
    userKeys: {
      owner: wallet,
      tokenAccountIn: fromTokenAccount.pubkey,
      tokenAccountOut: toTokenAccount.pubkey,
    },
    amountIn,
    amountOut: minAmountOut,
    fixedSide: "in",
  });

  return innerTransaction.instructions;
}
```

### 5. Execute Swap with LazorKit

```typescript
import { useWallet } from "@lazorkit/wallet-mobile-adapter";

async function executeSwap(fromToken: string, toToken: string, amount: number) {
  const { signAndSendTransaction, wallet } = useWallet();

  if (!wallet) throw new Error("Wallet not connected");

  const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  // 1. Fetch pool keys
  const poolKeys = await fetchPoolKeys(fromToken, toToken);

  // 2. Create token objects
  const inputToken = new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey(fromToken),
    9, // decimals - fetch from token metadata
    "TOKEN1",
    "TOKEN1"
  );

  const outputToken = new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey(toToken),
    6,
    "TOKEN2",
    "TOKEN2"
  );

  // 3. Calculate amounts
  const { minAmountOut } = await calculateSwapAmounts(
    connection,
    poolKeys,
    inputToken,
    outputToken,
    amount,
    0.5 // 0.5% slippage
  );

  // 4. Get user token accounts
  const tokenAccounts = await getWalletTokenAccount(
    connection,
    new PublicKey(wallet.smartWallet)
  );

  // 5. Create swap instructions
  const amountInToken = new TokenAmount(
    inputToken,
    new Decimal(amount).mul(10 ** inputToken.decimals).toFixed(0)
  );

  const instructions = await createSwapInstruction(
    connection,
    poolKeys,
    new PublicKey(wallet.smartWallet),
    tokenAccounts,
    new PublicKey(fromToken),
    new PublicKey(toToken),
    amountInToken,
    minAmountOut
  );

  // 6. Sign and send with LazorKit (gasless)
  const signature = await signAndSendTransaction(
    {
      instructions,
      transactionOptions: {
        feeToken: "USDC", // Paymaster pays fees in USDC
        clusterSimulation: "mainnet",
        computeUnitLimit: 500_000, // Raydium swaps need higher compute
      },
    },
    {
      redirectUrl: "passpaymobile://swap",
      onSuccess: (sig) => {
        console.log("Swap successful:", sig);
      },
      onFail: (error) => {
        console.error("Swap failed:", error);
      },
    }
  );

  return signature;
}
```

### 6. Token Selection UI

Add a token picker component:

```typescript
import { useState } from "react";
import { Modal, FlatList, TouchableOpacity, Text } from "react-native";

interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI: string;
}

function TokenPicker({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (token: TokenInfo) => void;
  onClose: () => void;
}) {
  // Fetch token list from Solana token list or Raydium API
  const [tokens, setTokens] = useState<TokenInfo[]>([]);

  useEffect(() => {
    // Fetch from https://token-list-api.solana.cloud/v1/list
    // Or from Raydium's token list
  }, []);

  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <FlatList
        data={tokens}
        keyExtractor={(item) => item.mint}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelect(item)}>
            <Text>
              {item.symbol} - {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </Modal>
  );
}
```

### 7. Error Handling

```typescript
try {
  await executeSwap(fromToken, toToken, amount);
} catch (error: any) {
  if (error.message.includes("Pool not found")) {
    Alert.alert("Error", "No liquidity pool found for this token pair");
  } else if (error.message.includes("insufficient")) {
    Alert.alert("Error", "Insufficient balance");
  } else if (error.message.includes("slippage")) {
    Alert.alert(
      "Error",
      "Price changed too much. Try again with higher slippage"
    );
  } else {
    Alert.alert("Error", "Swap failed. Please try again");
  }
}
```

## 📦 Additional Dependencies Needed

For full production implementation, you may need:

```bash
npm install bn.js @project-serum/anchor
```

## 🔐 Security Considerations

1. **Slippage Protection** - Always use `minAmountOut` to prevent MEV attacks
2. **Token Validation** - Verify token mints against a trusted token list
3. **Amount Validation** - Check user has sufficient balance before creating transaction
4. **Network Errors** - Handle RPC failures gracefully
5. **Price Impact** - Warn users about large price impacts (>5%)

## 🎯 Testing Production Swap

1. **Start on Devnet** - Test with devnet tokens first
2. **Use Small Amounts** - Test with minimal amounts on mainnet
3. **Verify Prices** - Compare with Raydium UI to ensure correct calculations
4. **Monitor Gas** - Ensure paymaster is covering fees correctly
5. **Check Slippage** - Test during high volatility periods

## 📚 Resources

- [Raydium SDK Documentation](https://github.com/raydium-io/raydium-sdk)
- [Raydium SDK Examples](https://github.com/raydium-io/raydium-sdk/tree/master/example)
- [Solana Token List](https://github.com/solana-labs/token-list)
- [Raydium API](https://api.raydium.io/v2/sdk/liquidity/mainnet.json)

## 🚨 Important Notes

1. **Pool Data Caching** - Cache pool keys to reduce API calls
2. **Transaction Confirmation** - Wait for transaction confirmation before updating UI
3. **Price Updates** - Refresh swap amounts when user changes input
4. **Associated Token Accounts** - Create ATAs if they don't exist
5. **Compute Budget** - Raydium swaps may need increased compute units

## 💡 Optimization Tips

1. Use versioned transactions (v0) with lookup tables for better efficiency
2. Batch multiple swaps if needed
3. Implement price impact warnings
4. Add transaction history
5. Cache token metadata locally

---

For any issues or questions about the production implementation, refer to the Raydium SDK examples or LazorKit documentation.
