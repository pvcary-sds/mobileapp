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
import { DefaultTheme, Tabs, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { initEnvironmentAsync } from '@/api/environment';
import { GlassTabBar } from '@/components/glass-tab-bar';
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
 * Root navigator: a bottom tab bar — Home, Gallery, Cart, Orders.
 *
 * We use expo-router's `Tabs` with a custom **Liquid Glass** tab bar
 * (`GlassTabBar`) rather than `NativeTabs`, because iOS 26's native glass bar
 * won't let us control the label typography/color. The custom bar renders on a
 * real `GlassView` surface, so we keep the glass while getting exact DM Sans
 * colors/weights/spacing and the Figma SVG icons directly. The Home tab
 * (`(home)` group) hosts the browse stack, which draws its own headers.
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
      <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="(home)" />
        <Tabs.Screen name="gallery" />
        <Tabs.Screen name="cart" />
        <Tabs.Screen name="orders" />
      </Tabs>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
