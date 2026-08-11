import { Stack } from 'expo-router';

/**
 * The Cart tab's stack — gives the tab a native nav bar (titled "Cart"), the
 * same way the Home tab draws its own headers. The default nav-bar separator
 * (the hairline under the title) is kept — consistent app-wide.
 */
export default function CartStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Cart' }} />
    </Stack>
  );
}
