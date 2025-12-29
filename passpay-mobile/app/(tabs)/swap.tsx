import { AppColors } from "@/constants/theme";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { Raydium, parseTokenAccountResp } from "@raydium-io/raydium-sdk-v2";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const APP_SCHEME = "passpaymobile://";
const RPC_URL = "https://api.devnet.solana.com";

// Devnet token configurations
const TOKENS = {
  SOL: {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    name: "Wrapped SOL",
  },
  USDC: {
    symbol: "USDC",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    decimals: 6,
    name: "USD Coin",
  },
};

type TokenSymbol = keyof typeof TOKENS;

export default function SwapScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();
  const [connection] = useState(() => new Connection(RPC_URL, "confirmed"));
  const [raydium, setRaydium] = useState<any>(null);

  const [fromToken, setFromToken] = useState<TokenSymbol>("SOL");
  const [toToken, setToToken] = useState<TokenSymbol>("USDC");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializingSDK, setInitializingSDK] = useState(false);
  const [txSignature, setTxSignature] = useState("");
  const [poolInfo, setPoolInfo] = useState<any>(null);
  const [estimatedOutput, setEstimatedOutput] = useState("0.00");
  const [priceImpact, setPriceImpact] = useState("0.00");

  // Initialize Raydium SDK when wallet connects
  useEffect(() => {
    if (isConnected && smartWalletPubkey && !raydium) {
      initializeRaydiumSDK();
    }
  }, [isConnected, smartWalletPubkey]);

  // Fetch pool info when tokens change
  useEffect(() => {
    if (raydium && isConnected) {
      fetchPoolInfo();
    }
  }, [fromToken, toToken, raydium]);

  // Calculate swap output when amount changes
  useEffect(() => {
    if (amount && poolInfo && raydium) {
      calculateSwapOutput();
    }
  }, [amount, poolInfo]);

  /**
   * Initialize Raydium SDK
   */
  const initializeRaydiumSDK = async () => {
    try {
      setInitializingSDK(true);
      console.log("Initializing Raydium SDK...");

      // Guard against missing owner (TypeScript: PublicKey | null)
      if (!smartWalletPubkey) {
        console.warn(
          "initializeRaydiumSDK: missing smartWalletPubkey, aborting"
        );
        return;
      }

      // use a local non-null `owner` so TS can infer `PublicKey`
      const owner: PublicKey = smartWalletPubkey;

      // Fetch token accounts for the wallet
      const solAccountResp = await connection.getAccountInfo(owner);
      const tokenAccountResp = await connection.getTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID,
      });
      const token2022Req = await connection.getTokenAccountsByOwner(owner, {
        programId: TOKEN_2022_PROGRAM_ID,
      });

      // Parse token account data
      const tokenAccountData = parseTokenAccountResp({
        owner,
        solAccountResp,
        tokenAccountResp: {
          context: tokenAccountResp.context,
          value: [...tokenAccountResp.value, ...token2022Req.value],
        },
      });

      // Initialize Raydium SDK
      const raydiumInstance = await Raydium.load({
        connection,
        owner, // Just pass PublicKey, not Keypair
        disableLoadToken: false, // Load token info
        tokenAccounts: tokenAccountData.tokenAccounts,
        tokenAccountRawInfos: tokenAccountData.tokenAccountRawInfos,
      });

      setRaydium(raydiumInstance);
      console.log("Raydium SDK initialized successfully");
    } catch (error) {
      console.error("Error initializing Raydium SDK:", error);
      Alert.alert(
        "Initialization Error",
        "Failed to initialize Raydium SDK. Please try reconnecting your wallet."
      );
    } finally {
      setInitializingSDK(false);
    }
  };

  /**
   * Fetch pool information for the token pair
   */
  const fetchPoolInfo = async () => {
    if (!raydium) return;

    try {
      console.log(`Fetching pool for ${fromToken}/${toToken}...`);

      const mint1 = TOKENS[fromToken].mint;
      const mint2 = TOKENS[toToken].mint;

      // Fetch pool by mints (V2 API - works on devnet too!)
      const poolData = await raydium.api.fetchPoolByMints({
        mint1,
        mint2,
      });

      if (poolData && poolData.data && poolData.data.length > 0) {
        const pool = poolData.data[0]; // Get first pool
        setPoolInfo(pool);
        console.log("Pool found:", pool.id);
      } else {
        setPoolInfo(null);
        console.log("No pool found for this pair on devnet");
        Alert.alert(
          "Pool Not Available",
          `No liquidity pool found for ${fromToken}/${toToken} on Devnet.\n\nNote: Devnet has limited pools. Try SOL/USDC if available.`
        );
      }
    } catch (error) {
      console.error("Error fetching pool:", error);
      setPoolInfo(null);
    }
  };

  /**
   * Calculate swap output using Raydium's compute functions
   */
  const calculateSwapOutput = async () => {
    if (!raydium || !poolInfo || !amount) return;

    try {
      const inputAmount = parseFloat(amount);
      if (inputAmount <= 0) {
        setEstimatedOutput("0.00");
        return;
      }

      // Use Raydium's built-in calculation
      const result = await raydium.liquidity.computeAmountOut({
        poolInfo,
        amountIn: inputAmount,
        mintIn: new PublicKey(TOKENS[fromToken].mint),
        mintOut: new PublicKey(TOKENS[toToken].mint),
        slippage: 0.005, // 0.5% slippage
      });

      setEstimatedOutput(result.amountOut.toFixed(6));
      setPriceImpact(result.priceImpact.toFixed(2));
    } catch (error) {
      console.error("Error calculating output:", error);
      setEstimatedOutput("0.00");
    }
  };

  /**
   * Execute the swap
   */
  const handleSwap = async () => {
    if (!isConnected || !smartWalletPubkey) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    if (!raydium) {
      Alert.alert("Error", "Raydium SDK not initialized. Please wait...");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!poolInfo) {
      Alert.alert("Error", "No liquidity pool available for this pair");
      return;
    }

    try {
      setLoading(true);
      setTxSignature("");

      const inputAmount = parseFloat(amount);
      const inputMint = new PublicKey(TOKENS[fromToken].mint);
      const outputMint = new PublicKey(TOKENS[toToken].mint);

      console.log("Preparing swap transaction...");

      // Build swap transaction using Raydium SDK
      const { execute } = await raydium.liquidity.swap({
        poolInfo,
        amountIn: inputAmount,
        mintIn: inputMint,
        mintOut: outputMint,
        slippage: 0.005, // 0.5% slippage
        txVersion: "V0", // Use versioned transaction
      });

      // Execute returns the transaction instructions
      // We need to extract them for Lazorkit
      const swapInstructions = execute.transaction.instructions;

      console.log("Signing and sending transaction with Lazorkit...");

      // Sign and send with Lazorkit (gasless)
      const signature = await signAndSendTransaction(
        {
          instructions: swapInstructions,
          transactionOptions: {
            feeToken: "USDC", // Use USDC for gas fees
            clusterSimulation: "devnet",
            computeUnitLimit: 500_000,
          },
        },
        {
          redirectUrl: APP_SCHEME,
        }
      );

      console.log("Swap successful! Signature:", signature);
      setTxSignature(signature);

      Alert.alert(
        "Swap Successful! 🎉",
        `Swapped ${amount} ${fromToken} for ~${estimatedOutput} ${toToken}\n\nTransaction: ${signature.slice(
          0,
          8
        )}...${signature.slice(-8)}`,
        [
          {
            text: "View on Solscan",
            onPress: () => {
              console.log(`https://solscan.io/tx/${signature}?cluster=devnet`);
            },
          },
          { text: "OK" },
        ]
      );

      // Reset form
      setAmount("");
      setEstimatedOutput("0.00");
    } catch (error: any) {
      console.error("Swap error:", error);

      let errorMessage = "Failed to execute swap";

      if (error.message?.includes("insufficient")) {
        errorMessage = `Insufficient ${fromToken} balance`;
      } else if (error.message?.includes("slippage")) {
        errorMessage = "Price impact too high. Try a smaller amount.";
      } else if (error.message?.includes("0x1")) {
        errorMessage = "Insufficient account balance. Please add devnet SOL.";
      }

      Alert.alert("Swap Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount("");
    setEstimatedOutput("0.00");
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Please connect your wallet first</Text>
          <Text style={styles.emptySubtext}>
            Go to the Wallet tab to connect
          </Text>
        </View>
      </View>
    );
  }

  if (initializingSDK) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            Initializing Raydium...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Token Swap</Text>
        <Text style={styles.subtitle}>Powered by Raydium DEX</Text>

        <View style={styles.swapContainer}>
          {/* From Token */}
          <View style={styles.tokenCard}>
            <View style={styles.tokenHeader}>
              <Text style={styles.label}>From</Text>
              <Text style={styles.tokenSymbol}>{fromToken}</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor={AppColors.gray}
              keyboardType="decimal-pad"
              editable={!loading && poolInfo !== null}
            />
          </View>

          {/* Switch Button */}
          <TouchableOpacity
            style={styles.switchButton}
            onPress={switchTokens}
            disabled={loading}
          >
            <Text style={styles.switchIcon}>⇅</Text>
          </TouchableOpacity>

          {/* To Token */}
          <View style={styles.tokenCard}>
            <View style={styles.tokenHeader}>
              <Text style={styles.label}>To (estimated)</Text>
              <Text style={styles.tokenSymbol}>{toToken}</Text>
            </View>
            <Text style={styles.estimatedAmount}>~{estimatedOutput}</Text>
          </View>

          {/* Swap Info */}
          {poolInfo && (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Price Impact</Text>
                <Text
                  style={[
                    styles.infoValue,
                    parseFloat(priceImpact) > 5 && { color: "#EF4444" },
                  ]}
                >
                  {priceImpact}%
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Slippage Tolerance</Text>
                <Text style={styles.infoValue}>0.5%</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Network Fee</Text>
                <Text style={styles.infoValue}>Gasless 🎉</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Minimum Received</Text>
                <Text style={styles.infoValue}>
                  {(parseFloat(estimatedOutput) * 0.995).toFixed(6)} {toToken}
                </Text>
              </View>
            </View>
          )}

          {/* Swap Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (loading || !poolInfo) && styles.buttonDisabled,
            ]}
            onPress={handleSwap}
            disabled={loading || !poolInfo}
          >
            {loading ? (
              <ActivityIndicator color={AppColors.background} />
            ) : !poolInfo ? (
              <Text style={styles.buttonText}>Pool Not Available</Text>
            ) : (
              <Text style={styles.buttonText}>Swap Tokens</Text>
            )}
          </TouchableOpacity>

          {txSignature && (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>✅ Swap Successful!</Text>
              <Text style={styles.successText}>
                Transaction: {txSignature.slice(0, 8)}...
                {txSignature.slice(-8)}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  console.log(
                    `https://solscan.io/tx/${txSignature}?cluster=devnet`
                  )
                }
              >
                <Text style={styles.linkText}>View on Solscan →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>🔄 Raydium SDK V2</Text>
          <Text style={styles.infoBoxText}>
            • Automatic pool discovery{"\n"}• Real-time price calculations{"\n"}
            • Passkey authentication{"\n"}• Gasless transactions{"\n"}• Price
            impact protection
          </Text>
        </View>

        <View style={[styles.infoBox, { marginTop: 16 }]}>
          <Text style={styles.infoBoxTitle}>⚠️ Devnet Notice</Text>
          <Text style={styles.infoBoxText}>
            Limited pools available on Devnet. Some token pairs may not have
            liquidity. Ensure you have devnet SOL for testing.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ... (styles remain the same as before)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.gray,
    marginBottom: 32,
  },
  swapContainer: {
    marginBottom: 24,
  },
  tokenCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  tokenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: AppColors.gray,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  tokenSymbol: {
    fontSize: 18,
    color: AppColors.primary,
    fontWeight: "bold",
  },
  amountInput: {
    fontSize: 32,
    color: AppColors.text,
    fontWeight: "600",
    padding: 0,
  },
  estimatedAmount: {
    fontSize: 32,
    color: AppColors.gray,
    fontWeight: "600",
  },
  switchButton: {
    alignSelf: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.card,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: -8,
    zIndex: 10,
    borderWidth: 4,
    borderColor: AppColors.background,
  },
  switchIcon: {
    fontSize: 24,
    color: AppColors.primary,
  },
  infoContainer: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: AppColors.gray,
  },
  infoValue: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "500",
  },
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: AppColors.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 18,
    color: AppColors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: AppColors.gray,
  },
  successContainer: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.success,
  },
  successTitle: {
    fontSize: 16,
    color: AppColors.success,
    fontWeight: "bold",
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: AppColors.gray,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: "monospace",
  },
  linkText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  infoBoxTitle: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: AppColors.gray,
    lineHeight: 20,
  },
});
