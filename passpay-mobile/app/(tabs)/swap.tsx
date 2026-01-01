/**
 * Swap Screen - Raydium Token Swap Integration with LazorKit
 *
 * This screen allows users to swap tokens using Raydium's AMM on Solana devnet.
 * Transactions are signed and sent using LazorKit's passkey-based smart wallet.
 */

import { AppColors } from "@/constants/theme";
import {
  DEVNET_TOKENS,
  formatTokenAmount,
  getSwapQuote,
  parseTokenAmount,
  prepareSwapInstructions,
  SwapQuote,
  TOKEN_INFO,
} from "@/services/raydium-swap";
import { getRedirectUrl } from "@/utils/redirect-url";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { Connection } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const DEVNET_RPC = "https://api.devnet.solana.com";

// Available tokens for swapping
const SWAP_TOKENS = [
  { mint: DEVNET_TOKENS.SOL, ...TOKEN_INFO[DEVNET_TOKENS.SOL] },
  { mint: DEVNET_TOKENS.USDC, ...TOKEN_INFO[DEVNET_TOKENS.USDC] },
  { mint: DEVNET_TOKENS.RAY, ...TOKEN_INFO[DEVNET_TOKENS.RAY] },
];

type TokenOption = (typeof SWAP_TOKENS)[number];

