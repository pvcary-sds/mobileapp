import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { router, Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { CheckoutProvider } from '@/lib/checkout-context';

export const unstable_settings = { initialRouteName: 'contact' };

/** Custom back for the Contact step (the nested stack's first screen, where the
 *  native back doesn't appear) — pops the whole checkout back to the cart. */
function BackButton() {
  const theme = useTheme();
  return (
    <Pressable hitSlop={8} onPress={() => router.back()}>
      <Ionicons name="chevron-back" size={28} color={theme.text} />
    </Pressable>
  );
}

/**
 * The checkout wizard's nested stack. It uses the NATIVE header (title "Checkout")
 * so the nav bar — height, title, and the separator hairline — matches the rest of
 * the app exactly; the step indicator lives in each screen's scroll content. Back
 * exits to the cart from Contact and pops a step from Payment; Confirmation has no
 * back (the order is placed).
 */
export default function CheckoutLayout() {
  const theme = useTheme();
  return (
    <CheckoutProvider>
      <Stack
        screenOptions={{
          headerTitle: 'Checkout',
          headerTitleAlign: 'center',
          headerTintColor: theme.text,
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="contact" options={{ headerLeft: () => <BackButton /> }} />
        <Stack.Screen name="payment" />
        <Stack.Screen name="confirmation" options={{ headerBackVisible: false, gestureEnabled: false }} />
      </Stack>
    </CheckoutProvider>
  );
}
