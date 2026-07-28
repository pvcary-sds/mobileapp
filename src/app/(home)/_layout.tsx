import { Stack } from 'expo-router';

import { DevEnvSwitcher } from '@/components/dev-env-switcher';

/**
 * The Home tab's stack: the browse flow. Titles for the dynamic routes are set
 * inside each screen once its data loads (the tier2 category name / product name).
 * The landing screen shows the dev environment switcher in its header (dev only).
 */
export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'SameDaySnaps', headerRight: () => <DevEnvSwitcher /> }}
      />
      <Stack.Screen name="tier2/[id]" options={{ title: '' }} />
      <Stack.Screen name="product/[id]" options={{ title: '', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
