# CineHD — Implementation Plan

## Overview
CineHD is a React Native / Expo app that wraps `https://cinehd.vc` in a full-screen WebView for Android (primary target). It mirrors the same concept as `enma` — a native app shell for a web experience — but targets mobile via Expo + EAS instead of desktop via Electron.

---

## Project Identity

| Field | Value |
|---|---|
| **App Name** | CineHD |
| **Bundle ID** | `com.cinehd.app` |
| **Target URL** | `https://cinehd.vc` |
| **Primary Platform** | Android |
| **Tech Stack** | Expo (React Native), EAS Build, EAS Submit |
| **Icon** | `cinehd_icon.jpg` — golden film reel + HD badge on dark navy glass background |
| **Splash Screen** | Same as icon (`cinehd_icon.jpg`) on `#0d0d1a` background |

---

## Key Feature: Popup/Ad Interception (Silent Block)

Mirrors enma's behaviour exactly — the popup is **trapped and discarded silently** with no visible UI shown to the user:
- `react-native-webview` fires `onShouldStartLoadWithRequest` for every navigation attempt
- Any URL that is **not** the target domain (`cinehd.vc`) triggered by a click is intercepted
- Navigation is blocked (`return false`) — the popup never opens
- **No overlay, no modal, no toast** — it simply disappears from the user's perspective
- The intercepted URL is optionally stored in state for future debug use, but never rendered

This is equivalent to enma's live interception logic where the visual sidebar is intentionally not rendered.

---

## Assets

| Asset | Source | Destination |
|---|---|---|
| App icon (1024x1024) | `cinehd_icon.jpg` | `assets/icon.png` (convert to PNG) |
| Adaptive icon foreground | Same icon | `assets/adaptive-icon.png` |
| Splash screen image | Same icon | `assets/splash-icon.png` |

All three use the same generated CineHD icon. Splash background color: `#0d0d1a`.

---

## File Structure

```
CineHD/
├── project/
│   └── plan/
│       ├── cinehd-implementation-plan.md   <- this file
│       └── cinehd_icon.jpg                 <- generated icon reference
├── app/
│   └── index.tsx                           <- main screen (WebView + silent popup trap)
├── assets/
│   ├── icon.png                            <- 1024x1024 app icon (from cinehd_icon.jpg)
│   ├── adaptive-icon.png                   <- Android adaptive icon foreground
│   └── splash-icon.png                     <- splash image
├── app.json                                <- Expo config
├── eas.json                                <- EAS build profiles
├── package.json
└── tsconfig.json
```

---

## Implementation Steps

### Step 1 — Scaffold Expo App
```bash
npx create-expo-app@latest . --template blank-typescript --no-install
```
Run inside `Z-0SIDE - PROJ/CineHD/`.

### Step 2 — Install Dependencies
```bash
npm install
npx expo install react-native-webview
npx expo install expo-status-bar expo-splash-screen
```

### Step 3 — Convert & Place Icon Assets
```bash
# Convert jpg to png and copy to assets/
sips -s format png cinehd_icon.jpg --out assets/icon.png
cp assets/icon.png assets/adaptive-icon.png
cp assets/icon.png assets/splash-icon.png
```

### Step 4 — Configure `app.json`
```json
{
  "expo": {
    "name": "CineHD",
    "slug": "cinehd",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0d0d1a"
    },
    "android": {
      "package": "com.cinehd.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0d0d1a"
      },
      "permissions": ["android.permission.INTERNET"]
    },
    "ios": {
      "bundleIdentifier": "com.cinehd.app"
    },
    "plugins": ["react-native-webview"]
  }
}
```

### Step 5 — Configure `eas.json`
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 6 — Build Main Screen (`app/index.tsx`)

Silent popup interception — no visible UI shown when a popup is blocked:
```tsx
import React, { useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

const TARGET_URL = 'https://cinehd.vc';
const TARGET_ORIGIN = 'cinehd.vc';

function isTargetUrl(url: string): boolean {
  return url.includes(TARGET_ORIGIN);
}

export default function App() {
  const webviewRef = useRef<WebView>(null);

  const handleShouldStartLoadWithRequest = useCallback(
    (request: WebViewNavigation) => {
      // Block any navigation away from the target domain
      // Popup is silently trapped — nothing shown to user
      if (!isTargetUrl(request.url)) {
        return false; // block
      }
      return true; // allow
    },
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <WebView
        ref={webviewRef}
        source={{ uri: TARGET_URL }}
        style={styles.webview}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  webview: { flex: 1 },
});
```

### Step 7 — EAS Build (Preview APK)
```bash
eas login
eas build --platform android --profile preview
```
Produces a downloadable `.apk` link — installable on any Android device in minutes.

### Step 8 — (Optional) Production for Play Store
```bash
eas build --platform android --profile production
eas submit --platform android
```

---

## Status Tracker

- [x] Step 1 — Scaffold Expo project
- [x] Step 2 — Install dependencies
- [x] Step 3 — Convert & place icon assets
- [x] Step 4 — Configure app.json
- [x] Step 5 — Configure eas.json
- [x] Step 6 — Build main screen with silent popup interception
- [ ] Step 7 — EAS preview APK build
- [ ] Step 8 — (Optional) Production submit

---

## Notes
- **Popup behaviour**: Silent block only — `return false` in `onShouldStartLoadWithRequest`. No UI shown. Mirrors enma exactly (interception live, visual commented out).
- **Icon**: Same CineHD icon used for app icon, adaptive icon foreground, AND splash screen image.
- **Splash**: Dark navy `#0d0d1a` background, icon centered via `resizeMode: contain`.
- **EAS preview** produces an unsigned APK — no Play Store needed for fast distribution.
