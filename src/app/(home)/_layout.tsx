import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

import { CartIcon } from '@/components/cart-icon';
import { DevEnvSwitcher } from '@/components/dev-env-switcher';

/** Cart action in the header (top right) → opens the Cart tab. */
function HeaderCartButton() {
  return (
    <Pressable onPress={() => router.navigate('/cart')} hitSlop={8}>
      <CartIcon />
    </Pressable>
  );
}

/**
 * The Home tab's stack: the browse flow. Titles for the dynamic routes are set
 * inside each screen once its data loads. `headerShadowVisible: false` drops the
 * hairline under the nav bar for a cleaner custom look. On the landing screen the
 * dev env switcher sits top-left; the cart action sits top-right.
 */
export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'SameDaySnaps',
          headerLeft: () => <DevEnvSwitcher />,
          headerRight: () => <HeaderCartButton />,
        }}
      />
      <Stack.Screen name="tier2/[id]" options={{ title: '' }} />
      <Stack.Screen name="product/[id]" options={{ title: '', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
