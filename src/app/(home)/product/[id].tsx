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
  const [quantity, setQuantity] = useState(1);

  const { data: product, error, loading, reload } = useAsync(
    (signal) => getProduct(id, signal),
    [id],
  );

  const longText = useMemo(
    () => (product ? htmlToText(product.longDescription) : ''),
    [product],
  );

  // Price shown in the action row: the selected size's price, or (when nothing
  // is selected yet) the lowest price as a starting "from" figure.
  const priceLabel = useMemo(() => {
    if (!product || product.variants.length === 0) return '';
    const selected = product.variants.find((v) => v.sku === selectedSku);
    const variant =
      selected ??
      product.variants.reduce((min, v) =>
        parseFloat(v.price) < parseFloat(min.price) ? v : min,
      );
    return variant.price;
  }, [product, selectedSku]);

  const onContinue = () => {
    if (!selectedSku) return;
    // Next slice: /v1/print-area-sizes/{sku} → photo pick → upload → checkout.
    Alert.alert('Coming next', `SKU: ${selectedSku}\nQty: ${quantity}`);
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

              <View style={styles.titleSection}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: theme.text }]}>{product.name}</Text>
                  {/* TODO: make badges API-driven (product.badges) — hardcoded for now. */}
                  <Badge label="Free shipping" />
                </View>
              </View>

              <View style={[styles.section, styles.sizeSection]}>
                <Text style={[styles.sizeHeading, { color: theme.text }]}>Choose a size</Text>
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

              <View style={styles.actionBlock}>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: theme.text }]}>${priceLabel}</Text>
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                </View>
                <Pressable
                  onPress={onContinue}
                  disabled={!selectedSku}
                  style={({ pressed }) => [
                    styles.selectButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: !selectedSku ? 0.4 : pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text style={[styles.selectLabel, { color: theme.onPrimary }]}>Select</Text>
                </Pressable>
              </View>

              <View style={styles.details}>
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
          backgroundColor: theme.background, // white
          borderColor: selected ? theme.text : theme.border, // Gray/black vs Gray/200
        },
      ]}>
      <Text style={[styles.priceText, { color: theme.textTertiary }]}>${variant.price}</Text>
      {/* TODO: unit ("in") is hardcoded — the API's variant.size has no unit. */}
      <Text style={[styles.sizeText, { color: theme.text }]}>{variant.size} in</Text>
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

/** A bordered −/value/+ quantity control (min 1). */
function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const theme = useTheme();
  const canDecrement = value > 1;
  return (
    <View style={[styles.stepper, { borderColor: theme.border }]}>
      <Pressable
        onPress={() => onChange(value - 1)}
        disabled={!canDecrement}
        hitSlop={4}
        style={styles.stepperButton}>
        <Text style={[styles.stepperSign, { color: canDecrement ? theme.text : theme.textMuted }]}>
          −
        </Text>
      </Pressable>
      <Text style={[styles.stepperValue, { color: theme.text }]}>{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} hitSlop={4} style={styles.stepperButton}>
        <Text style={[styles.stepperSign, { color: theme.text }]}>+</Text>
      </Pressable>
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
  titleSection: {
    marginTop: 32, // 32 below the image to the title
    paddingHorizontal: Spacing.three, // 16
  },
  sizeSection: {
    marginTop: 20, // 20 below the title to the sizes
  },
  actionBlock: {
    marginTop: 20, // 20 below the sizes
    paddingHorizontal: Spacing.three, // 16
    gap: 12, // between the price row and the Select button
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  price: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: Spacing.two, // 8
  },
  stepperButton: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 20,
    lineHeight: 24,
  },
  stepperValue: {
    minWidth: 24,
    textAlign: 'center',
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  selectButton: {
    height: 48,
    borderRadius: Spacing.two, // 8
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  details: {
    marginTop: Spacing.four, // 24 below the action block
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
  sizeHeading: {
    fontFamily: FontFamily.body, // Body / Regular
    fontSize: 14,
    lineHeight: 20,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minWidth: 76,
    paddingHorizontal: Spacing.three, // 16 left/right
    paddingVertical: 12, // 12 top/bottom
    borderRadius: Spacing.two,
    borderWidth: 1, // Gray/200 (or Gray/black when selected)
    alignItems: 'flex-start', // left-align price + size
  },
  priceText: {
    fontFamily: FontFamily.body, // Body / Regular
    fontSize: 12,
    lineHeight: 18,
  },
  sizeText: {
    fontFamily: FontFamily.bodyMedium, // Body / Medium
    fontSize: 16,
    lineHeight: 24,
  },
});
