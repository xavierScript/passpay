import { AppColors } from "@/constants/theme";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const APP_SCHEME = "passpaymobile://";

export default function HomeScreen() {
  const {
    connect,
    isConnected,
    smartWalletPubkey,
    disconnect,
    isConnecting,
    signMessage,
  } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<{
    signature: string;
    signedPayload: string;
  } | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const handleSignMessage = async () => {
    setSignature(null);
    setSignError(null);
    setSigning(true);
    try {
      const sig = await signMessage("Welcome to PassPay!", {
        redirectUrl: APP_SCHEME,
      });
      console.log("Verified Signature:", sig); // Log as per docs
      setSignature(sig);
    } catch (e: any) {
      console.error("Sign error:", e);
      setSignError(e?.message || "Failed to sign message");
    } finally {
      setSigning(false);
    }
  };

  const handleConnect = async () => {
    if (isConnecting || isLoading) return;

    try {
      setIsLoading(true);
      await connect({
        redirectUrl: APP_SCHEME,
        onSuccess: (wallet) => {
          console.log("Connected successfully:", wallet.smartWallet);
          setIsLoading(false);
        },
        onFail: (error) => {
          console.error("Connection failed:", error);
          Alert.alert("Connection Failed", error?.message || "Unknown error");
          setIsLoading(false);
        },
      });
    } catch (error: any) {
      console.error("Error connecting:", error);
      Alert.alert("Error", error?.message || "Failed to connect");
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({
        onSuccess: () => {
          console.log("Disconnected");
          setSignature(null); // Clear signature on disconnect
        },
        onFail: (error) => {
          console.error("Disconnect failed:", error);
          Alert.alert("Error", "Failed to disconnect");
        },
      });
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      Alert.alert("Error", error?.message || "Failed to disconnect");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>PassPay</Text>
        <Text style={styles.subtitle}>Passkey-Powered Solana Wallet</Text>

        {isConnected && smartWalletPubkey ? (
          <View style={styles.walletContainer}>
            {/* Wallet Info Card */}
            <View style={styles.walletCard}>
              <Text style={styles.label}>Wallet Address</Text>
              <Text
                style={styles.address}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {smartWalletPubkey.toBase58()}
              </Text>
              <Text style={styles.infoText}>✓ Connected with Passkey</Text>
            </View>

            {/* Sign Message Button */}
            <TouchableOpacity
              style={[styles.button, signing && styles.buttonDisabled]}
              onPress={handleSignMessage}
              disabled={signing}
            >
              {signing ? (
                <ActivityIndicator color={AppColors.background} />
              ) : (
                <Text style={styles.buttonText}>Sign Message</Text>
              )}
            </TouchableOpacity>

            {/* Display Signature */}
            {signature && (
              <View style={styles.signatureCard}>
                <Text style={styles.label}>Verified Signature</Text>
                <Text
                  style={styles.signatureText}
                  numberOfLines={2}
                  ellipsizeMode="middle"
                >
                  {signature.signature}
                </Text>
                <Text style={styles.label}>Signed Payload</Text>
                <Text
                  style={styles.payloadText}
                  numberOfLines={2}
                  ellipsizeMode="middle"
                >
                  {signature.signedPayload}
                </Text>
              </View>
            )}

            {/* Display Error */}
            {signError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>❌ {signError}</Text>
              </View>
            )}

            {/* Disconnect Button */}
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleDisconnect}
            >
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.connectContainer}>
            <Text style={styles.description}>
              Create or connect your wallet using biometric authentication
              (FaceID, TouchID, or fingerprint)
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                (isConnecting || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleConnect}
              disabled={isConnecting || isLoading}
            >
              {isConnecting || isLoading ? (
                <ActivityIndicator color={AppColors.background} />
              ) : (
                <Text style={styles.buttonText}>Connect with Passkey</Text>
              )}
            </TouchableOpacity>

            <View style={styles.features}>
              <FeatureItem text="🔐 Biometric Security" />
              <FeatureItem text="⚡ Gasless Transactions" />
              <FeatureItem text="🔄 Token Swaps" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureText}>{text}</Text>
    </View>
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
    justifyContent: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: AppColors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.gray,
    textAlign: "center",
    marginBottom: 48,
  },
  connectContainer: {
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    color: AppColors.text,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  walletContainer: {
    width: "100%",
  },
  walletCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    color: AppColors.gray,
    marginBottom: 8,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 16,
    color: AppColors.text,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
  },
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.gray,
    marginTop: 12,
  },
  buttonText: {
    color: AppColors.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonSecondaryText: {
    color: AppColors.text,
  },
  signatureCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
  },
  signatureText: {
    fontSize: 12,
    color: AppColors.text,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  payloadText: {
    fontSize: 12,
    color: AppColors.gray,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: "#2A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
  },
  features: {
    marginTop: 32,
    width: "100%",
  },
  featureItem: {
    paddingVertical: 12,
  },
  featureText: {
    fontSize: 16,
    color: AppColors.text,
    textAlign: "center",
  },
});
