# 🚀 Deployment Guide

Complete guide to deploying your LazorKit-powered app to the App Store and Google Play.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Android Deployment](#android-deployment)
- [iOS Deployment](#ios-deployment)
- [EAS Build (Recommended)](#eas-build-recommended)
- [Production Checklist](#production-checklist)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

### Required Accounts

| Platform | Account                                                | Purpose              |
| -------- | ------------------------------------------------------ | -------------------- |
| Expo     | [expo.dev](https://expo.dev)                           | EAS Build service    |
| Google   | [Play Console](https://play.google.com/console)        | Android distribution |
| Apple    | [App Store Connect](https://appstoreconnect.apple.com) | iOS distribution     |

### Required Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify login
eas whoami
```

### Project Requirements

Ensure your project has:

1. **Unique bundle identifier:**

   ```json
   // app.json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.passpay"
       },
       "android": {
         "package": "com.yourcompany.passpay"
       }
     }
   }
   ```

2. **Custom URL scheme:**

   ```json
   {
     "expo": {
       "scheme": "passpay"
     }
   }
   ```

3. **App icons and splash screens** in `assets/`

---

## Environment Configuration

### Setting Up Environment Variables

Create environment files:

```bash
# .env.development
EXPO_PUBLIC_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_PORTAL_URL=https://portal.lazor.sh
EXPO_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com

# .env.production
EXPO_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
EXPO_PUBLIC_PORTAL_URL=https://portal.lazor.sh
EXPO_PUBLIC_PAYMASTER_URL=https://kora.mainnet.lazorkit.com
```

### Using Environment Variables

```typescript
// config/env.ts
export const config = {
  rpcUrl: process.env.EXPO_PUBLIC_RPC_URL!,
  portalUrl: process.env.EXPO_PUBLIC_PORTAL_URL!,
  paymasterUrl: process.env.EXPO_PUBLIC_PAYMASTER_URL!,
  isProduction: process.env.NODE_ENV === "production",
};
```

### EAS Environment Profiles

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_RPC_URL": "https://api.devnet.solana.com",
        "EXPO_PUBLIC_PAYMASTER_URL": "https://kora.devnet.lazorkit.com"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_RPC_URL": "https://api.devnet.solana.com",
        "EXPO_PUBLIC_PAYMASTER_URL": "https://kora.devnet.lazorkit.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_RPC_URL": "https://api.mainnet-beta.solana.com",
        "EXPO_PUBLIC_PAYMASTER_URL": "https://kora.mainnet.lazorkit.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Android Deployment

### 1. Configure app.json

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.passpay",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#512DA8"
      },
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT"
      ],
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "passpay"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 2. Generate Keystore

For production builds, create a upload key:

```bash
# EAS manages this automatically, but for manual:
keytool -genkeypair -v \
  -keystore passpay-upload.keystore \
  -alias passpay-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 3. Build APK/AAB

```bash
# For testing (APK)
eas build --platform android --profile preview

# For Play Store (AAB)
eas build --platform android --profile production
```

### 4. Submit to Play Store

```bash
# Automatic submission
eas submit --platform android

# Or download and upload manually
eas build:list --platform android
# Download the AAB and upload via Play Console
```

### Android-Specific Configurations

```gradle
// android/app/build.gradle

android {
    defaultConfig {
        minSdkVersion 24  // Required for passkeys
        targetSdkVersion 34
    }
}
```

---

## iOS Deployment

### 1. Configure app.json

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.passpay",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSFaceIDUsageDescription": "This app uses Face ID to sign transactions securely.",
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["passpay"]
          }
        ]
      },
      "associatedDomains": ["applinks:yourdomain.com"]
    }
  }
}
```

### 2. Apple Developer Setup

1. **Create App ID** in Apple Developer Portal
2. **Enable Associated Domains** capability
3. **Create provisioning profiles** for development and distribution

### 3. Build for iOS

```bash
# For TestFlight
eas build --platform ios --profile production

# With automatic credentials
eas build --platform ios --profile production --auto-submit
```

### 4. Submit to App Store

```bash
# Automatic submission to TestFlight
eas submit --platform ios

# Or use Transporter app for manual upload
```

### iOS-Specific Configurations

```json
// app.json - Full iOS config
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.passpay",
      "buildNumber": "1.0.0",
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "NSFaceIDUsageDescription": "Authenticate transactions with Face ID",
        "LSApplicationQueriesSchemes": ["https"]
      }
    }
  }
}
```

---

## EAS Build (Recommended)

### Initial Setup

```bash
# Initialize EAS in your project
eas build:configure

