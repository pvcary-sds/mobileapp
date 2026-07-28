import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { getProduct } from '@/api/catalog';
import type { ProductVariant } from '@/api/types';
import { ScreenState } from '@/components/screen-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { htmlToText } from '@/lib/html';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** `GET /v1/products/{id}` — the product page. */
export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  const { data: product, error, loading, reload } = useAsync(
    (signal) => getProduct(id, signal),
    [id],
  );

  const longText = useMemo(
    () => (product ? htmlToText(product.longDescription) : ''),
    [product],
  );

  const onContinue = () => {
    if (!selectedSku) return;
    // Next slice: /v1/print-area-sizes/{sku} → photo pick → upload → checkout.
    Alert.alert('Coming next', `Selected size SKU:\n${selectedSku}`);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: product?.name ?? 'Product' }} />
      <ScreenState loading={loading} error={error} onRetry={reload}>
        {product && (
          <>
            <ScrollView contentContainerStyle={styles.scroll}>
              {product.images.length > 0 && (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.gallery}>
                  {product.images.map((img, i) => (
                    <Image
                      key={`${img.filename}-${i}`}
                      source={{ uri: img.filename }}
                      style={styles.heroImage}
                      contentFit="cover"
                      transition={150}
                      accessibilityLabel={img.alt || product.name}
                    />
                  ))}
                </ScrollView>
              )}

              <View style={styles.section}>
                <ThemedText type="subtitle">{product.name}</ThemedText>
                {!!product.shortDescription && (
                  <ThemedText themeColor="textSecondary">
                    {product.shortDescription}
                  </ThemedText>
                )}
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Choose a size</ThemedText>
                <View style={styles.sizeGrid}>
                  {product.variants.map((v) => (
                    <SizeChip
                      key={v.sku}
                      variant={v}
                      selected={v.sku === selectedSku}
                      onPress={() => setSelectedSku(v.sku)}
                    />
                  ))}
                </View>
              </View>

              {!!longText && (
                <View style={styles.section}>
                  <ThemedText>{longText}</ThemedText>
                </View>
              )}

              <BulletSection title="Features" items={product.features} />
              <BulletSection title="Materials" items={product.materials} />
              <BulletSection title="Packaging" items={product.packaging} />
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.backgroundElement }]}>
              <Pressable
                onPress={onContinue}
                disabled={!selectedSku}
                style={[
                  styles.cta,
                  {
                    backgroundColor: selectedSku ? '#208AEF' : theme.backgroundSelected,
                    opacity: selectedSku ? 1 : 0.6,
                  },
                ]}>
                <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                  {selectedSku ? 'Continue' : 'Select a size'}
                </ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </ScreenState>
    </ThemedView>
  );
}

function SizeChip({
  variant,
  selected,
  onPress,
}: {
  variant: ProductVariant;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selected ? '#208AEF' : 'transparent',
        },
      ]}>
      <ThemedText type="smallBold">{variant.size}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        ${variant.price}
      </ThemedText>
    </Pressable>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {items.map((item, i) => (
        <ThemedText key={i} themeColor="textSecondary">
          {'• '}
          {item}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  gallery: {
    height: SCREEN_WIDTH,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  section: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minWidth: 76,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
