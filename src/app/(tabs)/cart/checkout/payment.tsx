import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { previewCheckout } from '@/api/checkout';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cartStore, useAppliedCoupon, useCartItems } from '@/lib/cart-store';
import { formatUSD, useCheckout } from '@/lib/checkout-context';
import { runCheckout } from '@/lib/payment';

/** Checkout step 2 — Order details + payment. The tax preview runs on entering
 *  this screen; Continue to payment runs the whole charge → order flow. */
export default function PaymentStep() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const c = useCheckout();
  const items = useCartItems();
  const appliedCoupon = useAppliedCoupon();
  const [paying, setPaying] = useState(false);

  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);
  const discount = appliedCoupon ? Number(appliedCoupon.discountAmount) || 0 : 0;
  const itemsKey = items
    .map((i) => `${i.sku}:${i.quantity}`)
    .sort()
    .join(',');

  const { line1, line2, city, stateCode, zip, addressReady, setPricing, setTaxLoading } = c;

  // Fetch the real total (incl. Stripe Tax) on entering this step / when inputs change.
  useEffect(() => {
    if (!addressReady || items.length === 0) {
      setTaxLoading(false);
      return;
    }
    const controller = new AbortController();
    setTaxLoading(true);
    const timer = setTimeout(() => {
      previewCheckout(
        {
          shipTo: {
            line1: line1.trim(),
            line2: line2.trim() || undefined,
            city: city.trim(),
            state: stateCode.trim().toUpperCase(),
            zip: zip.trim(),
            countryCode: 'US',
          },
          items: items.map((i) => ({ sku: i.sku, copies: i.quantity })),
          couponCode: appliedCoupon?.code,
        },
        controller.signal,
      )
        .then((p) => setPricing(p))
        .catch(() => {
          if (!controller.signal.aborted) setPricing(null); // fall back to local, pre-tax
        })
        .finally(() => {
          if (!controller.signal.aborted) setTaxLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressReady, itemsKey, line1, line2, city, stateCode, zip, appliedCoupon?.code]);

  // Prefer the server pricing (with tax); fall back to local subtotal − coupon.
  const dSubtotal = c.pricing ? Number(c.pricing.subtotal) : subtotal;
  const dDiscount = c.pricing?.discount ? Number(c.pricing.discount.amount) : discount;
  const dTax = c.pricing ? Number(c.pricing.tax) : null;
  const dTotal = c.pricing ? Number(c.pricing.total) : Math.max(0, subtotal - discount);
  const hasCoupon = dDiscount > 0;

  const handlePay = async () => {
    setPaying(true);
    try {
      const outcome = await runCheckout({
        idempotencyKey: `sds-${Date.now()}`,
        shippingMethod: 'Standard',
        recipient: {
          name: c.name.trim(),
          email: c.email.trim(),
          phone: c.phone.trim() || undefined,
          address: c.shipTo,
        },
        lines: items.map((i) => ({ sku: i.sku, copies: i.quantity, photoUri: i.photo.uri })),
        couponCode: appliedCoupon?.code,
      });

      switch (outcome.status) {
        case 'ordered':
          c.setOrderId(outcome.orderId);
          cartStore.clear();
          router.replace('/cart/checkout/confirmation');
          break;
        case 'canceled':
          break;
        case 'unavailable':
          Alert.alert(
            'Payment not available',
            'This build doesn’t include Stripe yet. Install the Stripe dev build and set a publishable key.',
          );
          break;
        case 'payment_error':
          Alert.alert('Payment failed', outcome.message);
          break;
        case 'order_error':
          Alert.alert(
            'Order needs attention',
            `Your payment went through, but we couldn’t place the order (${outcome.message}). ` +
              `We’ll sort it out — reference ${outcome.paymentIntentId}.`,
          );
          break;
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={[styles.header, { color: theme.text }]}>Order details</Text>

        {/* Ship-to recap — who / where (those fields live on the previous step). */}
        <View style={styles.recap}>
          <Text style={[styles.recapName, { color: theme.text }]}>{c.name.trim()}</Text>
          <Text style={[styles.recapLine, { color: theme.textSecondary }]}>
            {c.line1.trim()}
            {c.line2.trim() ? `, ${c.line2.trim()}` : ''}
          </Text>
          <Text style={[styles.recapLine, { color: theme.textSecondary }]}>
            {c.city.trim()}, {c.stateCode.trim().toUpperCase()} {c.zip.trim()}
          </Text>
        </View>

        {/* Ladder: Subtotal → You saved → Tax → rule → Total. */}
        <View style={[styles.ledgerRow, styles.ledgerFirst]}>
          <Text style={[styles.ledgerLabel, { color: theme.textTertiary }]}>Subtotal</Text>
          <Text style={[styles.ledgerAmount, { color: theme.text }]}>{formatUSD(dSubtotal)}</Text>
        </View>

        {hasCoupon ? (
          <View style={styles.ledgerRow}>
            <Text style={[styles.ledgerLabel, { color: theme.textPositive }]}>You saved</Text>
            <Text style={[styles.ledgerAmount, { color: theme.textPositive }]}>
              −{formatUSD(dDiscount)}
            </Text>
          </View>
        ) : null}

        <View style={styles.ledgerRow}>
          <Text style={[styles.ledgerLabel, { color: theme.textTertiary }]}>Tax</Text>
          {dTax != null ? (
            <Text style={[styles.ledgerAmount, { color: theme.text }]}>{formatUSD(dTax)}</Text>
          ) : c.taxLoading ? (
            <ActivityIndicator size="small" color={theme.textSecondary} />
          ) : (
            <Text style={[styles.ledgerHint, { color: theme.textSecondary }]}>Calculated at payment</Text>
          )}
        </View>

        <View style={[styles.totalRule, { backgroundColor: theme.border }]} />

        <View style={styles.totalRow}>
          <Text style={[styles.grandLabel, { color: theme.text }]}>Total</Text>
          <Text style={[styles.grandAmount, { color: theme.text }]}>{formatUSD(dTotal)}</Text>
        </View>

        <Pressable
          style={[styles.continue, { backgroundColor: theme.primary }]}
          disabled={paying}
          onPress={handlePay}>
          {paying ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <Text style={[styles.continueLabel, { color: theme.onPrimary }]}>Continue to payment</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  header: {
    fontFamily: FontFamily.title,
    fontSize: 24,
    lineHeight: 32,
  },
  recap: {
    marginTop: 16,
    gap: 2,
  },
  recapName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  recapLine: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  ledgerRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerFirst: {
    marginTop: 24,
  },
  ledgerLabel: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  ledgerAmount: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  ledgerHint: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  totalRule: {
    marginTop: 16,
    height: 1,
  },
  totalRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  grandAmount: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  continue: {
    marginTop: 24,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
});
