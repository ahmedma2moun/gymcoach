# iOS Deployment Guide — Antigravity Gym Mobile

Full guide for building and shipping the Antigravity Gym React Native app to iOS via Expo EAS, TestFlight, and the App Store.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [One-Time Project Setup](#2-one-time-project-setup)
3. [Configure app.json](#3-configure-appjson)
4. [Configure eas.json](#4-configure-easjson)
5. [iOS Certificates & Signing](#5-ios-certificates--signing)
6. [Local Development Build](#6-local-development-build)
7. [Preview Build (Internal Testing)](#7-preview-build-internal-testing)
8. [Production Build & TestFlight](#8-production-build--testflight)
9. [App Store Submission](#9-app-store-submission)
10. [GitHub Actions CI/CD](#10-github-actions-cicd)
11. [Environment Variables](#11-environment-variables)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

### Accounts required

| Account | Purpose | URL |
|---|---|---|
| Apple Developer ($99/yr) | iOS signing, TestFlight, App Store | developer.apple.com |
| Expo account (free) | EAS builds, OTA updates | expo.dev |
| GitHub | Source control, Actions CI/CD | github.com |

### Local tooling

```bash
# Node 20+
node --version

# Install global CLI tools
npm install -g expo-cli eas-cli

# Verify EAS
eas --version   # should be >= 12.0.0
```

### Xcode (optional for local simulator testing)

- Xcode 15+ from the Mac App Store
- iOS 17+ Simulator installed via Xcode → Settings → Platforms

---

## 2. One-Time Project Setup

```bash
cd gymcoach/mobile

# Install dependencies
npm install

# Log in to your Expo account
eas login

# Link this project to EAS (generates projectId)
eas init

# Paste the generated projectId into app.json → expo.extra.eas.projectId
```

---

## 3. Configure app.json

Open `mobile/app.json` and replace the placeholder values:

```json
{
  "expo": {
    "name": "Antigravity Gym",
    "slug": "antigravity-gym",
    "ios": {
      "bundleIdentifier": "com.YOURORG.antigravitygym"
    },
    "extra": {
      "apiBaseUrl": "https://YOUR-VERCEL-APP.vercel.app",
      "eas": {
        "projectId": "PASTE_FROM_EAS_INIT"
      }
    }
  }
}
```

> **Bundle ID rules**: reverse-DNS format, lowercase only, no hyphens — e.g. `com.johndoe.antigravitygym`.  
> Must exactly match what you register in the Apple Developer portal.

---

## 4. Configure eas.json

The `eas.json` file at `mobile/eas.json` already has the three build profiles.  
Update the `submit.production.ios` block with your Apple details:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "you@example.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABCDE12345"
    }
  }
}
```

| Field | Where to find it |
|---|---|
| `appleId` | Your Apple ID email address |
| `ascAppId` | App Store Connect → Apps → your app → App Information → Apple ID |
| `appleTeamId` | developer.apple.com → Account → Membership → Team ID |

---

## 5. iOS Certificates & Signing

EAS can manage certificates automatically (strongly recommended).

### Automatic (recommended)

```bash
cd mobile
eas credentials --platform ios
# Choose "Expo Go Managed" → EAS creates and stores everything
```

EAS will:
1. Create a **Distribution Certificate** (`.p12`) and upload to Apple.
2. Register your **App ID** on the Apple Developer portal.
3. Create an **Ad Hoc provisioning profile** (for preview/internal) and/or an **App Store profile** (for production).

### What EAS manages for you

| Credential | Stored in |
|---|---|
| Distribution Certificate (.p12) | EAS servers + Apple Developer portal |
| Provisioning Profile (.mobileprovision) | EAS servers + Apple Developer portal |
| Push Notification key (.p8) | Only if you add FCM push later |

### Manual signing (if needed)

1. Apple Developer → **Certificates, Identifiers & Profiles** → Certificates → **+** → iOS Distribution.
2. Generate a CSR via Keychain Access → export `.p12`.
3. Register your **App ID** with the bundle identifier.
4. Create an **Ad Hoc** (preview) or **App Store** (production) **Provisioning Profile** — attach the App ID and distribution certificate.
5. Upload to EAS:
   ```bash
   eas credentials --platform ios --profile production
   # Select "Add new credentials manually"
   ```

---

## 6. Local Development Build

The development build enables fast refresh on a physical device.

```bash
cd mobile

# Build a development client IPA (internal distribution)
eas build --profile development --platform ios

# Scan the QR code with your iPhone camera
# → install the dev client IPA via the Expo Go install link
# → then start the dev server:
expo start --dev-client
```

> **Simulator only** (no real device needed):
> ```bash
> eas build --profile development --platform ios --local
> # Opens in iOS Simulator automatically
> ```

---

## 7. Preview Build (Internal Testing)

Preview builds are signed for Ad Hoc distribution — share directly with testers without App Store review.

```bash
# Build a release IPA for internal testers
eas build --profile preview --platform ios

# EAS prints a download link when done (~10-20 min)
# Share the link with testers — they install via Safari on iPhone
```

### Optional: Firebase App Distribution

For a better tester experience (in-app update notifications):

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login

# Distribute the build
firebase appdistribution:distribute path/to/build.ipa \
  --app YOUR_FIREBASE_IOS_APP_ID \
  --groups internal-testers \
  --release-notes "Preview build $(date +%Y-%m-%d)"
```

---

## 8. Production Build & TestFlight

### Build the production IPA

```bash
cd mobile
eas build --profile production --platform ios
```

This triggers a cloud build (~15-20 min). EAS returns a download link when done.

### Submit to TestFlight

```bash
# Submit the latest production build automatically
eas submit --platform ios --latest
```

You'll be prompted for your Apple ID and an **App-Specific Password**:
- Go to [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → **App-Specific Passwords** → Generate.

### TestFlight rollout steps

1. **App Store Connect** → TestFlight → your build appears after Apple processes it (~15 min).
2. **Internal testers** (your team): Add immediately — no review needed. Max 100 testers.
3. **External testers**: Submit for Beta App Review (~24 h). Max 10,000 testers.
4. Testers install via the **TestFlight** app on iPhone.

---

## 9. App Store Submission

Once TestFlight testing is complete:

1. **App Store Connect** → your app → **+ Version** (e.g. 1.0.0).
2. Fill in required metadata:
   - App description, keywords, support URL.
   - Screenshots: iPhone 6.9" (required), iPhone 6.5", iPhone 5.5" (optional but recommended).
   - App Preview video (optional).
3. Select your TestFlight build under **Build**.
4. Answer the **Export Compliance** questions (typically: No for a gym app).
5. **Submit for Review** — Apple review typically takes 1-3 business days.

### App Store assets checklist

- [ ] App icon: 1024×1024 px PNG, no alpha, no rounded corners (Apple rounds it).
- [ ] iPhone 6.9" screenshots (1320×2868 or 1290×2796 px).
- [ ] Short description (< 30 chars for subtitle).
- [ ] Privacy Policy URL (required even for free apps).
- [ ] Support URL.

---

## 10. GitHub Actions CI/CD

Create these workflow files in the **monorepo root** (not inside `mobile/`):

### `.github/workflows/mobile-preview.yml`

Triggers on every push to `main` — builds a preview IPA and makes it available as an artifact.

```yaml
name: Mobile Preview Build

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: mobile/package-lock.json

      - name: Install dependencies
        working-directory: mobile
        run: npm ci --legacy-peer-deps

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS preview
        working-directory: mobile
        run: eas build --profile preview --platform ios --non-interactive

      # Optional: distribute via Firebase App Distribution
      # - name: Upload to Firebase App Distribution
      #   uses: wzieba/Firebase-Distribution-Github-Action@v1
      #   with:
      #     appId: ${{ secrets.FIREBASE_IOS_APP_ID }}
      #     serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
      #     groups: ios-testers
      #     file: mobile/build.ipa
```

### `.github/workflows/mobile-production.yml`

Triggers on version tags (`v1.0.0`, `v1.1.0`, …) — builds and submits to TestFlight.

```yaml
name: Mobile Production Build & Submit

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-and-submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: mobile/package-lock.json

      - name: Install dependencies
        working-directory: mobile
        run: npm ci --legacy-peer-deps

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS production IPA
        working-directory: mobile
        run: eas build --profile production --platform ios --non-interactive

      - name: Submit to App Store Connect (TestFlight)
        working-directory: mobile
        run: eas submit --platform ios --latest --non-interactive
        env:
          EXPO_APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
```

### Required GitHub repository secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value | How to get |
|---|---|---|
| `EXPO_TOKEN` | EAS access token | expo.dev → Account settings → Access tokens → **Create** |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | appleid.apple.com → Sign-In and Security → App-Specific Passwords |

---

## 11. Environment Variables

### Development (`.env`)

Copy `.env.example` to `.env` in the `mobile/` folder:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000   # your Mac's LAN IP while developing
```

> Find your Mac's LAN IP: `ipconfig getifaddr en0` (Wi-Fi) or `en1` (Ethernet).  
> Both your Mac and iPhone must be on the same Wi-Fi network.

### Production

Set the production API URL in `app.json`:

```json
"extra": {
  "apiBaseUrl": "https://your-app.vercel.app"
}
```

Or override via EAS environment variables:

```bash
eas env:create --scope project --name EXPO_PUBLIC_API_URL \
  --value "https://your-app.vercel.app"
```

---

## 12. Troubleshooting

### App white-screens / crashes immediately

Run `expo start --dev-client` locally and check the Metro bundler console for errors before building.

### "Missing credentials" error during EAS build

```bash
# Regenerate credentials
eas credentials --platform ios
# Choose "Fix credential issues automatically"
```

### Build queue is slow (free tier)

Free Expo accounts share a queue. Options:
- **Upgrade to EAS Production** for priority queues.
- **Build locally** (requires macOS + Xcode):
  ```bash
  eas build --profile preview --platform ios --local
  ```

### Device not appearing in Ad Hoc profile

For preview builds, your tester's device UDID must be registered:

```bash
# Register device from EAS (sends an install link to the device)
eas device:create
```

Then rebuild the preview — EAS regenerates the provisioning profile with the new UDID.

### "Your app could not be installed" on device

- Check the provisioning profile includes the device UDID (Ad Hoc only).
- Ensure the device's iOS version is compatible with the deployment target.

### API not reachable on device during development

- The device and Mac must be on the same Wi-Fi.
- Use your Mac's LAN IP (e.g. `192.168.1.100:3000`), not `localhost`.
- If using Vercel in production, `https://` URLs work from any network.

### `EXPO_PUBLIC_API_URL` not picked up in build

EAS inlines `EXPO_PUBLIC_*` variables at build time. Make sure the variable is set **before** running `eas build`, either via `.env` or `eas env:create`.

### TestFlight build stuck "Processing"

Apple's processing can take 15-45 min. If it stays "Processing" for over an hour:
1. Check App Store Connect → Activity for error details.
2. Common cause: missing export compliance answer — add `ITSAppUsesNonExemptEncryption = NO` to `app.json → ios.infoPlist`.

```json
"ios": {
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```

---

## Quick Reference — Most Used Commands

```bash
# Start dev server
cd mobile && expo start

# Preview build (internal testers)
cd mobile && eas build --profile preview --platform ios

# Production build + submit to TestFlight
cd mobile && eas build --profile production --platform ios
cd mobile && eas submit --platform ios --latest

# Tag a release to trigger CI production build
git tag v1.0.0 && git push --tags

# Check build status
eas build:list --platform ios

# View/manage credentials
eas credentials --platform ios

# Register a new tester device
eas device:create
```

---

*Guide applies to the Antigravity Gym mobile app. Bundle IDs and Apple account details must be updated for your specific deployment.*
