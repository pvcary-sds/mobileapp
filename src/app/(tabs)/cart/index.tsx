import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { CLOSE_ICON } from '@/constants/builder-icons';
import { EMPTY_CART_ILLUSTRATION } from '@/constants/illustrations';
import { BottomTabInset, FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cartStore, useCartItems } from '@/lib/cart-store';

/** "Start shopping" button glyph (from Figma) — white stroke, on the primary fill. */
const START_SHOPPING_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 6.0534V20.3025M5 8.25467C6.26578 8.4507 7.67778 8.7766 9 9.28791M5 12.2547C5.63949 12.3537 6.3163 12.4859 7 12.6584M3.99433 3.0113C6.21271 3.26198 9.19313 3.93635 11.3168 5.42448C11.725 5.71048 12.275 5.71048 12.6832 5.42448C14.8069 3.93635 17.7873 3.26198 20.0057 3.0113C21.1036 2.88724 22 3.80405 22 4.93521V16.2C22 17.3311 21.1036 18.2483 20.0057 18.3724C17.7873 18.623 14.8069 19.2974 12.6832 20.7855C12.275 21.0715 11.725 21.0715 11.3168 20.7855C9.19313 19.2974 6.21271 18.623 3.99433 18.3724C2.89642 18.2483 2 17.3311 2 16.2V4.93521C2 3.80405 2.89642 2.88724 3.99433 3.0113Z" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

/** "Continue shopping" button glyph — same book, black stroke on the white fill. */
const CONTINUE_SHOPPING_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 6.0534V20.3025M5 8.25467C6.26578 8.4507 7.67778 8.7766 9 9.28791M5 12.2547C5.63949 12.3537 6.3163 12.4859 7 12.6584M3.99433 3.0113C6.21271 3.26198 9.19313 3.93635 11.3168 5.42448C11.725 5.71048 12.275 5.71048 12.6832 5.42448C14.8069 3.93635 17.7873 3.26198 20.0057 3.0113C21.1036 2.88724 22 3.80405 22 4.93521V16.2C22 17.3311 21.1036 18.2483 20.0057 18.3724C17.7873 18.623 14.8069 19.2974 12.6832 20.7855C12.275 21.0715 11.725 21.0715 11.3168 20.7855C9.19313 19.2974 6.21271 18.623 3.99433 18.3724C2.89642 18.2483 2 17.3311 2 16.2V4.93521C2 3.80405 2.89642 2.88724 3.99433 3.0113Z" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

/** Format a USD amount from a decimal string, e.g. "75" → "$75.00". */
function formatUSD(price: string): string {
  const n = Number(price) || 0;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Copy stepper for a cart row (32px tall). First pass — refine to the detailed
 * spec (button/borders/colors) once it's provided.
 */
function QtyStepper({ value, onChange }: { value: number; onChange: (q: number) => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.stepper, { borderColor: theme.border }]}>
      <Pressable
        hitSlop={4}
        disabled={value <= 1}
        style={styles.stepperBtn}
        onPress={() => onChange(value - 1)}>
        <Text style={[styles.stepperSign, { color: value <= 1 ? theme.textMuted : theme.text }]}>
          −
        </Text>
      </Pressable>
      <Text style={[styles.stepperValue, { color: theme.text }]}>{value}</Text>
      <Pressable hitSlop={4} style={styles.stepperBtn} onPress={() => onChange(value + 1)}>
        <Text style={[styles.stepperSign, { color: theme.text }]}>+</Text>
      </Pressable>
    </View>
  );
}

/**
 * Cart tab — the built prints waiting for checkout. Backed by the local cart
 * store (see `cart-store.ts`); no API until checkout.
 */
