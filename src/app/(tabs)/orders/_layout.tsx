import { Stack } from 'expo-router';

/**
 * The Orders tab's stack: a list of the orders placed on this device
 * (`order-history`) → a per-order detail / tracking screen (`GET /v1/orders/:id`).
 */
export default function OrdersStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Orders' }} />
      <Stack.Screen name="[id]" options={{ title: 'Order', headerBackTitle: 'Orders' }} />
    </Stack>
  );
}
