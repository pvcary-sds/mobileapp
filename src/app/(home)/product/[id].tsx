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

import { SvgXml } from 'react-native-svg';

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

  // Price shown in the action row: the selected size's price (or, before a
  // selection, the lowest as a starting "from" figure) times the quantity.
  const priceLabel = useMemo(() => {
    if (!product || product.variants.length === 0) return '';
    const selected = product.variants.find((v) => v.sku === selectedSku);
    const variant =
      selected ??
      product.variants.reduce((min, v) =>
        parseFloat(v.price) < parseFloat(min.price) ? v : min,
      );
    return (parseFloat(variant.price) * quantity).toFixed(2);
  }, [product, selectedSku, quantity]);

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
                  style={[
                    styles.selectButton,
                    { backgroundColor: selectedSku ? theme.primary : theme.backgroundSelected },
                  ]}>
                  <Text
                    style={[
                      styles.selectLabel,
                      { color: selectedSku ? theme.onPrimary : theme.textMuted },
                    ]}>
                    Select
                  </Text>
                </Pressable>
              </View>

              <View style={styles.details}>
                {!!longText && (
                  <View style={styles.section}>
                    <Text style={[styles.descriptionHeading, { color: theme.text }]}>
                      Description
                    </Text>
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

// Shipping-truck icon for the Free shipping badge. `currentColor` so the theme
// tints it (Label dark green).
const FREE_SHIPPING_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="14.1667" cy="14.9997" r="1.66667" stroke="currentColor" stroke-width="1.25"/>
<circle cx="5.83366" cy="14.9997" r="1.66667" stroke="currentColor" stroke-width="1.25"/>
<path d="M4.16699 14.9767C3.25306 14.9312 2.68291 14.7952 2.27719 14.3895C1.87146 13.9838 1.73551 13.4136 1.68995 12.4997M7.50033 14.9997H12.5003M15.8337 14.9767C16.7476 14.9312 17.3177 14.7952 17.7235 14.3895C18.3337 13.7793 18.3337 12.7972 18.3337 10.833V9.16634H14.417C13.7966 9.16634 13.4864 9.16634 13.2353 9.08477C12.7279 8.91991 12.3301 8.5221 12.1652 8.0147C12.0837 7.76365 12.0837 7.45343 12.0837 6.83301C12.0837 5.90237 12.0837 5.43705 11.9613 5.06047C11.714 4.29937 11.1173 3.70266 10.3562 3.45537C9.97962 3.33301 9.5143 3.33301 8.58366 3.33301H1.66699" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M1.66699 6.66602H6.66699" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M1.66699 9.16602H5.00033" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.084 5H13.6017C14.8145 5 15.4208 5 15.9143 5.29476C16.4078 5.58952 16.6953 6.12343 17.2703 7.19125L18.334 9.16667" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** The "Free shipping" badge shown beside the product title (green, with a shipping icon). */
function Badge({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.successBg }]}>
      <SvgXml xml={FREE_SHIPPING_ICON} width={20} height={20} color={theme.successFg} />
      <Text style={[styles.badgeLabel, { color: theme.successFg }]}>{label}</Text>
    </View>
  );
}

const MINUS_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PLUS_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * Quantity control (min 1): three 48×48 blocks (−, value, +) inside a 1px
 * Gray/200 pill. When the count is 1 the − block is disabled — Gray/100 fill,
 * Gray/400 icon; otherwise the icon is Gray/black.
 */
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
        style={[
          styles.stepperButton,
          !canDecrement && { backgroundColor: theme.backgroundElement }, // Gray/100 when disabled
        ]}>
        <SvgXml
          xml={MINUS_ICON}
          width={24}
          height={24}
          color={canDecrement ? theme.text : theme.textMuted}
        />
      </Pressable>
      <View style={styles.stepperValueBlock}>
        <Text style={[styles.stepperValue, { color: theme.text }]}>{value}</Text>
      </View>
      <Pressable onPress={() => onChange(value + 1)} style={styles.stepperButton}>
        <SvgXml xml={PLUS_ICON} width={24} height={24} color={theme.text} />
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
    fontFamily: FontFamily.bodySemiBold, // Body / SemiBold
    fontSize: 32,
    lineHeight: 42,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: Spacing.two, // 8
    overflow: 'hidden', // clip the disabled block's fill to the rounded corners
  },
  stepperButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueBlock: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: FontFamily.bodySemiBold, // Body1 / SemiBold
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
    marginTop: 32, // 32 below the Select button to the Description heading
    gap: Spacing.four,
  },
  descriptionHeading: {
    fontFamily: FontFamily.title, // Title2 / SemiBold (Crimson Text)
    fontSize: 24,
    lineHeight: 30,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // 4 between the icon and the text
    height: 28,
    borderRadius: 14, // pill
    paddingHorizontal: 12, // 12 leading/trailing
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
