import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, View } from 'react-native';

import type { CatalogItem } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** Grid metrics — shared with the list screens so cells and padding line up. */
export const CATALOG_GRID_PADDING = 16;
export const CATALOG_GRID_GAP = 16;

const IMAGE_HEIGHT = 178;
const INFO_HEIGHT = 68;
const CARD_RADIUS = 12;

// Two columns: full width minus the outer padding and the single gutter between.
const CARD_WIDTH =
  (Dimensions.get('window').width - CATALOG_GRID_PADDING * 2 - CATALOG_GRID_GAP) / 2;

type Props = {
  item: CatalogItem;
  onPress: () => void;
};

/**
 * The card's image area (fixed 178 tall). Shows a native spinner while the
 * image loads, and an icon placeholder when there's no image or the load fails.
 */
function CardImage({ uri }: { uri?: string }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(false);

  const showImage = Boolean(uri) && !failed;
  const showPlaceholder = !uri || failed;

  return (
    <View style={[styles.image, { backgroundColor: theme.backgroundElement }]}>
      {showImage && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      )}
      {showImage && loading && (
        <View style={styles.overlay}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      )}
      {showPlaceholder && (
        <View style={styles.overlay}>
          <Ionicons name="image-outline" size={40} color={theme.textMuted} />
        </View>
      )}
    </View>
  );
}

/**
 * A vertical catalog tile (tier1 / tier2), laid out two per row. Image on top
 * (178), a white info strip below (68), a 1px border around the whole card.
 */
export function CatalogCard({ item, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <CardImage uri={item.imageUrl || undefined} />
      <View style={[styles.info, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {item.title}
        </ThemedText>
        {!!item.description && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {item.description}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    height: INFO_HEIGHT,
    paddingHorizontal: 12,
    justifyContent: 'center',
    gap: 2,
  },
});
