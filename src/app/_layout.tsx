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
import { DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
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
 * Root navigator: a NATIVE bottom tab bar — Home, Gallery, Cart, Orders.
 *
 * `NativeTabs` renders the platform's real tab bar, so on **iOS 26 it's Liquid
 * Glass** (blur, morph, scroll-edge effects) for free, with SF Symbol icons; on
 * Android it's the native Material tab bar. The Home tab (`(home)` route group)
 * hosts the browse stack, which draws its own headers. `(home)` is a group, so
 * it adds no URL segment — the browse screens keep their paths.
 *
 * The app is a single light theme. Tab items are neutral — selected is near-black
 * (text), unselected is Gray 500 (textSecondary); the orange primary is reserved
 * for actions (CTAs, selected chips), not the tab bar.
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
      <NativeTabs
        iconColor={{ default: Colors.textSecondary, selected: Colors.text }}
        labelStyle={{
          default: { color: Colors.textSecondary },
          selected: { color: Colors.text },
        }}>
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Icon sf="house" />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="gallery">
          <NativeTabs.Trigger.Icon sf="photo.on.rectangle" />
          <NativeTabs.Trigger.Label>Gallery</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="cart">
          <NativeTabs.Trigger.Icon sf="cart" />
          <NativeTabs.Trigger.Label>Cart</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="orders">
          <NativeTabs.Trigger.Icon sf="shippingbox" />
          <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
