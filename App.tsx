import React, { useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import { type ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { StatusBar } from 'expo-status-bar';

const TARGET_URL = 'https://cinehd.vc';
const TARGET_ORIGIN = 'cinehd.vc';

function isTargetDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(TARGET_ORIGIN);
  } catch {
    return true; // allow unparseable URLs through (e.g. blob:, about:blank)
  }
}

export default function App() {
  const webviewRef = useRef<WebView>(null);

  /**
   * Silent popup / ad interception.
   * Any navigation triggered to a domain outside cinehd.vc is blocked silently —
   * no overlay, no toast, no UI feedback. The popup simply never opens.
   * Mirrors enma's new-window interception behaviour exactly.
   */
  const handleShouldStartLoadWithRequest = useCallback(
    (request: ShouldStartLoadRequest): boolean => {
      if (!isTargetDomain(request.url)) {
        // Trap and discard — popup is out of view, user never sees it
        return false;
      }
      return true;
    },
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden translucent />
      <WebView
        ref={webviewRef}
        source={{ uri: TARGET_URL }}
        style={styles.webview}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        // Media & playback
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        // Performance & compat
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
        // Make it feel native
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
});
