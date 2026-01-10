/**
 * Transfer Screen Styles
 */

import { AppColors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const transferStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
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
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  infoCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: AppColors.gray,
    lineHeight: 20,
  },
  walletCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: AppColors.gray,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  address: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "500",
  },
  copiedText: {
    fontSize: 12,
    color: AppColors.primary,
    marginTop: 8,
    fontWeight: "500",
  },
  inputCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: AppColors.gray,
    marginBottom: 12,
    fontWeight: "500",
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: AppColors.text,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  sendButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sendButtonText: {
    color: AppColors.background,
    fontSize: 18,
    fontWeight: "bold",
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.text,
  },
  historyTime: {
    fontSize: 12,
    color: AppColors.gray,
  },
  historyRecipient: {
    fontSize: 12,
    color: AppColors.gray,
    fontFamily: "monospace",
    marginBottom: 8,
  },
  historyLink: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: "500",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
