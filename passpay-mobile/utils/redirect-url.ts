/**
 * Get the correct redirect URL based on the environment
 * - Expo Go: Uses exp:// scheme with slug
 * - Standalone Build: Uses custom scheme (passpaymobile://)
 */
import Constants from "expo-constants";
import * as Linking from "expo-linking";

export function getRedirectUrl(path: string = ""): string {
  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    // Use Expo's deep linking for Expo Go app
    // Format: exp://your-ip:8081/--/path
    const url = Linking.createURL(path);
    console.log("📱 Using Expo Go redirect URL:", url);
    return url;
  } else {
    // Use custom scheme for standalone builds
    const customUrl = `passpaymobile://${path}`;
    console.log("🏗️ Using standalone redirect URL:", customUrl);
    return customUrl;
  }
}
