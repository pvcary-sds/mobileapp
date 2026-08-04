import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getProduct } from '@/api/catalog';
import type { ProductVariant } from '@/api/types';
import { ScreenState } from '@/components/screen-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { htmlToText } from '@/lib/html';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 268;

/** `GET /v1/products/{id}` — the product page. */
export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

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
                <View style={[styles.gallery, { backgroundColor: theme.backgroundElement }]}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) =>
                      setActiveImage(
                        Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH),
                      )
                    }>
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

                  {product.images.length > 1 && (
                    <View style={styles.dotsWrap} pointerEvents="none">
                      <View style={[styles.dotsPill, { backgroundColor: theme.overlayLight }]}>
                        {product.images.map((img, i) => (
                          <View
                            key={`dot-${img.filename}-${i}`}
                            style={[
                              styles.dot,
                              {
                                backgroundColor: theme.overlayContent,
                                opacity: i === activeImage ? 1 : 0.5,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.content}>
                <View style={styles.section}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: theme.text }]}>{product.name}</Text>
                    {/* TODO: make badges API-driven (product.badges) — hardcoded for now. */}
                    <Badge label="Free shipping" />
                  </View>
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
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <Pressable
                onPress={onContinue}
                disabled={!selectedSku}
                style={[
                  styles.cta,
                  {
                    backgroundColor: selectedSku ? theme.primary : theme.backgroundSelected,
                    opacity: selectedSku ? 1 : 0.6,
                  },
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
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
          backgroundColor: selected ? theme.primarySoft : theme.backgroundElement,
          borderColor: selected ? theme.primary : 'transparent',
        },
      ]}>
      <ThemedText type="smallBold">{variant.size}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        ${variant.price}
      </ThemedText>
    </Pressable>
  );
}

/** A neutral pill badge (e.g. "Free shipping"), shown beside the product title. */
function Badge({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.neutralBg }]}>
      <Text style={[styles.badgeLabel, { color: theme.neutralFg }]}>{label}</Text>
    </View>
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
  },
  content: {
    marginTop: 32, // 32 below the image to the title
    gap: Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center', // badge centered with the title
    gap: 12,
  },
  title: {
    flex: 1, // take the row's width so the badge sits at the trailing edge
    fontFamily: FontFamily.title, // Crimson Text SemiBold
    fontSize: 28,
    lineHeight: 34,
  },
  badge: {
    height: 28,
    borderRadius: 14, // pill
    paddingHorizontal: 12, // 12 leading/trailing
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontFamily: FontFamily.bodyMedium, // Body / Medium
    fontSize: 14,
    lineHeight: 20,
  },
  gallery: {
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  dotsWrap: {
    position: 'absolute',
    bottom: 16, // 16 above the image's bottom edge
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dotsPill: {
    // backgroundColor comes from the theme (Gray/0 @ 10%).
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // 8 between dots
    paddingVertical: 8, // 8 above/below the dots
    paddingHorizontal: 12, // 12 leading/trailing
    borderRadius: 12,
  },
  dot: {
    // backgroundColor comes from the theme (Gray/0).
    width: 8,
    height: 8,
    borderRadius: 4,
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
