/**
 * Memo Screen Styles
 */

import { AppColors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const memoStyles = StyleSheet.create({
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
  textArea: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: AppColors.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: AppColors.gray,
    textAlign: "right",
    marginTop: 8,
  },
  sendButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
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
  historyMessage: {
    fontSize: 14,
    color: AppColors.text,
    fontStyle: "italic",
    marginBottom: 8,
  },
  historyMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
