/**
 * Home Screen Styles
 */

import { AppColors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 16,
  },
  balancesCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  balancesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  balancesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
  },
  mainBalanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    paddingVertical: 20,
  },
  mainBalanceValue: {
    fontSize: 42,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  mainBalanceSymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.text,
    marginLeft: 8,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  tokenInfo: {
    flexDirection: "column",
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.text,
  },
  tokenName: {
    fontSize: 12,
    color: AppColors.gray,
    marginTop: 2,
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primary,
  },
  stakedBalance: {
    color: AppColors.warning,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.background,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
  },
  noBalancesText: {
    fontSize: 14,
    color: AppColors.gray,
    textAlign: "center",
    paddingVertical: 16,
  },
  refreshHint: {
    fontSize: 11,
    color: AppColors.gray,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
});
