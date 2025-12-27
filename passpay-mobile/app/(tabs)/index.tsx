import { AppColors } from "@/constants/theme";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const APP_SCHEME = "passpaymobile://home";

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
        redirectUrl: "myapp://callback",
      });
      setSignature(sig);
    } catch (e: any) {
      setSignError(e?.message || "Failed to sign message");
    } finally {
      setSigning(false);
    }
  };

  const handleConnect = async () => {
    if (isConnecting || isLoading) return; // Prevent multiple calls

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
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error("Error connecting:", error);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({
        onSuccess: () => console.log("Disconnected"),
        onFail: (error) => console.error("Disconnect failed:", error),
      });
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>PassPay</Text>
        <Text style={styles.subtitle}>Passkey-Powered Solana Wallet</Text>

        {isConnected && smartWalletPubkey ? (
          <View style={styles.walletContainer}>
            <View style={styles.walletCard}>
              <Text style={styles.label}>Wallet Address</Text>
              <Text
                style={styles.address}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {smartWalletPubkey.toBase58()}
              </Text>
              <Text style={styles.infoText}>Connected with Passkey</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleDisconnect}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { marginTop: 12 }]}
              onPress={handleSignMessage}
              disabled={signing}
            >
              <Text style={styles.buttonText}>
                {signing ? "Signing..." : "Sign Message"}
              </Text>
            </TouchableOpacity>

            {signature && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Signature:</Text>
                <Text
                  style={{ fontSize: 12, color: AppColors.text, marginTop: 2 }}
                  numberOfLines={2}
                  ellipsizeMode="middle"
                >
                  {/* Check later */}
                  {signature?.signature.length > 40
                    ? signature.signature.slice(0, 20) +
                      "..." +
                      signature.signature.slice(-20)
                    : signature.signature}
                </Text>
                ) : (
                <>
                  <Text
                    style={{
                      fontSize: 12,
                      color: AppColors.text,
                      marginTop: 2,
                    }}
                    numberOfLines={2}
                    ellipsizeMode="middle"
                  >
                    {signature.signature}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: AppColors.gray,
                      marginTop: 6,
                    }}
                    numberOfLines={2}
                    ellipsizeMode="middle"
                  >
                    Payload: {signature.signedPayload}
                  </Text>
                </>
              </View>
            )}
            {signError && (
              <Text style={{ color: "red", marginTop: 8 }}>{signError}</Text>
            )}
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
    textTransform: "uppercase",
  },
  address: {
    fontSize: 16,
    color: AppColors.text,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.gray,
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
  },
  buttonText: {
    color: AppColors.background,
    fontSize: 16,
    fontWeight: "bold",
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
