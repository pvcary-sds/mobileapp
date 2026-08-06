import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Photo step — reached from the PDP "Select" with the chosen SKU and the print
 * spec (physical size + recommended DPI) fetched from
 * `GET /v1/print-area-sizes/{sku}`. That spec drives the upcoming low-quality
 * (blurriness) check once a photo is picked.
 *
 * UI is intentionally a placeholder for now; it just confirms the data arrived.
 */
export default function PhotoScreen() {
  const { sku, quantity, widthIn, heightIn, recommendedDpiH, recommendedDpiV } =
    useLocalSearchParams<{
      sku: string;
      quantity: string;
      widthIn: string;
      heightIn: string;
      recommendedDpiH: string;
      recommendedDpiV: string;
    }>();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Add your photo', headerBackTitle: 'Back' }} />
      {/* Placeholder — the photo picker + blurriness-warning UI comes next.
          Shown only to confirm the print spec made it here. */}
      <ThemedText type="smallBold">SKU: {sku}</ThemedText>
      <ThemedText themeColor="textSecondary">Quantity: {quantity}</ThemedText>
      <ThemedText themeColor="textSecondary">
        Print size: {widthIn || '—'} × {heightIn || '—'} in
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Recommended DPI: {recommendedDpiH || '—'} × {recommendedDpiV || '—'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