export default function SwapScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();

  // Form state
  const [inputToken, setInputToken] = useState<TokenOption>(SWAP_TOKENS[0]); // SOL default
  const [outputToken, setOutputToken] = useState<TokenOption>(SWAP_TOKENS[1]); // USDC default
  const [inputAmount, setInputAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5"); // 0.5% default

  // Quote state
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Transaction state
  const [swapping, setSwapping] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  // Token selector modal
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"input" | "output">("input");

  // Connection instance
  const connection = new Connection(DEVNET_RPC, "confirmed");

  // Debounced quote fetching
  useEffect(() => {
    const fetchQuote = async () => {
      if (!inputAmount || parseFloat(inputAmount) <= 0) {
        setQuote(null);
        setQuoteError(null);
        return;
      }

      if (inputToken.mint === outputToken.mint) {
        setQuoteError("Please select different tokens");
        setQuote(null);
        return;
      }

      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const amountInSmallestUnits = parseTokenAmount(
          inputAmount,
          inputToken.decimals
        );

        const slippageBps = Math.floor(parseFloat(slippage) * 100);

        const quoteResult = await getSwapQuote(
          inputToken.mint,
          outputToken.mint,
          amountInSmallestUnits,
          slippageBps
        );

        setQuote(quoteResult);
      } catch (error: any) {
        console.error("Quote error:", error);
        setQuoteError(
          error?.response?.data?.msg ||
            error?.message ||
            "Failed to get quote. The pool may not exist on devnet."
        );
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [inputAmount, inputToken, outputToken, slippage]);

  const handleSwapTokens = useCallback(() => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setInputAmount("");
    setQuote(null);
  }, [inputToken, outputToken]);

  const openTokenSelector = (type: "input" | "output") => {
    setSelectingFor(type);
    setShowTokenSelector(true);
  };

  const selectToken = (token: TokenOption) => {
    if (selectingFor === "input") {
      if (token.mint === outputToken.mint) {
        // Swap them
        setOutputToken(inputToken);
      }
      setInputToken(token);
    } else {
      if (token.mint === inputToken.mint) {
        // Swap them
        setInputToken(outputToken);
      }
      setOutputToken(token);
    }
    setShowTokenSelector(false);
    setQuote(null);
    setInputAmount("");
  };

  const handleSwap = async () => {
    if (!isConnected || !smartWalletPubkey) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    if (!quote) {
      Alert.alert("Error", "Please get a quote first");
      return;
    }

    try {
      setSwapping(true);
      setTxSignature("");

      const walletAddress = smartWalletPubkey.toBase58();
      const amountInSmallestUnits = parseTokenAmount(
        inputAmount,
        inputToken.decimals
      );
      const slippageBps = Math.floor(parseFloat(slippage) * 100);

      console.log("Preparing swap:", {
        walletAddress,
        inputMint: inputToken.mint,
        outputMint: outputToken.mint,
        amount: amountInSmallestUnits,
        slippage: slippageBps,
      });

      // Prepare swap instructions
      const { quote: freshQuote, transactions } = await prepareSwapInstructions(
        connection,
        walletAddress,
        inputToken.mint,
        outputToken.mint,
        amountInSmallestUnits,
        slippageBps
      );

      console.log(`Got ${transactions.length} transaction(s) to sign`);

      // For LazorKit, we need to extract instructions from the versioned transaction
      // and use signAndSendTransaction. However, since Raydium returns versioned
      // transactions with address lookup tables, we need a different approach.
      //
      // The LazorKit adapter should handle versioned transactions if we pass
      // the addressLookupTableAccounts in transactionOptions.

      // For now, we'll extract the instructions from the first transaction
      const transaction = transactions[0];
      const message = transaction.message;

      // Get the static account keys for instruction reconstruction
      const staticAccountKeys = message.staticAccountKeys;

      // Build instructions from compiled instructions
      const instructions = message.compiledInstructions.map((ix) => {
        const programId = staticAccountKeys[ix.programIdIndex];
        const keys = ix.accountKeyIndexes.map((index) => ({
          pubkey: staticAccountKeys[index],
          isSigner: message.isAccountSigner(index),
          isWritable: message.isAccountWritable(index),
        }));

        return {
          programId,
          keys,
          data: Buffer.from(ix.data),
        };
      });

      console.log(`Extracted ${instructions.length} instructions`);

      // Get address lookup table accounts if present
      const lookupTableAccounts = message.addressTableLookups || [];

      // Sign and send via LazorKit
      const signature = await signAndSendTransaction(
        {
          instructions,
          transactionOptions: {
            clusterSimulation: "devnet",
            computeUnitLimit: 400_000, // Higher limit for complex swap txs
            // Note: LazorKit paymaster handles gas fees
          },
        },
        {
          redirectUrl: getRedirectUrl("swap"),
          onSuccess: (sig) => {
            console.log("Swap successful:", sig);
            setTxSignature(sig);
            setInputAmount("");
            setQuote(null);
            Alert.alert(
              "Swap Successful! 🎉",
              `Swapped ${inputAmount} ${inputToken.symbol} for ${
                outputToken.symbol
              }\n\nTransaction: ${sig.substring(0, 20)}...`
            );
          },
          onFail: (error) => {
            console.error("Swap failed:", error);
            Alert.alert(
              "Swap Failed",
              error?.message || "Transaction failed. Please try again."
            );
          },
        }
      );

      console.log("Swap signature:", signature);
    } catch (error: any) {
      console.error("Swap error:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to execute swap. Please try again."
      );
    } finally {
      setSwapping(false);
    }
  };

  const getOutputAmount = () => {
    if (!quote) return "0";
    return formatTokenAmount(quote.data.outputAmount, outputToken.decimals, 6);
  };

  const getPriceImpact = () => {
    if (!quote) return "0";
    return quote.data.priceImpactPct.toFixed(4);
  };

  // Not connected state
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={styles.title}>Swap Tokens</Text>
        <Text style={styles.subtitle}>
          Swap tokens via Raydium on Solana Devnet
        </Text>

        {/* Input Token Section */}
        <View style={styles.swapCard}>
          <Text style={styles.cardLabel}>You Pay</Text>
          <View style={styles.tokenRow}>
            <TouchableOpacity
              style={styles.tokenSelector}
              onPress={() => openTokenSelector("input")}
            >
              <Text style={styles.tokenSymbol}>{inputToken.symbol}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              value={inputAmount}
              onChangeText={setInputAmount}
              placeholder="0.0"
              placeholderTextColor={AppColors.gray}
              keyboardType="decimal-pad"
              editable={!swapping}
            />
          </View>
          <Text style={styles.tokenName}>{inputToken.name}</Text>
        </View>

        {/* Swap Direction Button */}
        <TouchableOpacity
          style={styles.swapButton}
          onPress={handleSwapTokens}
          disabled={swapping}
        >
          <Text style={styles.swapIcon}>⇅</Text>
        </TouchableOpacity>

        {/* Output Token Section */}
        <View style={styles.swapCard}>
          <Text style={styles.cardLabel}>You Receive</Text>
          <View style={styles.tokenRow}>
            <TouchableOpacity
              style={styles.tokenSelector}
              onPress={() => openTokenSelector("output")}
            >
              <Text style={styles.tokenSymbol}>{outputToken.symbol}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            <View style={styles.outputContainer}>
              {quoteLoading ? (
                <ActivityIndicator color={AppColors.primary} />
              ) : (
                <Text style={styles.outputAmount}>{getOutputAmount()}</Text>
              )}
            </View>
          </View>
          <Text style={styles.tokenName}>{outputToken.name}</Text>
        </View>

        {/* Quote Info */}
        {quote && (
          <View style={styles.quoteInfo}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Price Impact</Text>
              <Text
                style={[
                  styles.quoteValue,
                  parseFloat(getPriceImpact()) > 1 && styles.warningText,
                ]}
              >
                {getPriceImpact()}%
              </Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Slippage Tolerance</Text>
              <Text style={styles.quoteValue}>{slippage}%</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Network</Text>
              <Text style={styles.quoteValue}>Devnet</Text>
            </View>
          </View>
        )}

        {/* Error Message */}
        {quoteError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{quoteError}</Text>
          </View>
        )}

        {/* Slippage Settings */}
        <View style={styles.slippageContainer}>
          <Text style={styles.slippageLabel}>Slippage (%)</Text>
          <View style={styles.slippageOptions}>
            {["0.1", "0.5", "1.0"].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.slippageOption,
                  slippage === value && styles.slippageOptionActive,
                ]}
                onPress={() => setSlippage(value)}
              >
                <Text
                  style={[
                    styles.slippageOptionText,
                    slippage === value && styles.slippageOptionTextActive,
                  ]}
                >
                  {value}%
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.slippageInput}
              value={slippage}
              onChangeText={setSlippage}
              placeholder="Custom"
              placeholderTextColor={AppColors.gray}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!quote || swapping || quoteLoading) && styles.buttonDisabled,
          ]}
          onPress={handleSwap}
          disabled={!quote || swapping || quoteLoading}
        >
          {swapping ? (
            <ActivityIndicator color={AppColors.background} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {!inputAmount
                ? "Enter an amount"
                : !quote
                ? "Getting quote..."
                : `Swap ${inputToken.symbol} for ${outputToken.symbol}`}
            </Text>
          )}
        </TouchableOpacity>

        {/* Transaction Success */}
        {txSignature && (
          <View style={styles.successContainer}>
            <Text style={styles.successTitle}>✅ Swap Completed</Text>
            <Text style={styles.successText} numberOfLines={1}>
              {txSignature}
            </Text>
            <Text style={styles.explorerLink}>
              View on Solana Explorer (Devnet)
            </Text>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Devnet Mode</Text>
          <Text style={styles.infoText}>
            This swap uses Raydium pools on Solana Devnet. Tokens have no real
            value. Transaction fees are sponsored by LazorKit paymaster.
          </Text>
        </View>
      </View>

      {/* Token Selector Modal */}
      <Modal
        visible={showTokenSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTokenSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Token</Text>
            {SWAP_TOKENS.map((token) => (
              <TouchableOpacity
                key={token.mint}
                style={styles.tokenOption}
                onPress={() => selectToken(token)}
              >
                <View>
                  <Text style={styles.tokenOptionSymbol}>{token.symbol}</Text>
                  <Text style={styles.tokenOptionName}>{token.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTokenSelector(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.gray,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    color: AppColors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: AppColors.gray,
    textAlign: "center",
  },
  swapCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: AppColors.gray,
    marginBottom: 8,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tokenSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.text,
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 10,
    color: AppColors.gray,
  },
  tokenName: {
    fontSize: 12,
    color: AppColors.gray,
    marginTop: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: AppColors.text,
    textAlign: "right",
    marginLeft: 16,
  },
  outputContainer: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 16,
  },
  outputAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: AppColors.primary,
  },
  swapButton: {
    alignSelf: "center",
    backgroundColor: AppColors.card,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    borderWidth: 3,
    borderColor: AppColors.background,
  },
  swapIcon: {
    fontSize: 20,
    color: AppColors.primary,
  },
  quoteInfo: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  quoteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: 14,
    color: AppColors.gray,
  },
  quoteValue: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "500",
  },
  warningText: {
    color: AppColors.error,
  },
  errorContainer: {
    backgroundColor: `${AppColors.error}20`,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: AppColors.error,
    fontSize: 14,
    textAlign: "center",
  },
  slippageContainer: {
    marginTop: 20,
  },
  slippageLabel: {
    fontSize: 14,
    color: AppColors.gray,
    marginBottom: 8,
  },
  slippageOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slippageOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: AppColors.card,
  },
  slippageOptionActive: {
    backgroundColor: AppColors.primary,
  },
  slippageOptionText: {
    color: AppColors.text,
    fontSize: 14,
  },
  slippageOptionTextActive: {
    color: AppColors.background,
    fontWeight: "600",
  },
  slippageInput: {
    flex: 1,
    backgroundColor: AppColors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    color: AppColors.text,
    fontSize: 14,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.background,
  },
  successContainer: {
    backgroundColor: `${AppColors.success}20`,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.success,
    marginBottom: 8,
  },
  successText: {
    fontSize: 12,
    color: AppColors.text,
    marginBottom: 4,
  },
  explorerLink: {
    fontSize: 12,
    color: AppColors.primary,
    textDecorationLine: "underline",
  },
  infoBox: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: AppColors.gray,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  tokenOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: AppColors.background,
    marginBottom: 8,
  },
  tokenOptionSymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.text,
  },
  tokenOptionName: {
    fontSize: 14,
    color: AppColors.gray,
    marginTop: 2,
  },
  closeButton: {
    marginTop: 12,
    padding: 16,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: AppColors.gray,
  },
});
