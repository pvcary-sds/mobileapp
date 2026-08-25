import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { getCoupons, validateCoupon, type CouponBasketItem } from '@/api/coupons';
import { SectionDivider } from '@/components/section-divider';
import { ToastHost } from '@/components/toast-host';
import { toast } from '@/lib/toast-store';
import { CLOSE_ICON } from '@/constants/builder-icons';
import { EMPTY_CART_ILLUSTRATION } from '@/constants/illustrations';
import { BottomTabInset, FontFamily } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { cartStore, useAppliedCoupon, useCartItems } from '@/lib/cart-store';
import { selectionStore } from '@/lib/selection-store';

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

/** Filled check-circle glyph, `currentColor` — the "Active" coupon badge (12×12,
 *  Label/dark green on Label/light green). Same shape as the toast's, recolorable. */
const CHECK_BADGE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C9.62663 0 7.30655 0.703788 5.33316 2.02236C3.35977 3.34094 1.8217 5.21508 0.913451 7.4078C0.00519941 9.60051 -0.232441 12.0133 0.230582 14.3411C0.693605 16.6689 1.83649 18.807 3.51472 20.4853C5.19295 22.1635 7.33115 23.3064 9.65892 23.7694C11.9867 24.2324 14.3995 23.9948 16.5922 23.0865C18.7849 22.1783 20.6591 20.6402 21.9776 18.6668C23.2962 16.6934 24 14.3734 24 12C23.9939 8.81927 22.7277 5.77057 20.4785 3.52146C18.2294 1.27234 15.1807 0.0060992 12 0ZM17.7115 9.9L10.95 16.3615C10.7752 16.526 10.5438 16.6169 10.3039 16.6154C10.1865 16.6171 10.0701 16.5955 9.96115 16.5519C9.85223 16.5084 9.75302 16.4436 9.66923 16.3615L6.28847 13.1308C6.1947 13.049 6.11844 12.949 6.06427 12.837C6.0101 12.725 5.97915 12.6031 5.97327 12.4788C5.96739 12.3545 5.9867 12.2303 6.03005 12.1137C6.07339 11.997 6.13988 11.8903 6.22551 11.8C6.31113 11.7097 6.41413 11.6377 6.52832 11.5882C6.6425 11.5387 6.76551 11.5129 6.88995 11.5121C7.01439 11.5114 7.13769 11.5359 7.25244 11.584C7.36719 11.6322 7.47103 11.703 7.5577 11.7923L10.3039 14.4115L16.4423 8.56154C16.6218 8.40495 16.8549 8.3238 17.0928 8.33505C17.3307 8.34631 17.5551 8.4491 17.719 8.62194C17.8829 8.79477 17.9736 9.02427 17.9722 9.26246C17.9708 9.50065 17.8774 9.72908 17.7115 9.9Z" fill="currentColor"/></svg>`;

