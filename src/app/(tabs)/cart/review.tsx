import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardTypeOptions,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { router } from 'expo-router';

import { previewCheckout, type CheckoutPricing } from '@/api/checkout';
import { SectionDivider } from '@/components/section-divider';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  validateCity,
  validateEmail,
  validateLine1,
  validateName,
  validatePhone,
  validateState,
  validateZip,
} from '@/lib/checkout-form';
import { cartStore, useAppliedCoupon, useCartItems } from '@/lib/cart-store';
import { runCheckout } from '@/lib/payment';

type AutoCap = 'none' | 'words' | 'characters';

/** The checkout wizard's three steps, in order. */
const STEPS = ['Contact', 'Payment', 'Confirmation'] as const;

/** Format a USD amount, e.g. 75 → "$75.00". */
function formatUSD(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Checkbox glyphs (Figma) — unchecked is a Gray/300 outline; checked is a white
 *  box with a Gray/800 border and a black check. */
const CHECKBOX_UNCHECKED = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 1H18C20.7614 1 23 3.23858 23 6V18C23 20.7614 20.7614 23 18 23H6C3.23858 23 1 20.7614 1 18V6C1 3.23858 3.23858 1 6 1Z" stroke="#D6D6D6" stroke-width="2"/></svg>`;
const CHECKBOX_CHECKED = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 1H18C20.7614 1 23 3.23858 23 6V18C23 20.7614 20.7614 23 18 23H6C3.23858 23 1 20.7614 1 18V6C1 3.23858 3.23858 1 6 1Z" fill="white"/><path d="M6 1H18C20.7614 1 23 3.23858 23 6V18C23 20.7614 20.7614 23 18 23H6C3.23858 23 1 20.7614 1 18V6C1 3.23858 3.23858 1 6 1Z" stroke="#424242" stroke-width="2"/><path d="M6.16699 12.834L9.50033 16.1673L17.8337 7.83398" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** A required-field label: "Label" + a Primary/600 asterisk when required. */
function FieldLabel({ label, required }: { label: string; required: boolean }) {
  const theme = useTheme();
  return (
    <Text style={[styles.label, { color: theme.text }]}>
      {label}
      {required ? (
        <Text style={{ color: theme.required }}>*</Text>
      ) : (
        <Text style={{ color: theme.textSecondary }}> (Optional)</Text>
      )}
    </Text>
  );
}

/** A labelled text field whose stroke highlights (Gray/200 → Gray/400) on focus.
 *  `required` (default true) shows the asterisk. */
function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  required = true,
  chevron = false,
  style,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: AutoCap;
  required?: boolean;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      <FieldLabel label={label} required={required} />
      <View>
        <TextInput
          style={[
            styles.input,
            chevron && styles.inputWithChevron,
            { color: theme.text, borderColor: focused ? theme.textMuted : theme.border },
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {chevron ? (
          <View style={styles.fieldChevron} pointerEvents="none">
            <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** A labelled select field — looks like an input, shows the value + a chevron,
 *  and opens a picker on tap. */
function SelectField({
  label,
  value,
  onPress,
  required = true,
}: {
  label: string;
  value: string;
  onPress: () => void;
  required?: boolean;
}) {
  const theme = useTheme();
  return (
    <View>
      <FieldLabel label={label} required={required} />
      <Pressable style={[styles.input, styles.select, { borderColor: theme.border }]} onPress={onPress}>
        <Text style={[styles.selectValue, { color: theme.text }]}>{value}</Text>
        <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

/**
 * The step indicator: three titles with a circle-and-line track 10px below them.
 * Each step is in one of three states:
 *   - **completed** (before the current one): Primary/600 circle + white check;
 *     title Body2/Medium, Gray/black. The track leading up to it is Primary/600.
 *   - **current**: an outlined circle — white fill, 2px Primary/600 border, the step
 *     number in Primary/600 (no check, since it isn't done). Title Body2/Bold, Gray/black.
 *   - **upcoming**: Gray/300 circle + white step number; title Body2/Medium, Gray/500.
 *
 * So the Primary/600 fill grows across the track as steps complete. Tapping a title
 * navigates BACK to an earlier step (forward is gated by the Continue buttons).
 */
function Stepper({ step, onPress }: { step: number; onPress: (i: number) => void }) {
  const theme = useTheme();
  return (
    <View>
      <View style={styles.stepTitles}>
        {STEPS.map((label, i) => (
          <Pressable key={label} style={styles.stepCell} onPress={() => onPress(i)}>
            <Text
              style={[
                i === step ? styles.stepTitleCurrent : styles.stepTitle,
                { color: i > step ? theme.textSecondary : theme.text },
              ]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.stepTrack}>
        {STEPS.map((label, i) => {
          // The Primary fill covers everything up to and including the line to the
          // LEFT of the current circle (so the current step's preceding lines — the
          // leading stub included — are Primary too); everything to its right is gray.
          const leftPrimary = i <= step;
          const rightPrimary = i < step;
          return (
            <View key={label} style={styles.stepTrackCell}>
              <View
                style={[styles.stepLine, { backgroundColor: leftPrimary ? theme.stepActive : theme.stepTrack }]}
              />
              {i < step ? (
                // completed
                <View style={[styles.stepCircle, { backgroundColor: theme.stepActive }]}>
                  <Ionicons name="checkmark" size={13} color={theme.onPrimary} />
                </View>
              ) : i === step ? (
                // current — outlined (white fill, 2px Primary/600 border), number in Primary/600
                <View
                  style={[
                    styles.stepCircle,
                    styles.stepCircleCurrent,
                    { backgroundColor: theme.background, borderColor: theme.stepActive },
                  ]}>
                  <Text style={[styles.stepNum, { color: theme.stepActive }]}>{i + 1}</Text>
                </View>
              ) : (
                // upcoming
                <View style={[styles.stepCircle, { backgroundColor: theme.stepTrack }]}>
                  <Text style={[styles.stepNum, { color: theme.onPrimary }]}>{i + 1}</Text>
                </View>
              )}
              <View
                style={[styles.stepLine, { backgroundColor: rightPrimary ? theme.stepActive : theme.stepTrack }]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Checkout — a 3-step wizard pushed from the cart's Checkout button:
 *   1. **Contact** — contact + shipping details.
 *   2. **Payment** — the order total (with tax, via the /v1/checkout preview) + pay.
 *   3. **Confirmation** — the placed-order receipt (placeholder for now).
 *
 * You can't advance until each step's requirements are met; the tax preview runs
 * when you enter Payment. Field validation lives in `src/lib/checkout-form.ts`.
 */
export default function ReviewOrderScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0); // 0 Contact · 1 Payment · 2 Confirmation
  const [orderId, setOrderId] = useState('');

  const [name, setName] = useState(''); // full name → the API's single recipient.name
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(false); // marketing opt-in (not required)

  // Shipping. Country is fixed to the US (the API only ships US).
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zip, setZip] = useState('');

  const items = useCartItems();
  const appliedCoupon = useAppliedCoupon();
  const [paying, setPaying] = useState(false);

  // Server pricing preview — the real total INCLUDING Stripe Tax. Fetched on entering
  // the Payment step; null until then, when we fall back to the local pre-tax figures.
  const [pricing, setPricing] = useState<CheckoutPricing | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  // Local (always-known) figures, the fallback before the preview lands.
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);
  const discount = appliedCoupon ? Number(appliedCoupon.discountAmount) || 0 : 0;

  const addressReady =
    !validateLine1(line1) && !validateCity(city) && !validateState(stateCode) && !validateZip(zip);
  // Refetch key: tax changes with the address, the coupon, and the basket.
  const itemsKey = items
    .map((i) => `${i.sku}:${i.quantity}`)
    .sort()
    .join(',');

  // The preview runs when we're on the Payment step (address is complete by then),
  // and re-runs if the address / coupon / basket changes while we're back on it.
  useEffect(() => {
    if (step !== 1 || !addressReady || items.length === 0) {
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
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, addressReady, itemsKey, line1, city, stateCode, zip, appliedCoupon?.code]);

  // Prefer the server pricing (with tax); fall back to local subtotal − coupon.
  const dSubtotal = pricing ? Number(pricing.subtotal) : subtotal;
  const dDiscount = pricing?.discount ? Number(pricing.discount.amount) : discount;
  const dTax = pricing ? Number(pricing.tax) : null; // null = not computed yet
  const dTotal = pricing ? Number(pricing.total) : Math.max(0, subtotal - discount);
  const hasCoupon = dDiscount > 0;

  // Contact + shipping must be valid (and the cart non-empty) before Payment. Priming
  // the loading state here so the Payment step shows a spinner immediately, not a flash.
  const goToPayment = () => {
    if (items.length === 0) {
      Alert.alert('Your cart is empty', 'Add a print before checking out.');
      return;
    }
    const problem =
      validateName(name) ||
      validateEmail(email) ||
      (phone.trim() ? validatePhone(phone) : null) ||
      validateLine1(line1) ||
      validateCity(city) ||
      validateState(stateCode) ||
      validateZip(zip);
    if (problem) {
      Alert.alert('Check your details', problem);
      return;
    }
    setPricing(null);
    setTaxLoading(true);
    setStep(1);
  };

  // Tapping a step title goes BACK to an earlier step (forward is gated by the
  // Continue buttons). No navigation once the order is confirmed.
  const onStepPress = (i: number) => {
    if (step === 2) return;
    if (i < step) setStep(i);
  };

  // "Continue to payment" → upload the photos, present Stripe's PaymentSheet, and
  // place the Prodigi order — the whole buy flow (see `runCheckout`).
  const handlePay = async () => {
    setPaying(true);
    try {
      const outcome = await runCheckout({
        idempotencyKey: `sds-${Date.now()}`,
        shippingMethod: 'Standard',
        recipient: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: {
            line1: line1.trim(),
            line2: line2.trim() || undefined,
            city: city.trim(),
            state: stateCode.trim().toUpperCase(),
            zip: zip.trim(),
            countryCode: 'US',
          },
        },
        // One line per cart item (a photo + its copies) — NOT aggregated by SKU, so
        // this matches the order's basket signature and each print gets its own upload.
        lines: items.map((i) => ({ sku: i.sku, copies: i.quantity, photoUri: i.photo.uri })),
        couponCode: appliedCoupon?.code,
      });

      switch (outcome.status) {
        case 'ordered':
          setOrderId(outcome.orderId);
          cartStore.clear(); // order placed — empty the cart
          setStep(2); // → Confirmation
          break;
        case 'canceled':
          break; // user dismissed the sheet — no alert
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
          // Paid, but the order didn't place. Never re-charge — this needs support.
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

  const firstName = name.trim().split(' ')[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Step indicator — scrolls up with the content. */}
        <View style={styles.stepperWrap}>
          <Stepper step={step} onPress={onStepPress} />
        </View>

        {/* ── Step 1: Contact ─────────────────────────────────────────────── */}
        {step === 0 ? (
          <>
            <View style={[styles.fields, styles.fieldsFirst]}>
              <Field
                label="Full name"
                placeholder="John Cary"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Field
                label="Phone number"
                placeholder="312 123 4567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                required={false}
              />
              <Field
                label="Email"
                placeholder="john.cary@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Marketing opt-in — 16 below the email field. */}
            <Pressable style={styles.optIn} onPress={() => setOptIn((v) => !v)}>
              <SvgXml xml={optIn ? CHECKBOX_CHECKED : CHECKBOX_UNCHECKED} width={24} height={24} />
              <Text style={[styles.optInText, { color: theme.text }]}>
                Keep me updated on deals, inspiration, and new products
              </Text>
            </Pressable>

            <SectionDivider style={styles.divider} />

            <Text style={[styles.header, styles.section, { color: theme.text }]}>Shipping details</Text>
            <View style={styles.fields}>
              <Field
                label="Address 1"
                placeholder="123 Main St"
                value={line1}
                onChangeText={setLine1}
                autoCapitalize="words"
              />
              <Field
                label="Address 2"
                placeholder="Apt, suite, etc."
                value={line2}
                onChangeText={setLine2}
                autoCapitalize="words"
                required={false}
              />
              <Field
                label="City"
                placeholder="Chicago"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
              <View style={styles.row}>
                <Field
                  label="State"
                  placeholder="IL"
                  value={stateCode}
                  onChangeText={setStateCode}
                  autoCapitalize="characters"
                  style={styles.rowItem}
                  chevron
                />
                <Field
                  label="Zip"
                  placeholder="60606"
                  value={zip}
                  onChangeText={setZip}
                  keyboardType="numbers-and-punctuation"
                  style={styles.rowItem}
                />
              </View>
              <SelectField
                label="Country"
                value="United States"
                // TODO: country picker. The API is US-only today, so this is fixed.
                onPress={() => {}}
              />
            </View>

            {/* Advance to Payment (validates contact + shipping first). */}
            <Pressable
              style={[styles.continue, { backgroundColor: theme.primary }]}
              onPress={goToPayment}>
              <Text style={[styles.continueLabel, { color: theme.onPrimary }]}>Continue</Text>
            </Pressable>
          </>
        ) : null}

        {/* ── Step 2: Payment ─────────────────────────────────────────────── */}
        {step === 1 ? (
          <>
            <Text style={[styles.header, { color: theme.text }]}>Order details</Text>

            {/* Ship-to recap — who/where, since those fields live on the prior step. */}
            <View style={styles.recap}>
              <Text style={[styles.recapName, { color: theme.text }]}>{name.trim()}</Text>
              <Text style={[styles.recapLine, { color: theme.textSecondary }]}>
                {line1.trim()}
                {line2.trim() ? `, ${line2.trim()}` : ''}
              </Text>
              <Text style={[styles.recapLine, { color: theme.textSecondary }]}>
                {city.trim()}, {stateCode.trim().toUpperCase()} {zip.trim()}
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
              ) : taxLoading ? (
                <ActivityIndicator size="small" color={theme.textSecondary} />
              ) : (
                <Text style={[styles.ledgerHint, { color: theme.textSecondary }]}>
                  Calculated at payment
                </Text>
              )}
            </View>

            {/* 1px Gray/200 rule between the line items and the grand total. */}
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
                <Text style={[styles.continueLabel, { color: theme.onPrimary }]}>
                  Continue to payment
                </Text>
              )}
            </Pressable>
          </>
        ) : null}

        {/* ── Step 3: Confirmation (placeholder) ──────────────────────────── */}
        {step === 2 ? (
          <View style={styles.confirm}>
            <View style={[styles.confirmBadge, { backgroundColor: theme.stepActive }]}>
              <Ionicons name="checkmark" size={40} color={theme.onPrimary} />
            </View>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Order placed</Text>
            <Text style={[styles.confirmBody, { color: theme.textSecondary }]}>
              Thanks{firstName ? `, ${firstName}` : ''}! Your order is confirmed and heading to print.
            </Text>
            {orderId ? (
              <Text style={[styles.confirmRef, { color: theme.text }]}>Confirmation {orderId}</Text>
            ) : null}
            <Text style={[styles.confirmBody, { color: theme.textSecondary }]}>
              We’ll email your receipt and shipping updates
              {email.trim() ? ` to ${email.trim()}` : ''}.
            </Text>
            <Pressable
              style={[styles.continue, styles.confirmDone, { backgroundColor: theme.primary }]}
              onPress={() => router.back()}>
              <Text style={[styles.continueLabel, { color: theme.onPrimary }]}>Done</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Step indicator — scrolls with the content; 24 gap to the first section below.
  stepperWrap: {
    marginBottom: 24,
  },
  stepTitles: {
    flexDirection: 'row', // 16 leading/trailing comes from the content padding
  },
  stepCell: {
    flex: 1, // three equal columns; title centered under its future circle
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontFamily: FontFamily.bodyMedium, // disabled step — Body 2 / Medium 14/20, Gray/500
    fontSize: 14,
    lineHeight: 20,
  },
  stepTitleCurrent: {
    fontFamily: FontFamily.bodyBold, // current step — Body 2 / Bold 14/20
    fontSize: 14,
    lineHeight: 20,
  },
  stepTrack: {
    marginTop: 10, // 10 below the titles
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepTrackCell: {
    flex: 1, // circle centered by the two flanking lines; aligns under the title
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepLine: {
    flex: 1,
    height: 3, // 3px connecting line
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 4, // 4px between the circle and each line
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCurrent: {
    borderWidth: 2, // current step — outlined, no fill (border set inline: Primary/600)
  },
  stepNum: {
    fontFamily: FontFamily.bodyBold, // Caption / Bold 12 — step number in a circle.
    fontSize: 12,
    // No explicit lineHeight: lets the glyph self-center in the 20px circle (an 18px
    // line-box would sit the digit ~1px low on iOS).
    textAlign: 'center',
  },
  content: {
    paddingTop: 24, // 24 below the step track
    paddingHorizontal: 16, // 16 leading / trailing (header + fields)
  },
  header: {
    fontFamily: FontFamily.title, // Title 1 / SemiBold (Crimson Text) 24/32
    fontSize: 24,
    lineHeight: 32,
  },
  divider: {
    marginTop: 24, // 24 below the opt-in text
  },
  section: {
    marginTop: 24, // section header 24 below the divider
  },
  fields: {
    marginTop: 16, // 16 below the header
    gap: 16, // 16 between fields
  },
  fieldsFirst: {
    marginTop: 0, // no header above (Contact step) — the stepper gap provides the space
  },
  row: {
    flexDirection: 'row',
    gap: 16, // 16 between State and Zip
  },
  rowItem: {
    flex: 1, // State and Zip split the row evenly
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // value left, chevron right
  },
  selectValue: {
    fontFamily: FontFamily.body, // Body 1 / Regular 16
    fontSize: 16,
  },
  label: {
    marginBottom: 8, // gap to the input
    fontFamily: FontFamily.bodyMedium, // field label
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    height: 48,
    borderWidth: 1, // Gray/200 (Gray/400 when focused)
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: FontFamily.body, // Body 1 / Regular 16 (placeholder Gray/500)
    fontSize: 16,
  },
  inputWithChevron: {
    paddingRight: 44, // clear the chevron (16 inset + 20 icon + gap)
  },
  fieldChevron: {
    position: 'absolute',
    right: 16, // 16 from the right edge
    top: 0,
    bottom: 0,
    justifyContent: 'center', // vertically centered in the 48px field
  },
  optIn: {
    marginTop: 16, // 16 below the email field
    flexDirection: 'row',
    alignItems: 'flex-start', // checkbox aligns with the first line of text
  },
  optInText: {
    flex: 1,
    marginLeft: 12, // 12 to the right of the checkbox
    fontFamily: FontFamily.body, // Body 1 / Regular 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  // Ship-to recap on the Payment step.
  recap: {
    marginTop: 16,
    gap: 2,
  },
  recapName: {
    fontFamily: FontFamily.bodyMedium, // Body 1 / Medium 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  recapLine: {
    fontFamily: FontFamily.body, // Body 2 / Regular 14/20
    fontSize: 14,
    lineHeight: 20,
  },
  // Ledger line item (Subtotal / You saved / Tax) — label left, amount right.
  ledgerRow: {
    marginTop: 12, // 12 between line items
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerFirst: {
    marginTop: 24, // first line (Subtotal) is 24 below the recap
  },
  ledgerLabel: {
    fontFamily: FontFamily.body, // Body 1 / Regular 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  ledgerAmount: {
    fontFamily: FontFamily.body, // Body 1 / Regular 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  ledgerHint: {
    fontFamily: FontFamily.body, // Body 2 / Regular 14/20 — the "tax pending" hint
    fontSize: 14,
    lineHeight: 20,
  },
  totalRule: {
    marginTop: 16, // 16 below the last line item
    height: 1, // 1px Gray/200 (16 leading/trailing from the content padding)
  },
  // Grand total row — below the rule; emphasized.
  totalRow: {
    marginTop: 12, // 12 below the rule
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24, Gray/black
    fontSize: 16,
    lineHeight: 24,
  },
  grandAmount: {
    fontFamily: FontFamily.bodySemiBold, // SemiBold 20/28, Gray/black
    fontSize: 20,
    lineHeight: 28,
  },
  continue: {
    marginTop: 24, // 24 below the content above it
    height: 48, // Primary/500, 16 leading/trailing (from the content padding)
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24, white
    fontSize: 16,
    lineHeight: 24,
  },
  // Confirmation step (placeholder).
  confirm: {
    alignItems: 'center',
    paddingTop: 32,
  },
  confirmBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  confirmTitle: {
    fontFamily: FontFamily.title, // Title 1 / SemiBold 24/32
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 8,
  },
  confirmBody: {
    fontFamily: FontFamily.body, // Body 1 / Regular 16/24
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 8,
  },
  confirmRef: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  confirmDone: {
    alignSelf: 'stretch', // full-width button inside the centered column
  },
});
