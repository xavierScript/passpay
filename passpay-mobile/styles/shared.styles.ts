/**
 * Shared Styles - Common styles used across multiple screens
 */

import { AppColors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const sharedStyles = StyleSheet.create({
  // Layout
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

  // Typography
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

  // Empty State
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

  // Info Card
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

  // Input Card
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
    fontSize: 16,
    color: AppColors.text,
  },

  // Primary Action Button
  primaryButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: AppColors.background,
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  // History Section
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
  historyTime: {
    fontSize: 12,
    color: AppColors.gray,
  },
  historyLink: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: "500",
  },
});
