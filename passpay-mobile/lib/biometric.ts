/**
 * Biometric authentication helper functions
 * Handles Face ID, Touch ID, and fallback to PIN
 */

import * as LocalAuthentication from "expo-local-authentication";
import { BiometricAuthResult, BiometricError, BiometricType } from "../types";
import { BIOMETRIC_CONFIG, ERROR_MESSAGES } from "./constants";

/**
 * Check if device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error("Error checking biometric support:", error);
    return false;
  }
}

/**
 * Check if biometric authentication is enrolled
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error("Error checking biometric enrollment:", error);
    return false;
  }
}

/**
 * Get available biometric types
 */
export async function getAvailableBiometricTypes(): Promise<BiometricType[]> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const biometricTypes: BiometricType[] = [];

    types.forEach((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          biometricTypes.push("FaceID");
          break;
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          biometricTypes.push("TouchID");
          break;
        case LocalAuthentication.AuthenticationType.IRIS:
          biometricTypes.push("Iris");
          break;
      }
    });

    if (biometricTypes.length === 0) {
      biometricTypes.push("PIN");
    }

    return biometricTypes;
  } catch (error) {
    console.error("Error getting biometric types:", error);
    return ["None"];
  }
}

/**
 * Get primary biometric type for display
 */
export async function getPrimaryBiometricType(): Promise<BiometricType> {
  const types = await getAvailableBiometricTypes();

  // Priority: FaceID > TouchID > Fingerprint > Iris > PIN
  if (types.includes("FaceID")) return "FaceID";
  if (types.includes("TouchID")) return "TouchID";
  if (types.includes("Fingerprint")) return "Fingerprint";
  if (types.includes("Iris")) return "Iris";
  if (types.includes("PIN")) return "PIN";

  return "None";
}

/**
 * Get friendly name for biometric type
 */
export function getBiometricDisplayName(type: BiometricType): string {
  switch (type) {
    case "FaceID":
      return "Face ID";
    case "TouchID":
    case "Fingerprint":
      return "Fingerprint";
    case "Iris":
      return "Iris";
    case "PIN":
      return "PIN";
    default:
      return "Biometric";
  }
}

/**
 * Authenticate user with biometrics
 */
export async function authenticateWithBiometric(
  promptMessage?: string,
  cancelLabel?: string
): Promise<BiometricAuthResult> {
  try {
    // Check if device supports biometrics
    const isSupported = await isBiometricSupported();
    if (!isSupported) {
      return {
        success: false,
        error: "not_available",
      };
    }

    // Check if biometric is enrolled
    const isEnrolled = await isBiometricEnrolled();
    if (!isEnrolled) {
      return {
        success: false,
        error: "not_enrolled",
      };
    }

    // Attempt authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || BIOMETRIC_CONFIG.PROMPT_MESSAGE,
      cancelLabel: cancelLabel || BIOMETRIC_CONFIG.FALLBACK_LABEL,
      disableDeviceFallback: false, // Allow PIN fallback
    });

    if (result.success) {
      return { success: true };
    }

    // Handle authentication failure
    const errorType = getErrorType(result.error);
    return {
      success: false,
      error: errorType,
    };
  } catch (error) {
    console.error("Biometric authentication error:", error);
    return {
      success: false,
      error: "unknown",
    };
  }
}

/**
 * Map LocalAuthentication error to our error types
 */
function getErrorType(error: string | undefined): BiometricAuthResult["error"] {
  if (!error) return "unknown";

  if (error.includes("cancel") || error.includes("user_cancel")) {
    return "user_cancel";
  }
  if (error.includes("lockout")) {
    return "lockout";
  }
  if (error.includes("not_available")) {
    return "not_available";
  }
  if (error.includes("not_enrolled")) {
    return "not_enrolled";
  }

  return "unknown";
}

/**
 * Get user-friendly error message
 */
export function getBiometricErrorMessage(
  error: BiometricAuthResult["error"]
): string {
  switch (error) {
    case "not_available":
      return ERROR_MESSAGES.BIOMETRIC_NOT_AVAILABLE;
    case "not_enrolled":
      return ERROR_MESSAGES.BIOMETRIC_NOT_ENROLLED;
    case "lockout":
      return ERROR_MESSAGES.BIOMETRIC_LOCKOUT;
    case "user_cancel":
      return ERROR_MESSAGES.BIOMETRIC_CANCELLED;
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

/**
 * Throw BiometricError if authentication fails
 */
export async function requireBiometricAuth(
  promptMessage?: string
): Promise<void> {
  const result = await authenticateWithBiometric(promptMessage);

  if (!result.success) {
    const errorMessage = getBiometricErrorMessage(result.error);
    throw new BiometricError(result.error || "unknown", errorMessage);
  }
}

/**
 * Check biometric availability and return setup instructions
 */
export async function getBiometricSetupInfo(): Promise<{
  available: boolean;
  enrolled: boolean;
  type: BiometricType;
  message: string;
}> {
  const isSupported = await isBiometricSupported();
  const isEnrolled = await isBiometricEnrolled();
  const type = await getPrimaryBiometricType();
  const displayName = getBiometricDisplayName(type);

  let message = "";
  if (!isSupported) {
    message =
      "This device does not support biometric authentication. You can use your device PIN instead.";
  } else if (!isEnrolled) {
    message = `Please set up ${displayName} in your device settings to use biometric authentication.`;
  } else {
    message = `${displayName} is ready to use.`;
  }

  return {
    available: isSupported,
    enrolled: isEnrolled,
    type,
    message,
  };
}
