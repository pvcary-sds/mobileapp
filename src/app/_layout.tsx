import {
  CrimsonText_400Regular,
  CrimsonText_600SemiBold,
  CrimsonText_700Bold,
} from '@expo-google-fonts/crimson-text';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { initEnvironmentAsync } from '@/api/environment';
import { Colors } from '@/constants/theme';

/** Single (light) navigation theme, tinted from the app palette. */
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
};

/**
 * Root navigator: a Stack hosting the tab group (`(tabs)`) plus full-screen
 * screens that push OVER the tabs. Keeping the native tab bar inside this Stack
 * (rather than at the root) is what lets the builder push in from the right and
 * cover the tab bar — a natural push, not a bottom-up modal.
 *
 * Fonts, the dev-environment bootstrap, and the navigation theme live here so
 * they wrap the whole app.
 */
export default function RootLayout() {
  // Brand fonts: DM Sans (body) + Crimson Text (title).
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    CrimsonText_400Regular,
    CrimsonText_600SemiBold,
    CrimsonText_700Bold,
  });

  // Load any persisted dev environment override before rendering, so the first
  // API calls use the right base URL. In production this resolves immediately.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initEnvironmentAsync().finally(() => setReady(true));
  }, []);
  if (!ready || !fontsLoaded) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShadowVisible: false }}>
        {/* The tab bar and everything inside it. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Full-screen photo editor — pushes over the tabs (title + custom Back
            come from the screen itself). */}
        <Stack.Screen name="builder/[sku]" options={{ title: '', headerBackTitle: 'Back' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
