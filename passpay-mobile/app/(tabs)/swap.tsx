import { AppColors } from "@/constants/theme";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useState } from "react";
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

// Raydium SDK types are commented out for now
// For production, uncomment and install: @raydium-io/raydium-sdk
// import { Liquidity, Token, TokenAmount, TOKEN_PROGRAM_ID, Percent } from '@raydium-io/raydium-sdk';

const APP_SCHEME = "passpaymobile://swap";
const RPC_URL = "https://api.devnet.solana.com";

// Common Devnet tokens (you would fetch these dynamically in production)
const TOKENS = {
  SOL: {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
  },
  USDC: {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
};

export default function SwapScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();
  const [fromToken, setFromToken] = useState("SOL");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  const handleSwap = async () => {
    if (!isConnected || !smartWalletPubkey) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (fromToken === toToken) {
      Alert.alert("Error", "Please select different tokens");
      return;
    }

    try {
      setLoading(true);
      setTxSignature("");

      Alert.alert(
        "Swap Demo",
        `This is a demonstration of Raydium swap integration.\n\nYou would swap:\n${amount} ${fromToken} → ${toToken}\n\nIn production, this would:\n1. Fetch pool data from Raydium\n2. Calculate swap amounts\n3. Create swap instructions\n4. Sign with passkey\n5. Send gasless transaction`,
        [
          {
            text: "Continue Demo",
            onPress: async () => {
              // Simulate transaction delay
              await new Promise((resolve) => setTimeout(resolve, 2000));

              const mockSignature = "demo_tx_" + Date.now();
              setTxSignature(mockSignature);
              Alert.alert(
                "Success",
                `Swap demonstration complete!\n\nIn production, this would be a real Raydium swap transaction signed with your passkey.`
              );
              setAmount("");
            },
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setLoading(false),
          },
        ]
      );

      /* 
      PRODUCTION IMPLEMENTATION WOULD BE:
      
      const connection = new Connection(RPC_URL, 'confirmed');
      
      // 1. Get pool keys for the token pair from Raydium API
      const poolKeys = await fetchPoolKeys(fromToken, toToken);
      
      // 2. Create token objects
      const fromTokenInfo = TOKENS[fromToken];
      const toTokenInfo = TOKENS[toToken];
      
      const inputToken = new Token(
        TOKEN_PROGRAM_ID,
        new PublicKey(fromTokenInfo.mint),
        fromTokenInfo.decimals,
        fromTokenInfo.symbol,
        fromTokenInfo.symbol
      );
      
      // 3. Calculate swap amounts
      const amountIn = new TokenAmount(inputToken, parseFloat(amount) * (10 ** fromTokenInfo.decimals));
      
      // 4. Get user token accounts
      const walletTokenAccounts = await getWalletTokenAccount(connection, new PublicKey(wallet.smartWallet));
      
      // 5. Create swap instruction
      const { innerTransaction } = await Liquidity.makeSwapInstruction({
        poolKeys,
        userKeys: {
          owner: new PublicKey(wallet.smartWallet),
          tokenAccountIn: walletTokenAccounts[fromToken],
          tokenAccountOut: walletTokenAccounts[toToken],
        },
        amountIn: amountIn,
        amountOut: minimumAmountOut,
        fixedSide: 'in',
      });
      
      // 6. Sign and send with LazorKit (gasless)
      const signature = await signAndSendTransaction(
        {
          instructions: innerTransaction.instructions,
          transactionOptions: {
            feeToken: 'USDC',
            clusterSimulation: 'devnet',
            computeUnitLimit: 500_000,
          },
        },
        {
          redirectUrl: APP_SCHEME,
          onSuccess: (sig) => {
            setTxSignature(sig);
            Alert.alert('Success', 'Swap completed!');
          },
          onFail: (error) => {
            Alert.alert('Error', 'Swap failed');
          },
        }
      );
      */
    } catch (error: any) {
      console.error("Swap error:", error);
      Alert.alert("Error", error.message || "Failed to execute swap");
    } finally {
      setLoading(false);
    }
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
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
              editable={!loading}
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
              <Text style={styles.label}>To</Text>
              <Text style={styles.tokenSymbol}>{toToken}</Text>
            </View>
            <Text style={styles.estimatedAmount}>~0.00</Text>
          </View>

          {/* Swap Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rate</Text>
              <Text style={styles.infoValue}>
                1 {fromToken} ≈ -- {toToken}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Slippage</Text>
              <Text style={styles.infoValue}>0.5%</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Network Fee</Text>
              <Text style={styles.infoValue}>Gasless 🎉</Text>
            </View>
          </View>

          {/* Swap Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSwap}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={AppColors.background} />
            ) : (
              <Text style={styles.buttonText}>Swap Tokens</Text>
            )}
          </TouchableOpacity>

          {txSignature && (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>✅ Swap Demo Complete</Text>
              <Text style={styles.successText}>
                This demonstrates the Raydium integration with LazorKit passkey
                authentication
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>🔄 Raydium Integration</Text>
          <Text style={styles.infoBoxText}>
            • Swap tokens on Raydium DEX{"\n"}• Authenticated with passkey{"\n"}
            • Gasless transactions via paymaster{"\n"}• Best rates from
            liquidity pools
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

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
