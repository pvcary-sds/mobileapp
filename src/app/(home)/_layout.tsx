import { Stack } from 'expo-router';

/**
 * The Home tab's stack: the browse flow. Titles for the dynamic routes are set
 * inside each screen once its data loads (the tier2 category name / product name).
 */
export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'SameDaySnaps' }} />
      <Stack.Screen name="tier2/[id]" options={{ title: '' }} />
      <Stack.Screen name="product/[id]" options={{ title: '', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
