import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getPrintAreaSizes } from '@/api/catalog';
import type { PrintAreaSizesResponse } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';

type Photo = { uri: string; width: number; height: number };

/** Physical size + recommended DPI from the `default` print area (or the first). */
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

function parsePhotos(raw: string | undefined): Photo[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Product builder — reached from the PDP once a size is chosen AND photos are
 * selected (the native picker runs on the PDP; dismissing it leaves the user on
 * the PDP). Receives one photo per print (`quantity`).
 *
 * The print spec (physical size + recommended DPI from `/v1/print-area-sizes`)
 * is fetched here — it only powers the advisory blurriness warning, so a slow/
 * failed Prodigi call shows a retry instead of blocking the flow. UI is rough —
 * the real builder comes next.
 */
export default function BuilderScreen() {
  const { sku, photos: photosParam } = useLocalSearchParams<{
    sku: string;
    photos: string;
  }>();
  const theme = useTheme();

  const [photos, setPhotos] = useState<Photo[]>(() => parsePhotos(photosParam));

  const { data: printAreas, error, loading, reload } = useAsync(
    (signal) => getPrintAreaSizes(sku, 'prodigi', signal),
    [sku],
  );

  const changePhotos = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 0, // unlimited — photos picked = number of prints
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotos(result.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height })));
    }
  }, []);

  const spec = printAreas ? toPrintSpec(printAreas) : null;

  // Blurriness check (API rule): photo DPI at this size = px ÷ inches per axis;
  // low quality when either axis is below the recommended DPI.
  const assess = (photo: Photo) => {
    const dpiH = spec?.widthIn ? Math.round(photo.width / spec.widthIn) : null;
    const dpiV = spec?.heightIn ? Math.round(photo.height / spec.heightIn) : null;
    const low =
      dpiH !== null && dpiV !== null && !!spec?.dpiH && !!spec?.dpiV &&
      (dpiH < spec.dpiH || dpiV < spec.dpiV);
    return { dpiH, dpiV, low };
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Customize', headerBackTitle: 'Back' }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ThemedText themeColor="textSecondary">Checking print quality…</ThemedText>
        ) : error ? (
          <View style={styles.qualityRow}>
            <ThemedText themeColor="textSecondary">Couldn&apos;t check photo quality.</ThemedText>
            <Pressable onPress={reload} hitSlop={8}>
              <ThemedText style={{ color: theme.primary }}>Retry</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {photos.map((photo, i) => {
          const q = assess(photo);
          return (
            <View key={`${photo.uri}-${i}`} style={styles.card}>
              <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="contain" />
              <ThemedText themeColor="textSecondary">
                {photo.width} × {photo.height} px
                {spec
                  ? ` → ${q.dpiH ?? '—'} × ${q.dpiV ?? '—'} DPI (recommended ${spec.dpiH ?? '—'} × ${spec.dpiV ?? '—'})`
                  : ''}
              </ThemedText>
              {q.low ? (
                <ThemedText style={{ color: theme.errorFg }}>
                  ⚠︎ This photo may look blurry at this size.
                </ThemedText>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <Pressable onPress={changePhotos} style={[styles.button, { backgroundColor: theme.primary }]}>
        <ThemedText style={[styles.buttonLabel, { color: theme.onPrimary }]}>
          {photos.length > 1 ? 'Choose different photos' : 'Choose a different photo'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  scroll: {
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.two,
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
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
