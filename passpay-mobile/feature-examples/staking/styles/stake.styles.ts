/**
 * Stake Screen Styles
 */

import { AppColors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const stakeStyles = StyleSheet.create({
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
  balanceCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: AppColors.gray,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: AppColors.text,
  },
  infoCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  inputCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.text,
    textAlign: "center",
  },
  minAmount: {
    fontSize: 12,
    color: AppColors.gray,
    textAlign: "center",
    marginTop: 8,
  },
  validatorSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 16,
  },
  noValidators: {
    fontSize: 14,
    color: AppColors.gray,
    textAlign: "center",
    padding: 20,
  },
  validatorItem: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "transparent",
  },
  validatorSelected: {
    borderColor: AppColors.primary,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  validatorInfo: {
    flex: 1,
  },
  validatorName: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 4,
    fontFamily: "monospace",
  },
  validatorStake: {
    fontSize: 12,
    color: AppColors.gray,
  },
  checkmark: {
    fontSize: 20,
    color: AppColors.primary,
    fontWeight: "bold",
  },
  stakeButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  stakeButtonDisabled: {
    opacity: 0.5,
  },
  stakingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stakeButtonText: {
    color: AppColors.background,
    fontSize: 18,
    fontWeight: "bold",
  },
  accountsSection: {
    marginTop: 8,
  },
  accountItem: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  accountAddress: {
    fontSize: 14,
    color: AppColors.text,
    fontFamily: "monospace",
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stateText: {
    fontSize: 10,
    color: AppColors.background,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.text,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
