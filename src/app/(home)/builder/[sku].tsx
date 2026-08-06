import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getPrintAreaSizes } from '@/api/catalog';
import type { PrintAreaSizesResponse } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';

type Photo = { uri: string; width: number; height: number };

/**
 * Physical size + recommended DPI from the `default` print area (or the first,
 * for multi-area products) — what the blurriness check needs.
 */
function toPrintSpec(res: PrintAreaSizesResponse) {
  const areas = res.printAreaSizes ?? {};
  const area = areas.default ?? Object.values(areas)[0];
  return {
    widthIn: res.widthIn,
    heightIn: res.heightIn,
    dpiH: area?.horizontalDpi ?? null,
    dpiV: area?.verticalDpi ?? null,
  };
}

/**
 * Product builder — reached from the PDP once a size is chosen AND a photo is
 * selected (the native picker runs on the PDP, so this screen only appears with
 * an image; dismissing the picker leaves the user on the PDP).
 *
 * The print spec (physical size + recommended DPI from `/v1/print-area-sizes`)
 * is fetched *here* — it only powers the advisory blurriness warning, so a
 * slow/failed Prodigi call shows a retry instead of blocking the flow or losing
 * the photo. UI is rough — the real builder comes next.
 */
export default function BuilderScreen() {
  const { sku, photoUri, photoWidth, photoHeight } = useLocalSearchParams<{
    sku: string;
    quantity: string;
    photoUri: string;
    photoWidth: string;
    photoHeight: string;
  }>();
  const theme = useTheme();

  // Seed from the photo chosen on the PDP; "different photo" re-picks in place.
  const [photo, setPhoto] = useState<Photo>({
    uri: photoUri,
    width: parseInt(photoWidth, 10) || 0,
    height: parseInt(photoHeight, 10) || 0,
  });

  const { data: printAreas, error, loading, reload } = useAsync(
    (signal) => getPrintAreaSizes(sku, 'prodigi', signal),
    [sku],
  );

  const changePhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      setPhoto({ uri: a.uri, width: a.width, height: a.height });
    }
  }, []);

  // Blurriness check (API rule): the photo's DPI at this print size is
  // pixels ÷ inches per axis; warn if either axis is below the recommended DPI.
  const spec = printAreas ? toPrintSpec(printAreas) : null;
  const photoDpiH = spec?.widthIn ? Math.round(photo.width / spec.widthIn) : null;
  const photoDpiV = spec?.heightIn ? Math.round(photo.height / spec.heightIn) : null;
  const lowQuality =
    photoDpiH !== null &&
    photoDpiV !== null &&
    !!spec?.dpiH &&
    !!spec?.dpiV &&
    (photoDpiH < spec.dpiH || photoDpiV < spec.dpiV);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Customize', headerBackTitle: 'Back' }} />

      <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="contain" />

      <Pressable onPress={changePhoto} style={[styles.button, { backgroundColor: theme.primary }]}>
        <ThemedText style={[styles.buttonLabel, { color: theme.onPrimary }]}>
          Choose a different photo
        </ThemedText>
      </Pressable>

      <View style={styles.meta}>
        <ThemedText themeColor="textSecondary">
          Selected: {photo.width} × {photo.height} px
        </ThemedText>

        {loading ? (
          <ThemedText themeColor="textSecondary">Checking print quality…</ThemedText>
        ) : error ? (
          <View style={styles.qualityRow}>
            <ThemedText themeColor="textSecondary">Couldn&apos;t check photo quality.</ThemedText>
            <Pressable onPress={reload} hitSlop={8}>
              <ThemedText style={{ color: theme.primary }}>Retry</ThemedText>
            </Pressable>
          </View>
        ) : spec ? (
          <>
            <ThemedText themeColor="textSecondary">
              At {spec.widthIn ?? '—'}×{spec.heightIn ?? '—'} in → {photoDpiH ?? '—'} ×{' '}
              {photoDpiV ?? '—'} DPI (recommended {spec.dpiH ?? '—'} × {spec.dpiV ?? '—'})
            </ThemedText>
            {lowQuality ? (
              <ThemedText style={{ color: theme.errorFg }}>
                ⚠︎ This photo may look blurry at this size.
              </ThemedText>
            ) : null}
          </>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  preview: {
    width: '100%',
    height: 320,
    borderRadius: 12,
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  meta: {
    gap: Spacing.two,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
