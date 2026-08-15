import { useState } from 'react';
import {
  KeyboardTypeOptions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AutoCap = 'none' | 'words';

/** A labelled text field: "Label *" (red asterisk) above an input whose stroke
 *  highlights (Gray/200 → Gray/400) on focus. */
function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: AutoCap;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={[styles.label, { color: theme.text }]}>
        {label}
        <Text style={{ color: theme.required }}>*</Text>
      </Text>
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

/**
 * Checkout step 1 — "Review order". Pushed from the cart's Checkout button.
 * Being built section by section: contact details, shipping, order summary, and
 * payment (form validation lives in `src/lib/checkout-form.ts`).
 */
export default function ReviewOrderScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

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
            label="First name"
            placeholder="John"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <Field
            label="Last name"
            placeholder="Smith"
            value={lastName}
            onChangeText={setLastName}
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
  fields: {
    marginTop: 16, // 16 below the header
    gap: 16, // 16 between fields
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
});
