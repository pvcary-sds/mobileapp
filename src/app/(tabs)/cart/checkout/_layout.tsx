import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, Stack, useSegments } from 'expo-router';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CheckoutProvider } from '@/lib/checkout-context';

export const unstable_settings = { initialRouteName: 'contact' };

/**
 * The fixed checkout nav bar: a custom back button + "Checkout" title. The step
 * indicator is NOT here — it lives at the top of each screen's scroll content so it
 * scrolls with the page (see `CheckoutStepper`). Back is hidden on Confirmation
 * (the order is already placed).
 */
function CheckoutNavBar() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const segments = useSegments();
  const onConfirmation = segments[segments.length - 1] === 'confirmation';
  return (
    <View
      style={[
        styles.navBar,
        { paddingTop: insets.top, backgroundColor: theme.background, borderBottomColor: theme.border },
      ]}>
      <View style={styles.navRow}>
        {!onConfirmation ? (
          <Pressable style={styles.backBtn} hitSlop={8} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </Pressable>
        ) : null}
        <Text style={[styles.navTitle, { color: theme.text }]}>Checkout</Text>
      </View>
    </View>
  );
}

export default function CheckoutLayout() {
  return (
    <CheckoutProvider>
      <View style={styles.container}>
        <CheckoutNavBar />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="contact" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="confirmation" />
        </Stack>
      </View>
    </CheckoutProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    borderBottomWidth: StyleSheet.hairlineWidth, // keep the app-wide nav-bar separator
  },
  navRow: {
    height: 44,
    justifyContent: 'center', // title centered
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 8, // ~16 optical inset once the chevron's own padding is counted
    height: 44,
    justifyContent: 'center',
  },
  navTitle: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
});
