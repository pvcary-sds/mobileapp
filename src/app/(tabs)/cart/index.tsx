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

/** Stepper minus / plus glyphs (16×16, from Figma; `currentColor` so the
 *  disabled minus can recolor). */
const MINUS_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.33325 8H12.6666" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PLUS_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.99992 3.33331V12.6666M3.33325 7.99998H12.6666" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Format a USD amount (string or number), e.g. 75 → "$75.00". */
function formatUSD(price: string | number): string {
  const n = typeof price === 'number' ? price : Number(price) || 0;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * "Offers for you" coupons. Hardcoded for now.
 * TODO: make coupons API-driven (Prodigi) — fetch available offers rather than
 * shipping this static list.
 */
const COUPONS = [
  { code: 'WELCOME20', description: '20% Off First Order' },
  { code: 'SAVE15', description: '$15 Off Orders Over $75' },
  { code: 'FREESHIP', description: 'Free Shipping' },
];

/**
 * Copy stepper for a cart row (32px tall). First pass — refine to the detailed
 * spec (button/borders/colors) once it's provided.
 */
function QtyStepper({ value, onChange }: { value: number; onChange: (q: number) => void }) {
  const theme = useTheme();
  const atMin = value <= 1; // minus disabled at 1
  return (
    <View style={[styles.stepper, { borderColor: theme.border }]}>
      <Pressable
        disabled={atMin}
        onPress={() => onChange(value - 1)}
        style={[styles.stepperBlock, atMin && { backgroundColor: theme.backgroundElement }]}>
        <SvgXml xml={MINUS_ICON} width={16} height={16} color={atMin ? theme.textMuted : theme.text} />
      </Pressable>
      <View style={styles.stepperBlock}>
        <Text style={[styles.stepperValue, { color: theme.text }]}>{value}</Text>
      </View>
      <Pressable style={styles.stepperBlock} onPress={() => onChange(value + 1)}>
        <SvgXml xml={PLUS_ICON} width={16} height={16} color={theme.text} />
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

  // Summary totals. Shipping / promo / discounts are placeholders until wired.
  const totalItems = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);
  const shipping = 0;
  const promoDiscount = 0;
  const discounts = 0;
  const estimatedTotal = subtotal + shipping - promoDiscount - discounts;
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
      {/* Everything scrolls together, header included. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom }]}>
        {/* "Your products" — Title 1 / SemiBold 24/32. */}
        <Text style={[styles.header, { color: theme.text }]}>Your products</Text>
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
                // The seam (this box's left edge) tracks the input's focus stroke.
                borderLeftColor: promoFocused ? theme.textMuted : theme.border,
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

        {/* 8px Gray/100 spacer, 24 below the promo field (same as above). */}
        <View style={[styles.sectionDivider, { backgroundColor: theme.backgroundElement }]} />

        {/* "Offers for you" — coupons in a horizontal scroll. */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Offers for you</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.couponScroll}
          contentContainerStyle={styles.couponScrollContent}>
          {COUPONS.map((c, i) => (
            <View
              key={c.code}
              style={[
                styles.coupon,
                i > 0 && styles.couponGap,
                { backgroundColor: theme.brandSurface, borderColor: theme.strokeFaint },
              ]}>
              <View>
                <Text style={[styles.couponDesc, { color: theme.textTertiary }]}>
                  {c.description}
                </Text>
                <Text style={[styles.couponCode, { color: theme.text }]}>{c.code}</Text>
              </View>
              <Pressable
                style={[
                  styles.couponApply,
                  { backgroundColor: theme.background, borderColor: theme.textTertiary },
                ]}
                onPress={() => setPromo(c.code)}>
                <Text style={[styles.couponApplyText, { color: theme.text }]}>Apply Code</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* 8px Gray/100 spacer, 24 below the coupons. */}
        <View style={[styles.sectionDivider, { backgroundColor: theme.backgroundElement }]} />

        {/* Summary — line items, an estimated total, and checkout. */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Summary</Text>
        <View style={styles.summaryRows}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.text }]}>
              Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{formatUSD(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.text }]}>Estimated shipping</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>Free</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.text }]}>Promo code</Text>
            <Text style={[styles.summaryValue, { color: theme.discount }]}>
              {formatUSD(promoDiscount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.text }]}>Discounts</Text>
            <Text style={[styles.summaryValue, { color: theme.discount }]}>
              {formatUSD(discounts)}
            </Text>
          </View>
        </View>

        {/* 1px Gray/200 line (16 leading/trailing), then the estimated total. */}
        <View style={[styles.summaryLine, { backgroundColor: theme.border }]} />
        <View style={styles.estimatedTotalRow}>
          <Text style={[styles.estimatedTotalLabel, { color: theme.text }]}>Estimated Total</Text>
          <Text style={[styles.estimatedTotalValue, { color: theme.text }]}>
            {formatUSD(estimatedTotal)}
          </Text>
        </View>

        {/* Checkout — Primary/500, 16 leading/trailing, 24 above and below. */}
        <Pressable
          style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            /* TODO: proceed to checkout (upload photos → Stripe → Prodigi order). */
          }}>
          <Text style={[styles.checkoutLabel, { color: theme.onPrimary }]}>Checkout</Text>
        </Pressable>
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
    marginBottom: 20, // 20 above the first product
    fontFamily: FontFamily.title, // Title / SemiBold (Crimson Text) 24/32
    fontSize: 24,
    lineHeight: 32,
  },
  list: {
    paddingTop: 24, // 24 below the nav bar (the header)
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
  couponScroll: {
    marginTop: 20, // 20 below the "Offers for you" title
    marginHorizontal: -16, // full-bleed so coupons scroll to the edges
  },
  couponScrollContent: {
    paddingHorizontal: 16, // first coupon 16 from the leading edge
  },
  couponGap: {
    marginLeft: 12, // 12 between coupons
  },
  coupon: {
    width: 240,
    height: 168,
    borderWidth: 1, // Additional stroke/10
    borderRadius: 12,
    padding: 16, // 16 top/leading/trailing/bottom
    justifyContent: 'space-between', // description/code at top, button at bottom
  },
  couponDesc: {
    fontFamily: FontFamily.bodyMedium, // Body 2 / Medium 14/20, Gray/700
    fontSize: 14,
    lineHeight: 20,
  },
  couponCode: {
    marginTop: 4, // 4 below the description
    fontFamily: FontFamily.titleBold, // Title 2 / Bold (Crimson Text) 20/30, Gray/black
    fontSize: 20,
    lineHeight: 30,
  },
  couponApply: {
    height: 40,
    borderWidth: 1, // Gray/700 stroke on white
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplyText: {
    fontFamily: FontFamily.bodySemiBold, // Body 2 / SemiBold 14/20, Gray/black
    fontSize: 14,
    lineHeight: 20,
  },
  summaryRows: {
    marginTop: 12, // 12 below the "Summary" title
    gap: 12, // 12 between rows
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // label left, amount right
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: FontFamily.body, // Body 1 / Regular 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  summaryValue: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  summaryLine: {
    marginTop: 12, // below "Discounts"
    height: 1, // 1px Gray/200, 16 leading/trailing (from the list padding)
  },
  estimatedTotalRow: {
    marginTop: 12, // 12 below the line
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimatedTotalLabel: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24, Gray/black
    fontSize: 16,
    lineHeight: 24,
  },
  estimatedTotalValue: {
    fontFamily: FontFamily.bodySemiBold, // Body / SemiBold 20/24, Gray/black
    fontSize: 20,
    lineHeight: 24,
  },
  checkoutButton: {
    marginTop: 24, // 24 below the estimated total
    marginBottom: 24, // 24 below the button
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutLabel: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24, on primary
    fontSize: 16,
    lineHeight: 24,
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
    alignItems: 'flex-end', // links sit at the bottom of the card (like the stepper)
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
    height: 32, // 3 × 32px blocks; Gray/200 stroke
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden', // clip the disabled-minus fill to the rounded corners
  },
  stepperBlock: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: FontFamily.bodySemiBold, // Body 2 / SemiBold 14/20
    fontSize: 14,
    lineHeight: 20,
  },
});
