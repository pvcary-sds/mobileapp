import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CatalogItem } from '@/api/types';
import { CatalogImage } from '@/components/catalog-image';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** tier2 list metrics — shared with the screen so gutters line up. */
export const TIER2_LIST_PADDING = 16;
export const TIER2_LIST_GAP = 16;

const IMAGE_HEIGHT = 177;
const IMAGE_RADIUS = 12;
const BUTTON_HEIGHT = 48;

type Props = {
  item: CatalogItem;
  onPress: () => void;
};

/**
 * A full-width tier2 product tile (one per row, edge to edge within the list's
 * 16px gutters):
 *   image (177) → 16 → name / price row → 4 → description → 16 → Select (48) → 16.
 * Tapping the tile or the Select button both open the product page. Price is a
 * placeholder (`—`) until the API returns `fromPrice`.
 */
export function Tier2Card({ item, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}>
      <CatalogImage
        uri={item.imageUrl || undefined}
        height={IMAGE_HEIGHT}
        style={styles.image}
      />

      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.price, { color: item.fromPrice ? theme.text : theme.textMuted }]}>
          {item.fromPrice ? `From $${item.fromPrice}` : '—'}
        </Text>
      </View>

      {!!item.description && (
        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Text style={[styles.buttonLabel, { color: theme.onPrimary }]}>Select</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    // Edge to edge within the list gutters; the image and text run full width.
    paddingBottom: 16, // 16 below the Select button to the container's bottom
  },
  image: {
    borderRadius: IMAGE_RADIUS,
    marginBottom: 16, // 16 below the image to the name/price row
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  price: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  description: {
    marginTop: 4, // 4 below the name/price row
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 16, // 16 below the description to the button
    height: BUTTON_HEIGHT,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
});
