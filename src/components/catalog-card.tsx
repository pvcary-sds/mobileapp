import { Image } from 'expo-image';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';

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
 * A vertical catalog tile (tier1 / tier2), laid out two per row. Image on top
 * (178), a white info strip below (68), a 1px border around the whole card.
 * Falls back to a neutral placeholder block when the CMS hasn't set an image
 * yet (many items ship with `imageUrl: ""` today).
 */
export function CatalogCard({ item, onPress }: Props) {
  const theme = useTheme();
  const hasImage = Boolean(item.imageUrl);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: theme.backgroundSelected, opacity: pressed ? 0.85 : 1 },
      ]}>
      {hasImage ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.image, { backgroundColor: theme.backgroundElement }]} />
      )}
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
  info: {
    height: INFO_HEIGHT,
    paddingHorizontal: 12,
    justifyContent: 'center',
    gap: 2,
  },
});
