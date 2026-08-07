import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, FontFamily, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { htmlToText } from '@/lib/html';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 268;

// Show at most this many size chips before collapsing the rest behind a
// "Show N more" toggle tile.
const COLLAPSED_SIZE_COUNT = 6;

/** `GET /v1/products/{id}` — the product page. */
export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [sizesExpanded, setSizesExpanded] = useState(false); // "Show N more" size chips

  const { data: product, error, loading, reload } = useAsync(
    (signal) => getProduct(id, signal),
    [id],
  );

  const longText = useMemo(
    () => (product ? htmlToText(product.longDescription) : ''),
    [product],
  );

  // Split the flattened description into paragraphs so we can space them apart.
  const paragraphs = useMemo(
    () => longText.split(/\n+/).map((p) => p.trim()).filter(Boolean),
    [longText],
  );

  // On Select: open the native photo picker as unlimited multi-select — the
  // customer picks as many photos as they want and confirms with the picker's
  // Add/✓ (it never auto-dismisses). The number of photos is the number of
  // prints; quantity lives in the cart, not here. Dismissing the picker leaves
  // the user on the PDP — the builder only opens once a photo is chosen, and it
  // fetches the print spec itself (so a slow/failed Prodigi call doesn't block
  // navigation or throw away the picked photos).
  const onContinue = async () => {
    if (!selectedSku || selecting) return;
    try {
      setSelecting(true);
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 0, // unlimited — photos picked = number of prints
        quality: 1,
      });
      if (picked.canceled || picked.assets.length === 0) return; // stay on the PDP
      const photos = picked.assets.map((a) => ({
        uri: a.uri,
        width: a.width,
        height: a.height,
      }));
      const selectedVariant = product?.variants.find((v) => v.sku === selectedSku);
      router.push({
        pathname: '/builder/[sku]',
        params: {
          sku: selectedSku,
          // Carry the display size + unit price so the builder can label them and
          // compute the total (unit price × photos) without a refetch.
          size: selectedVariant ? `${selectedVariant.size} in` : '',
          price: selectedVariant?.price ?? '',
          photos: JSON.stringify(photos),
        },
      });
    } finally {
      setSelecting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: product?.name ?? 'Product',
          headerRight: () => <HeaderShareButton />,
        }}
      />
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
                  {(sizesExpanded
                    ? product.variants
                    : product.variants.slice(0, COLLAPSED_SIZE_COUNT)
                  ).map((v) => (
                    <SizeChip
                      key={v.sku}
                      variant={v}
                      selected={v.sku === selectedSku}
                      onPress={() => setSelectedSku(v.sku)}
                    />
                  ))}
                  {/* Toggle tile — always the last tile once there are more sizes
                      than fit. Collapsed: "Show N more"; expanded: "Show N less". */}
                  {product.variants.length > COLLAPSED_SIZE_COUNT && (
                    <Pressable
                      onPress={() => setSizesExpanded((e) => !e)}
                      style={[
                        styles.sizeToggle,
                        { borderColor: theme.border, backgroundColor: theme.lightBlueSurface },
                      ]}>
                      {/* Two lines: "Show" / "N more" (or "N less"). */}
                      <Text style={[styles.sizeToggleText, { color: theme.text }]}>Show</Text>
                      <Text style={[styles.sizeToggleText, { color: theme.text }]}>
                        {product.variants.length - COLLAPSED_SIZE_COUNT}{' '}
                        {sizesExpanded ? 'less' : 'more'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.actionBlock}>
                <Pressable
                  onPress={onContinue}
                  disabled={!selectedSku || selecting}
                  style={[
                    styles.selectButton,
                    { backgroundColor: selectedSku ? theme.primary : theme.backgroundSelected },
                  ]}>
                  {selecting ? (
                    <ActivityIndicator color={theme.onPrimary} />
                  ) : (
                    <Text
                      style={[
                        styles.selectLabel,
                        { color: selectedSku ? theme.onPrimary : theme.textMuted },
                      ]}>
                      Select
                    </Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.details}>
                {paragraphs.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.descriptionHeading, { color: theme.text }]}>
                      Description
                    </Text>
                    <View style={styles.descriptionBody}>
                      {paragraphs.map((p, i) => (
                        <Text key={i} style={[styles.descriptionText, { color: theme.text }]}>
                          {p}
                        </Text>
                      ))}
                    </View>
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

const SHARE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.7914 12.6072C21.0355 12.398 21.1575 12.2933 21.2023 12.1688C21.2415 12.0596 21.2415 11.94 21.2023 11.8308C21.1575 11.7063 21.0355 11.6016 20.7914 11.3924L12.3206 4.13178C11.9004 3.77158 11.6903 3.59148 11.5124 3.58707C11.3578 3.58323 11.2101 3.65115 11.1124 3.77103C11 3.90897 11 4.18571 11 4.73918V9.03444C8.86532 9.40789 6.91159 10.4896 5.45971 12.1137C3.87682 13.8843 3.00123 16.1757 3 18.5508V19.1628C4.04934 17.8987 5.35951 16.8763 6.84076 16.1657C8.1467 15.5392 9.55842 15.1681 11 15.0703V19.2604C11 19.8139 11 20.0906 11.1124 20.2286C11.2101 20.3485 11.3578 20.4164 11.5124 20.4125C11.6903 20.4081 11.9004 20.228 12.3206 19.8678L20.7914 12.6072Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Header share button (top-right on the PDP). Icon only — action is a TODO. */
function HeaderShareButton() {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        // TODO: wire the share action (open the share sheet with the product link).
      }}
      hitSlop={8}>
      <SvgXml xml={SHARE_ICON} width={24} height={24} color={theme.text} />
    </Pressable>
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


function BulletSection({ title, items }: { title: string; items: string[] }) {
  const theme = useTheme();
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.descriptionHeading, { color: theme.text }]}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={[styles.descriptionText, { color: theme.text }]}>
          {'• '}
          {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    // Clear the floating tab bar so the last section isn't hidden behind it.
    paddingBottom: BottomTabInset + Spacing.six,
  },
  titleSection: {
    marginTop: 32, // 32 below the image to the title
    paddingHorizontal: Spacing.three, // 16
  },
  sizeSection: {
    marginTop: 20, // 20 below the title to the sizes
  },
  actionBlock: {
    marginTop: 20, // 20 below the sizes to the Select button
    paddingHorizontal: Spacing.three, // 16
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
    gap: 20, // between the Description / Features / Materials / Packaging sections
  },
  descriptionHeading: {
    fontFamily: FontFamily.title, // Title2 / SemiBold (Crimson Text)
    fontSize: 24,
    lineHeight: 30,
  },
  descriptionBody: {
    gap: 8, // between paragraphs
  },
  descriptionText: {
    fontFamily: FontFamily.body, // Body1 / Regular
    fontSize: 16,
    lineHeight: 24,
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
  sizeToggle: {
    minWidth: 76,
    minHeight: 66, // match the two-line SizeChip height (12 + 18 + 24 + 12)
    paddingHorizontal: 20, // 20 leading/trailing of the text
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'flex-start', // left-align the two lines (like the chips)
    justifyContent: 'center', // vertically center within the tile
  },
  sizeToggleText: {
    fontFamily: FontFamily.bodySemiBold, // Body / SemiBold
    fontSize: 16,
    lineHeight: 20,
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
