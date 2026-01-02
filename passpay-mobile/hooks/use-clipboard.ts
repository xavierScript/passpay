/**
 * useClipboard Hook
 *
 * A simple hook for clipboard operations with:
 * - Copy to clipboard with auto-reset feedback
 * - Configurable feedback duration
 * - Error handling
 *
 * @example
 * ```tsx
 * const { copy, copied } = useClipboard();
 *
 * <TouchableOpacity onPress={() => copy(address)}>
 *   <Text>{copied ? '✓ Copied!' : address}</Text>
 * </TouchableOpacity>
 * ```
 */

import * as Clipboard from "expo-clipboard";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";

export interface UseClipboardOptions {
  /** How long to show "copied" state in ms. Default: 2000 */
  feedbackDuration?: number;
  /** Whether to show alert on error. Default: false */
  showErrorAlert?: boolean;
}

export interface UseClipboardReturn {
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Whether text was recently copied */
  copied: boolean;
  /** Reset the copied state manually */
  reset: () => void;
}

export function useClipboard(
  options: UseClipboardOptions = {}
): UseClipboardReturn {
  const { feedbackDuration = 2000, showErrorAlert = false } = options;

  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCopied(false);
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) return false;

      try {
        await Clipboard.setStringAsync(text);
        setCopied(true);

        // Auto-reset after feedback duration
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, feedbackDuration);

        return true;
      } catch (error: any) {
        console.error("[useClipboard] Copy failed:", error);
        if (showErrorAlert) {
          Alert.alert(
            "Copy Failed",
            error?.message || "Failed to copy to clipboard"
          );
        }
        return false;
      }
    },
    [feedbackDuration, showErrorAlert]
  );

  return {
    copy,
    copied,
    reset,
  };
}