export default function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const items = useCartItems();
  const count = items.length;
  const [promo, setPromo] = useState('');
  const [promoFocused, setPromoFocused] = useState(false);
  const hasPromo = promo.length > 0;
  const applyDisabled = promo.trim().length === 0; // no code entered → Apply is disabled
  // On a tab screen the bottom inset already spans the floating tab bar, so the
  // CTA sits 24 above it.
  const aboveTabBar = insets.bottom + 24;

  // Empty state: illustration + message centered between the nav bar and tab bar,
  // with a "Start shopping" CTA pinned above the tab bar.
  if (count === 0) {
    return (
      <View style={[styles.container, styles.empty, { backgroundColor: theme.background }]}>
        <SvgXml xml={EMPTY_CART_ILLUSTRATION} width={136} height={136} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Your shopping cart is empty
        </Text>
        <Pressable
          onPress={() => router.navigate('/')}
          style={[styles.startButton, { backgroundColor: theme.primary, bottom: aboveTabBar }]}>
          <SvgXml xml={START_SHOPPING_ICON} width={24} height={24} />
          <Text style={[styles.startLabel, { color: theme.onPrimary }]}>Start shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* "Your products: N items" — Title 1 / SemiBold 24/32, 24 below the nav bar. */}
      <Text style={[styles.header, { color: theme.text }]}>
        Your products: {count} {count === 1 ? 'item' : 'items'}
      </Text>

      {/* The cart rows — 20 below the header, 16 leading/trailing. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}>
        {items.map((item, i) => (
          <Fragment key={item.id}>
            {/* 20px · 1px Gray/200 divider · 20px between products. */}
            {i > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            <View style={styles.row}>
            <Image
              source={{ uri: item.photo.uri }}
              style={[styles.rowImage, { backgroundColor: theme.backgroundElement }]}
              contentFit="cover"
            />
            <View style={styles.rowInfo}>
              {/* Title (left) + price (right) — one line, spacer between. */}
              <View style={styles.rowTitleLine}>
                <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.rowPrice, { color: theme.text }]}>{formatUSD(item.price)}</Text>
              </View>
              {/* Size — left-aligned, right below the title. */}
              <Text style={[styles.rowSize, { color: theme.textSecondary }]}>{item.size}</Text>

              {/* Bottom half — Edit / Remove links (left), stepper (right), aligned
                  to the bottom of the 80px card. */}
              <View style={styles.rowActions}>
                <View style={styles.rowLinks}>
                  <Pressable hitSlop={6} onPress={() => {}}>
                    {/* TODO: wire "Edit prints" (re-open the builder for this print). */}
                    <Text style={[styles.editLink, { color: theme.text }]}>Edit prints</Text>
                  </Pressable>
                  <Pressable
                    hitSlop={6}
                    style={styles.removeLink}
                    onPress={() =>
                      Alert.alert('Remove this product?', 'This product will be removed from your cart.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => cartStore.remove(item.id),
                        },
                      ])
                    }>
                    <Text style={[styles.removeText, { color: theme.deleteBorder }]}>Remove</Text>
                  </Pressable>
                </View>
                <QtyStepper
                  value={item.quantity}
                  onChange={(q) => cartStore.setQuantity(item.id, q)}
                />
              </View>
            </View>
          </View>
          </Fragment>
        ))}

        {/* Continue shopping — after the last product, 40 below it. */}
        <Pressable
          onPress={() => router.navigate('/')}
          style={[
            styles.continueButton,
            { borderColor: theme.border, backgroundColor: theme.background },
          ]}>
          <SvgXml xml={CONTINUE_SHOPPING_ICON} width={24} height={24} />
          <Text style={[styles.continueLabel, { color: theme.text }]}>Continue shopping</Text>
        </Pressable>

        {/* 8px Gray/100 section divider, 24 below "Continue shopping". */}
        <View style={[styles.sectionDivider, { backgroundColor: theme.backgroundElement }]} />

        {/* "Promo code" — same title style as "Your products", 24 below the divider. */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Promo code</Text>

        {/* Promo field + attached Apply button, 16 below the title. Two boxes so
            the input's stroke can highlight (Gray/400) on focus independently. */}
        <View style={styles.promoField}>
          {/* Input box — rounded left; stroke goes Gray/400 while focused. */}
          <View
            style={[
              styles.promoInputBox,
              { borderColor: promoFocused ? theme.textMuted : theme.border },
            ]}>
            <TextInput
              style={[styles.promoInput, { color: theme.text }]}
              value={promo}
              onChangeText={setPromo}
              onFocus={() => setPromoFocused(true)}
              onBlur={() => setPromoFocused(false)}
              placeholder="Enter code"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
            />
            {/* Clear (X) — shown while there's text; 16 from the Apply button. */}
            {hasPromo && (
              <Pressable hitSlop={6} style={styles.promoClear} onPress={() => setPromo('')}>
                <SvgXml xml={CLOSE_ICON} width={24} height={24} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Apply box — rounded right, attached. Disabled: Gray/100 fill +
              Gray/400 text. Active: Brand/Light Blue 3 fill + Brand/Dark Blue text. */}
          <Pressable
            disabled={applyDisabled}
            style={[
              styles.promoApplyBox,
              {
                borderColor: theme.border,
                backgroundColor: applyDisabled ? theme.backgroundElement : theme.promoActiveBg,
              },
            ]}
            onPress={() => {
              /* TODO: validate + apply the promo code. */
            }}>
            <Text
              style={[
                styles.promoApplyText,
                { color: applyDisabled ? theme.textMuted : theme.promoActiveText },
              ]}>
              Apply
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: BottomTabInset, // discount the tab-bar area so it centers in the visible space
  },
  emptyText: {
    marginTop: 12, // 12 below the illustration
    fontFamily: FontFamily.bodyMedium, // Body / Medium 16/24, Gray/500
    fontSize: 16,
    lineHeight: 24,
  },
  startButton: {
    position: 'absolute',
    left: 16, // 16 leading / trailing
    right: 16,
    // bottom (24 above the floating tab bar) is applied inline from safe-area insets
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLabel: {
    marginLeft: 8, // 8 to the right of the icon
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  header: {
    marginTop: 24, // 24 below the nav bar
    marginHorizontal: 16, // standard content inset
    fontFamily: FontFamily.title, // Title / SemiBold (Crimson Text) 24/32
    fontSize: 24,
    lineHeight: 32,
  },
  list: {
    paddingTop: 20, // 20 below the header
    paddingHorizontal: 16, // 16 leading / trailing
  },
  divider: {
    height: 1, // 1px Gray/200, 20 above + 20 below (between products)
    marginVertical: 20,
  },
  continueButton: {
    marginTop: 40, // 40 below the last product
    height: 48,
    borderRadius: 8,
    borderWidth: 2, // Gray/200 border, white fill
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    marginLeft: 8, // 8 to the right of the icon
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24, black
    fontSize: 16,
    lineHeight: 24,
  },
  sectionDivider: {
    marginTop: 24, // 24 below "Continue shopping"
    marginHorizontal: -16, // full-bleed (counteract the list's 16 padding)
    height: 8, // 8px Gray/100 section separator
  },
  sectionTitle: {
    marginTop: 24, // 24 below the divider
    fontFamily: FontFamily.title, // Title / SemiBold (Crimson Text) 24/32, matches "Your products"
    fontSize: 24,
    lineHeight: 32,
  },
  promoField: {
    marginTop: 16, // 16 below the "Promo code" title
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  promoInputBox: {
    flex: 1,
    height: 48,
    borderWidth: 1, // Gray/200 (Gray/400 while focused)
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16, // the clear (X) sits 16 from the Apply button
    overflow: 'hidden',
  },
  promoInput: {
    flex: 1,
    fontFamily: FontFamily.body, // Body 1 / Regular 16 (placeholder Gray/500)
    fontSize: 16,
  },
  promoClear: {
    marginLeft: 8, // gap from the entered text
  },
  promoApplyBox: {
    height: 48,
    marginLeft: -1, // overlap the input's right edge → single 1px seam
    borderWidth: 1,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16, // 16 leading/trailing (12 top/bottom → 48 via height)
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoApplyText: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start', // details top-align with the image; more lines stack below
  },
  rowImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  rowInfo: {
    flex: 1,
    marginLeft: 16, // 16 to the right of the image
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    flex: 1, // takes the space; price sits at the far right (the spacer)
    marginRight: 8,
    fontFamily: FontFamily.bodySemiBold, // Body / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  rowPrice: {
    fontFamily: FontFamily.bodySemiBold, // Body / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  rowSize: {
    fontFamily: FontFamily.body, // Body 2 / Regular 14/20, Gray/500
    fontSize: 14,
    lineHeight: 20,
  },
  rowActions: {
    marginTop: 4, // 4 below the size
    height: 32, // the stepper's height; bottoms out the 80px card
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // links left, stepper right (spacer between)
  },
  rowLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editLink: {
    fontFamily: FontFamily.body, // Body / Regular 14/20, Gray/black
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
  removeLink: {
    marginLeft: 16, // 16 to the right of "Edit prints"
  },
  removeText: {
    fontFamily: FontFamily.body, // Body / Regular 14/20, Primary/600
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
  stepper: {
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 20,
    textAlign: 'center',
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  stepperSign: {
    fontSize: 18,
    lineHeight: 20,
  },
});
