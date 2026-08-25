import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCheckout } from '@/lib/checkout-context';

/** Checkout step 3 — Confirmation (placeholder). Shown after the order is placed;
 *  Done exits the whole checkout back to the cart. */
export default function ConfirmationStep() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const c = useCheckout();
  const firstName = c.name.trim().split(' ')[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.badge, { backgroundColor: theme.stepActive }]}>
          <Ionicons name="checkmark" size={40} color={theme.onPrimary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Order placed</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Thanks{firstName ? `, ${firstName}` : ''}! Your order is confirmed and heading to print.
        </Text>
        {c.orderId ? (
          <Text style={[styles.ref, { color: theme.text }]}>Confirmation {c.orderId}</Text>
        ) : null}
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We’ll email your receipt and shipping updates{c.email.trim() ? ` to ${c.email.trim()}` : ''}.
        </Text>

        <Pressable
          style={[styles.done, { backgroundColor: theme.primary }]}
          onPress={() => router.dismissTo('/cart')}>
          <Text style={[styles.doneLabel, { color: theme.onPrimary }]}>Done</Text>
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
    paddingTop: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: FontFamily.title,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 8,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 8,
  },
  ref: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  done: {
    alignSelf: 'stretch',
    marginTop: 24,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
});
