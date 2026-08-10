import { Stack } from 'expo-router';

/**
 * The Cart tab's stack — gives the tab a native nav bar (titled "Cart"), the
 * same way the Home tab draws its own headers. `headerShadowVisible: false`
 * drops the hairline for the app's cleaner look.
 */
export default function CartStackLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Cart' }} />
    </Stack>
  );
}
