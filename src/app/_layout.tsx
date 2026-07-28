import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Root navigator: a stack for the browse flow
 * (catalog → sub-catalog → product page). Titles for the dynamic routes are
 * set inside each screen once its data loads.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'SameDaySnaps' }} />
        <Stack.Screen name="tier2/[id]" options={{ title: '' }} />
        <Stack.Screen name="product/[id]" options={{ title: '', headerBackTitle: 'Back' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