/** Format a USD amount (string or number), e.g. 75 → "$75.00". */
function formatUSD(price: string | number): string {
  const n = typeof price === 'number' ? price : Number(price) || 0;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

  // The cart as the coupon API wants it: one line per SKU, quantities summed.
  const basketItems = useMemo<CouponBasketItem[]>(() => {
    const bySku = new Map<string, number>();
    for (const i of items) bySku.set(i.sku, (bySku.get(i.sku) ?? 0) + i.quantity);
    return [...bySku].map(([sku, copies]) => ({ sku, copies }));
  }, [items]);
  const basketSig = basketItems.map((b) => `${b.sku}:${b.copies}`).join(',');

  // Offers depend only on WHICH products are in the cart, not their quantities.
  const cartSkus = basketItems.map((b) => b.sku);
  const skuSig = [...cartSkus].sort().join(',');

  // Offers carousel — API-driven + product-based: only coupons that apply to the
  // cart's SKUs come back. Refetches when the set of products changes.
  // TODO: pass the stored email (once checkout captures it) to hide used codes.
  const offers = useAsync(
    (signal) => getCoupons({ fulfillmentType: 'prodigi', skus: cartSkus }, signal),
    [skuSig],
  );
  const hasOffers = (offers.data?.length ?? 0) > 0;

  // Applied coupon — a client-side preview. Lives in the cart store so the Review
  // screen can price with it. The binding 1x-per-customer check runs at checkout.
  const appliedCoupon = useAppliedCoupon();
  const setAppliedCoupon = cartStore.setAppliedCoupon;
  const [applying, setApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Apply a code against the current basket (from the field or an offer card).
  const applyPromo = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) return;
      setApplying(true);
      setPromoError(null);
      try {
        const res = await validateCoupon({ code, items: basketItems });
        if (res.valid) {
          setAppliedCoupon({
            code,
            discountAmount: res.discountAmount,
            freeShipping: res.freeShipping,
          });
          // On success: clear the field and confirm with a toast. The applied
          // coupon lives on in the summary (and the button becomes "Remove").
          setPromo('');
          toast.success({
            title: 'Coupon added',
            subtitle: 'You’ll see the discount at checkout',
          });
        } else {
          setAppliedCoupon(null);
          setPromoError(res.message);
        }
      } catch (err) {
        setAppliedCoupon(null);
        setPromoError(err instanceof Error ? err.message : 'Could not apply the code.');
      } finally {
        setApplying(false);
      }
    },
    [basketItems],
  );

  // Remove is purely local — nothing is persisted server-side until checkout.
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setPromo('');
    setPromoError(null);
  }, []);

  // Re-validate an applied code when the basket changes: a percent discount scales
  // with the cart, and a code can fall below its minimum. Drop it if it stops
  // applying. (Not the enforcement point — checkout re-checks authoritatively.)
  useEffect(() => {
    if (!appliedCoupon) return;
    const controller = new AbortController();
    validateCoupon({ code: appliedCoupon.code, items: basketItems }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.valid) {
          setAppliedCoupon({
            code: appliedCoupon.code,
            discountAmount: res.discountAmount,
            freeShipping: res.freeShipping,
          });
        } else {
          setAppliedCoupon(null);
          setPromoError(res.message);
        }
      })
      .catch(() => {
        /* leave the last discount in place on a transient error */
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basketSig]);

  const applyDisabled = promo.trim().length === 0 || applying;

  // Summary totals.
  const totalItems = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);
  const shipping = 0;
  const promoDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount) || 0 : 0;
  const discounts = 0;
  const estimatedTotal = Math.max(0, subtotal + shipping - promoDiscount - discounts);
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
                <Text style={[styles.rowPrice, { color: theme.text }]}>
                  {formatUSD((Number(item.price) || 0) * item.quantity)}
                </Text>
              </View>
              {/* Size — left-aligned, right below the title. */}
              <Text style={[styles.rowSize, { color: theme.textSecondary }]}>{item.size}</Text>

              {/* Bottom half — Edit / Remove links (left), stepper (right), aligned
                  to the bottom of the 80px card. */}
              <View style={styles.rowActions}>
                <View style={styles.rowLinks}>
                  <Pressable
                    hitSlop={6}
                    onPress={() => {
                      // Restore the product selection, then re-open the builder with
                      // this print's photo + its saved edits.
                      selectionStore.set(item.selection.product, item.selection.variant);
                      router.navigate({
                        pathname: '/builder/[sku]',
                        params: {
                          sku: item.sku,
                          editId: item.id, // edit this cart item in place (don't add a new one)
                          photos: JSON.stringify([item.photo]),
                        },
                      });
                    }}>
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
        <SectionDivider style={{ marginTop: 24 }} />

        {/* "Promo code" — same title style as "Your products", 24 below the divider. */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Promo code</Text>

        {/* Promo field + attached Apply button, 16 below the title. Two boxes so
            the input's stroke can highlight (Gray/400) on focus independently. */}
        <View style={styles.promoField}>
          {/* Input box — rounded left; stroke goes Gray/400 while focused. */}
          <View
            style={[
              styles.promoInputBox,
              {
                borderColor: promoError
                  ? theme.promoErrorStroke
                  : promoFocused
                    ? theme.textMuted
                    : theme.border,
              },
            ]}>
            <TextInput
              style={[styles.promoInput, { color: theme.text }]}
              value={promo}
              onChangeText={(t) => {
                setPromo(t);
                if (promoError) setPromoError(null);
              }}
              onFocus={() => setPromoFocused(true)}
              onBlur={() => setPromoFocused(false)}
              onSubmitEditing={() => applyPromo(promo)}
              placeholder="Enter code"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
            />
            {/* While validating, a spinner sits where the clear (X) is; otherwise the
                clear (X) shows when there's text. */}
            {applying ? (
              <ActivityIndicator
                style={styles.promoClear}
                size="small"
                color={theme.textSecondary}
              />
            ) : hasPromo ? (
              <Pressable hitSlop={6} style={styles.promoClear} onPress={() => setPromo('')}>
                <SvgXml xml={CLOSE_ICON} width={24} height={24} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          {/* Apply box — rounded right, attached. Only ever "Apply": disabled (Gray/100
              fill + Gray/400 text) with no code, active (Brand/Light Blue 3 + Brand/Dark
              Blue) with one. On apply the field clears, so it returns to disabled. */}
          <Pressable
            disabled={applyDisabled}
            style={[
              styles.promoApplyBox,
              {
                borderColor: theme.border,
                // The seam (this box's left edge) tracks the input's error/focus stroke.
                borderLeftColor: promoError
                  ? theme.promoErrorStroke
                  : promoFocused
                    ? theme.textMuted
                    : theme.border,
                backgroundColor: applyDisabled ? theme.backgroundElement : theme.promoActiveBg,
              },
            ]}
            onPress={() => applyPromo(promo)}>
            <Text
              style={[
                styles.promoApplyText,
                { color: applyDisabled ? theme.textMuted : theme.promoActiveText },
              ]}>
              Apply
            </Text>
          </Pressable>
        </View>

        {/* Validation error (invalid / expired / already-used code) — 4 below the
            field, Primary/600. */}
        {promoError && (
          <Text style={[styles.promoError, { color: theme.promoErrorText }]}>{promoError}</Text>
        )}

        {/* 8px Gray/100 spacer, 24 below the promo field (same as above). */}
        <SectionDivider style={{ marginTop: 24 }} />

        {/* "Offers for you" — API-driven coupons in a horizontal scroll. Hidden
            entirely (with its trailing spacer) when there are no offers. */}
        {hasOffers && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Offers for you</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.couponScroll}
              contentContainerStyle={styles.couponScrollContent}>
              {offers.data!.map((c, i) => {
                const active = appliedCoupon?.code === c.code;
                return (
                  <View
                    key={c.code}
                    style={[
                      styles.coupon,
                      i > 0 && styles.couponGap,
                      {
                        // Applied → white; otherwise the brand surface.
                        backgroundColor: active ? theme.background : theme.brandSurface,
                        borderColor: theme.strokeFaint,
                      },
                    ]}>
                    <View>
                      <Text style={[styles.couponDesc, { color: theme.textTertiary }]}>
                        {c.title}
                      </Text>
                      <Text style={[styles.couponCode, { color: theme.text }]}>{c.code}</Text>
                    </View>

                    {/* "Active" badge — pinned to the top-right once applied. */}
                    {active && (
                      <View style={[styles.couponBadge, { backgroundColor: theme.successBg }]}>
                        <SvgXml xml={CHECK_BADGE_ICON} width={12} height={12} color={theme.successFg} />
                        <Text style={[styles.couponBadgeText, { color: theme.successFg }]}>Active</Text>
                      </View>
                    )}

                    <Pressable
                      style={[
                        styles.couponApply,
                        {
                          backgroundColor: theme.background,
                          borderColor: active ? theme.removeStroke : theme.textTertiary,
                        },
                      ]}
                      onPress={() => (active ? removeCoupon() : applyPromo(c.code))}>
                      <Text
                        style={[
                          styles.couponApplyText,
                          { color: active ? theme.removeText : theme.text },
                        ]}>
                        {active ? 'Remove Code' : 'Apply Code'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>

            {/* 8px Gray/100 spacer, 24 below the coupons. */}
            <SectionDivider style={{ marginTop: 24 }} />
          </>
        )}

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
            <Text style={[styles.summaryLabel, { color: theme.text }]}>
              {appliedCoupon ? `Promo code (${appliedCoupon.code})` : 'Promo code'}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.discount }]}>
              {promoDiscount > 0 ? `-${formatUSD(promoDiscount)}` : formatUSD(0)}
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
          onPress={() => router.push('/cart/checkout/contact')}>
          <Text style={[styles.checkoutLabel, { color: theme.onPrimary }]}>Checkout</Text>
        </Pressable>
      </ScrollView>

      {/* Toast host — sits in the cart's content area so toasts rest 16 below the
          nav bar. The store is global; this renders whatever's fired. */}
      <ToastHost />
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
    width: 240, // height grows with content (no fixed height)
    borderWidth: 1, // Additional stroke/10
    borderRadius: 12,
    padding: 16, // 16 top/leading/trailing/bottom
  },
  couponBadge: {
    position: 'absolute',
    top: 16, // 16 from the top / trailing of the card
    right: 16,
    height: 20,
    flexDirection: 'row',
    alignItems: 'center', // centers the 12px glyph → 4 top/bottom
    paddingLeft: 4, // 4 to the glyph
    paddingRight: 8,
    borderRadius: 6,
  },
  couponBadgeText: {
    marginLeft: 4, // 4 from the glyph
    fontFamily: FontFamily.bodyMedium, // Caption / Medium 12/18
    fontSize: 12,
    lineHeight: 18,
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
    marginTop: 42, // 42 from the code to the button
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
  promoError: {
    marginTop: 4, // 4 below the promo field
    fontFamily: FontFamily.body, // Body 2 / Regular 14/20, Primary/600
    fontSize: 14,
    lineHeight: 20,
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