# This creates eas.json with default profiles
```

### Build Profiles

```json
// eas.json - Complete configuration
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890"
      }
    }
  }
}
```

### Build Commands

```bash
# Development build (with dev client)
eas build --profile development

# Preview build (internal testing)
eas build --profile preview

# Production build
eas build --profile production

# Build both platforms
eas build --profile production --platform all
```

### Monitoring Builds

```bash
# View build status
eas build:list

# View specific build
eas build:view [build-id]

# Cancel a build
eas build:cancel [build-id]
```

---

## Production Checklist

### Before Submitting

#### Code Quality

- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Linting clean: `npm run lint`
- [ ] No console.logs in production code

#### Configuration

- [ ] Bundle identifier is unique and correct
- [ ] Version and build numbers updated
- [ ] Environment variables set for production
- [ ] RPC endpoint is mainnet (if applicable)
- [ ] Paymaster URL is production

#### Security

- [ ] No hardcoded secrets
- [ ] API keys in environment variables
- [ ] Proper error messages (no sensitive data)

#### Assets

- [ ] App icon at correct sizes
- [ ] Splash screen configured
- [ ] Screenshots prepared for stores

### App Store Requirements

#### iOS App Store

- [ ] Privacy policy URL
- [ ] App description (up to 4000 chars)
- [ ] Keywords (100 chars max)
- [ ] Screenshots for all device sizes
- [ ] App preview video (optional)
- [ ] Age rating questionnaire completed

#### Google Play Store

- [ ] Privacy policy URL
- [ ] App description
- [ ] Screenshots (phone and tablet)
- [ ] Feature graphic (1024x500)
- [ ] Content rating questionnaire
- [ ] Target audience declaration

---

## Post-Deployment

### Monitoring

#### Error Tracking

```bash
# Install Sentry
npx expo install @sentry/react-native

# Configure in app
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: __DEV__ ? "development" : "production"
});
```

#### Analytics

```typescript
// Track wallet connections
analytics.track("wallet_connected", {
  method: "passkey",
});

// Track transactions
analytics.track("transaction_sent", {
  type: "transfer",
  gasless: true,
});
```

### Updates

#### Over-the-Air Updates (OTA)

```bash
# Push an update
eas update --branch production --message "Bug fixes"

# View updates
eas update:list
```

#### Native Updates

For changes requiring native code:

```bash
# Increment version in app.json
# Then build new version
eas build --profile production
eas submit --platform all
```

### Troubleshooting Deployment

#### Build Fails

```bash
# Check build logs
eas build:view [build-id]

# Clear cache and rebuild
eas build --clear-cache --profile production
```

#### Store Rejection

Common reasons:

1. **Crypto regulations** - Ensure compliance with App Store crypto guidelines
2. **Missing privacy policy** - Add valid privacy policy URL
3. **Incomplete metadata** - Fill all required fields
4. **Crashes** - Test thoroughly on real devices

#### Deep Links Not Working

1. Verify scheme in app.json
2. Check intent filters (Android) / URL types (iOS)
3. Test with: `npx uri-scheme open passpay://`

---

## Version Management

### Semantic Versioning

```json
{
  "expo": {
    "version": "1.2.3",
    "ios": {
      "buildNumber": "45"
    },
    "android": {
      "versionCode": 45
    }
  }
}
```

- **Major (1.x.x)**: Breaking changes
- **Minor (x.1.x)**: New features
- **Patch (x.x.1)**: Bug fixes

### Auto-increment with EAS

```json
// eas.json
{
  "build": {
    "production": {
      "ios": {
        "autoIncrement": "buildNumber"
      },
      "android": {
        "autoIncrement": "versionCode"
      }
    }
  }
}
```

---

## Security Considerations

### Production Hardening

```typescript
// Disable dev tools in production
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}
```

### Certificate Pinning (Optional)

```typescript
// For high-security apps
import { fetch } from "react-native-ssl-pinning";

const response = await fetch(url, {
  sslPinning: {
    certs: ["cert1", "cert2"],
  },
});
```

### API Security

- Use HTTPS only
- Validate all inputs
- Rate limit API calls
- Monitor for abuse

---

## Related Documentation

- [Installation Guide](./INSTALLATION.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
