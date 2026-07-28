import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { initEnvironmentAsync } from '@/api/environment';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Root navigator: a NATIVE bottom tab bar — Home, Gallery, Cart, Orders.
 *
 * `NativeTabs` renders the platform's real tab bar, so on **iOS 26 it's Liquid
 * Glass** (blur, morph, scroll-edge effects) for free, with SF Symbol icons; on
 * Android it's the native Material tab bar. The Home tab (`(home)` route group)
 * hosts the browse stack, which draws its own headers. `(home)` is a group, so
 * it adds no URL segment — the browse screens keep their paths.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Load any persisted dev environment override before rendering, so the first
  // API calls use the right base URL. In production this resolves immediately.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initEnvironmentAsync().finally(() => setReady(true));
  }, []);
  if (!ready) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NativeTabs>
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
