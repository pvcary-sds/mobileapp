import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
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

type AutoCap = 'none' | 'words' | 'characters';

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
      {required ? <Text style={{ color: theme.required }}>*</Text> : null}
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
  style,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: AutoCap;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      <FieldLabel label={label} required={required} />
      <TextInput
        style={[
          styles.input,
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

        {/* "Shipping" — same title style, 24 below the divider. */}
        <Text style={[styles.header, styles.section, { color: theme.text }]}>Shipping</Text>

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
            placeholder="Apt, suite, etc. (optional)"
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
});
