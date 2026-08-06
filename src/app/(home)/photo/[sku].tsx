import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Photo step — reached from the PDP "Select" with the chosen SKU and the print
 * spec (physical size + recommended DPI) from `GET /v1/print-area-sizes/{sku}`.
 *
 * Opens the native photo picker (iOS PHPicker / Android photo picker via
 * `expo-image-picker`) as soon as it appears, then shows the selection. The
 * picker returns the image's pixel dimensions, which we use for the blurriness
 * check: photo DPI at this size (`px ÷ inches`) vs the recommended DPI.
 *
 * UI is still rough — this wires up the picker + the quality signal.
 */
export default function PhotoScreen() {
  const { widthIn, heightIn, recommendedDpiH, recommendedDpiV } =
    useLocalSearchParams<{
      sku: string;
      quantity: string;
      widthIn: string;
      heightIn: string;
      recommendedDpiH: string;
      recommendedDpiV: string;
    }>();
  const theme = useTheme();
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const pickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  }, []);

  // Open the native picker right away (this screen exists to pick a photo).
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current) return;
    autoOpened.current = true;
    pickPhoto();
  }, [pickPhoto]);

  // Blurriness check (API rule): the photo's DPI at this print size is
  // pixels ÷ inches per axis; warn if either axis is below the recommended DPI.
  const wIn = parseFloat(widthIn);
  const hIn = parseFloat(heightIn);
  const recH = parseFloat(recommendedDpiH);
  const recV = parseFloat(recommendedDpiV);
  const photoDpiH = photo && wIn ? Math.round(photo.width / wIn) : null;
  const photoDpiV = photo && hIn ? Math.round(photo.height / hIn) : null;
  const lowQuality =
    photoDpiH !== null &&
    photoDpiV !== null &&
    !!recH &&
    !!recV &&
    (photoDpiH < recH || photoDpiV < recV);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Add your photo', headerBackTitle: 'Back' }} />

      {photo ? (
        <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="contain" />
      ) : (
        <View style={[styles.preview, { backgroundColor: theme.backgroundElement }]} />
      )}

      <Pressable onPress={pickPhoto} style={[styles.button, { backgroundColor: theme.primary }]}>
        <ThemedText style={[styles.buttonLabel, { color: theme.onPrimary }]}>
          {photo ? 'Choose a different photo' : 'Choose a photo'}
        </ThemedText>
      </Pressable>

      {photo ? (
        <View style={styles.meta}>
          <ThemedText themeColor="textSecondary">
            Selected: {photo.width} × {photo.height} px
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            At {widthIn || '—'}×{heightIn || '—'} in → {photoDpiH ?? '—'} × {photoDpiV ?? '—'} DPI
            {'  '}(recommended {recommendedDpiH || '—'} × {recommendedDpiV || '—'})
          </ThemedText>
          {lowQuality ? (
            <ThemedText style={{ color: theme.errorFg }}>
              ⚠︎ This photo may look blurry at this size.
            </ThemedText>
          ) : null}
        </View>
      ) : null}
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
});
