import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import type { CatalogItem } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  item: CatalogItem;
  onPress: () => void;
};

/**
 * A tappable catalog card (tier1 / tier2). Falls back to a neutral placeholder
 * block when the CMS hasn't set an image yet (many items ship with `imageUrl:
 * ""` today).
 */
export function CatalogCard({ item, onPress }: Props) {
  const theme = useTheme();
  const hasImage = Boolean(item.imageUrl);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
      ]}>
      {hasImage ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.image, { backgroundColor: theme.backgroundSelected }]} />
      )}
      <View style={styles.body}>
        <ThemedText type="smallBold">{item.title}</ThemedText>
        {!!item.description && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {item.description}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    gap: Spacing.three,
  },
  image: {
    width: 88,
    height: 88,
  },
  body: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingRight: Spacing.three,
    gap: Spacing.one,
  },
});
