import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Photo = { uri: string; width: number; height: number };

/**
 * Product builder — reached from the PDP once a size is chosen AND a photo is
 * selected (the native picker runs on the PDP, so this screen only appears with
 * an image in hand; dismissing the picker leaves the user on the PDP).
 *
 * Receives the chosen photo + the print spec (physical size + recommended DPI
 * from `/v1/print-area-sizes`) and surfaces the blurriness signal. UI is rough —
 * the real builder comes next.
 */
export default function BuilderScreen() {
  const {
    widthIn,
    heightIn,
    recommendedDpiH,
    recommendedDpiV,
    photoUri,
    photoWidth,
    photoHeight,
  } = useLocalSearchParams<{
    sku: string;
    quantity: string;
    widthIn: string;
    heightIn: string;
    recommendedDpiH: string;
    recommendedDpiV: string;
    photoUri: string;
    photoWidth: string;
    photoHeight: string;
  }>();
  const theme = useTheme();

  // Seed from the photo chosen on the PDP; the "different photo" button re-picks.
  const [photo, setPhoto] = useState<Photo>({
    uri: photoUri,
    width: parseInt(photoWidth, 10) || 0,
    height: parseInt(photoHeight, 10) || 0,
  });

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
  const wIn = parseFloat(widthIn);
  const hIn = parseFloat(heightIn);
  const recH = parseFloat(recommendedDpiH);
  const recV = parseFloat(recommendedDpiV);
  const photoDpiH = wIn ? Math.round(photo.width / wIn) : null;
  const photoDpiV = hIn ? Math.round(photo.height / hIn) : null;
  const lowQuality =
    photoDpiH !== null &&
    photoDpiV !== null &&
    !!recH &&
    !!recV &&
    (photoDpiH < recH || photoDpiV < recV);

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
