import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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

import { SectionDivider } from '@/components/section-divider';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppliedCoupon, useCartItems } from '@/lib/cart-store';
import { runCheckoutPayment } from '@/lib/payment';

type AutoCap = 'none' | 'words' | 'characters';

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
 * Checkout step 1 — "Review order". Pushed from the cart's Checkout button.
 * Being built section by section: contact details, shipping, order summary, and
 * payment (form validation lives in `src/lib/checkout-form.ts`).
 */
export default function ReviewOrderScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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

  // Totals. Tax is added at payment (it needs the address); this shows the
  // subtotal minus any applied coupon.
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);
  const discount = appliedCoupon ? Number(appliedCoupon.discountAmount) || 0 : 0;
  const total = Math.max(0, subtotal - discount);
  const hasCoupon = discount > 0;

  // "Proceed to Checkout" → price the basket (/v1/checkout) and present Stripe's
  // PaymentSheet. (Placing the Prodigi order is the next step, after payment.)
  const handleProceed = async () => {
    const missing = [
      !name.trim() && 'name',
      !email.trim() && 'email',
      !line1.trim() && 'address',
      !city.trim() && 'city',
      !stateCode.trim() && 'state',
      !zip.trim() && 'ZIP',
    ].filter(Boolean);
    if (missing.length) {
      Alert.alert('Missing details', `Please fill in: ${missing.join(', ')}.`);
      return;
    }
    if (items.length === 0) {
      Alert.alert('Your cart is empty', 'Add a print before checking out.');
      return;
    }

    setPaying(true);
    try {
      // One line per SKU (quantities summed) — checkout prices sku × copies.
      const bySku = new Map<string, number>();
      for (const i of items) bySku.set(i.sku, (bySku.get(i.sku) ?? 0) + i.quantity);

      const outcome = await runCheckoutPayment({
        idempotencyKey: `sds-${Date.now()}`,
        shippingMethod: 'Standard',
        email: email.trim(),
        shipTo: {
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          city: city.trim(),
          state: stateCode.trim().toUpperCase(),
          zip: zip.trim(),
          countryCode: 'US',
        },
        items: [...bySku].map(([sku, copies]) => ({ sku, copies })),
      });

      switch (outcome.status) {
        case 'completed':
          Alert.alert('Payment complete', `Charged ${outcome.total}. Order placement is the next step.`);
          break;
        case 'canceled':
          break; // user dismissed the sheet — no alert
        case 'unavailable':
          Alert.alert(
            'Payment not available',
            'This build doesn’t include Stripe yet. Install the Stripe dev build and set a publishable key.',
          );
          break;
        case 'error':
          Alert.alert('Payment failed', outcome.message);
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* "Contact details" — Title 1 / SemiBold 24/32, 24 below the nav bar. */}
        <Text style={[styles.header, { color: theme.text }]}>Contact details</Text>

        {/* 4 required fields, 16 below the header and 16 apart. */}
        <View style={styles.fields}>
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

        {/* Marketing opt-in — 16 below the email field; checkbox at the 16 leading
            edge, text 12 to its right. */}
        <Pressable style={styles.optIn} onPress={() => setOptIn((v) => !v)}>
          <SvgXml xml={optIn ? CHECKBOX_CHECKED : CHECKBOX_UNCHECKED} width={24} height={24} />
          <Text style={[styles.optInText, { color: theme.text }]}>
            Keep me updated on deals, inspiration, and new products
          </Text>
        </Pressable>

        {/* 8px Gray/100 divider, 24 below the opt-in text. */}
        <SectionDivider style={styles.divider} />

        {/* "Shipping details" — same title style, 24 below the divider. */}
        <Text style={[styles.header, styles.section, { color: theme.text }]}>Shipping details</Text>

        {/* Shipping fields — 16 below the header, 16 apart. */}
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
          {/* State + Zip share a row to save vertical space. */}
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

        {/* 8px Gray/100 divider below Country, then the order-summary section. */}
        <SectionDivider style={styles.divider} />
        <Text style={[styles.header, styles.section, { color: theme.text }]}>Order summary</Text>

        {/* Total row — 16 below the header. Label left, amount right; a struck-out
            original price sits 4 to the left of the amount when a coupon applies. */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
          <View style={styles.totalRight}>
            {hasCoupon ? (
              <Text style={[styles.totalStrike, { color: theme.textSecondary }]}>
                {formatUSD(subtotal)}
              </Text>
            ) : null}
            <Text style={[styles.totalAmount, { color: theme.text }]}>{formatUSD(total)}</Text>
          </View>
        </View>
        {hasCoupon ? (
          <Text style={[styles.youSaved, { color: theme.textPositive }]}>
            You saved {formatUSD(discount)}
          </Text>
        ) : null}

        {/* 1px Gray/200 rule, 12 below the totals. */}
        <View style={[styles.totalRule, { backgroundColor: theme.border }]} />

        {/* "Continue" — 24 below the rule; opens Stripe's PaymentSheet. */}
        <Pressable
          style={[styles.continue, { backgroundColor: theme.primary }]}
          disabled={paying}
          onPress={handleProceed}>
          {paying ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <Text style={[styles.continueLabel, { color: theme.onPrimary }]}>
              Continue to payment
            </Text>
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
    paddingTop: 24, // 24 from the top (below the nav bar)
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
  totalRow: {
    marginTop: 16, // 16 below the Payment header
    flexDirection: 'row',
    justifyContent: 'space-between', // label left, amount right
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: FontFamily.bodyMedium, // Body 1 / Medium 16/24, Gray/black
    fontSize: 16,
    lineHeight: 24,
  },
  totalRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalStrike: {
    marginRight: 4, // 4 to the left of the amount
    fontFamily: FontFamily.body, // Body 1 / Regular 16/24, Gray/500
    fontSize: 16,
    lineHeight: 24,
    textDecorationLine: 'line-through',
  },
  totalAmount: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24, Gray/black
    fontSize: 16,
    lineHeight: 24,
  },
  youSaved: {
    marginTop: 4, // 4 below the Total row
    fontFamily: FontFamily.bodyMedium, // Text/Positive/Default
    fontSize: 16,
    lineHeight: 24,
  },
  totalRule: {
    marginTop: 16, // 16 below the totals (You saved / Total)
    height: 1, // 1px Gray/200 (16 leading/trailing from the content padding)
  },
  continue: {
    marginTop: 24, // 24 below the rule
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
});
