import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { PhotoCanvasBackground } from '@/components/photo-canvas-background';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CHEVRON_LEFT = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Back control for the modal header (a full-screen modal has no auto Back). */
function HeaderBack() {
  const theme = useTheme();
  return (
    <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
      <SvgXml xml={CHEVRON_LEFT} width={24} height={24} color={theme.text} />
      <Text style={[styles.backLabel, { color: theme.text }]}>Back</Text>
    </Pressable>
  );
}

/**
 * Product builder — the photo editor. Reached from the PDP once a size and
 * photos are chosen (see `docs/photo-flow.md`). Presented as a full-screen modal
 * so the tab bar is hidden; a header stays for the title + a custom Back.
 *
 * For now this is just the empty canvas (dot-grid background, edge to edge below
 * the nav bar). Placing/editing the chosen photos on it is the next step.
 */
export default function BuilderScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Customize',
          headerLeft: () => <HeaderBack />,
        }}
      />
      <PhotoCanvasBackground />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 17,
  },
});
