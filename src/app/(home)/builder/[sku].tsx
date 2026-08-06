import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { PhotoCanvasBackground } from '@/components/photo-canvas-background';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CHEVRON_LEFT = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const DELETE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="#C12000" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="#C12000" stroke-width="1.5" stroke-linecap="round"/><path d="M9.5 16.5L9.5 10.5" stroke="#C12000" stroke-width="1.5" stroke-linecap="round"/><path d="M14.5 16.5L14.5 10.5" stroke="#C12000" stroke-width="1.5" stroke-linecap="round"/></svg>`;

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
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Customize',
          headerLeft: () => <HeaderBack />,
        }}
      />
      <PhotoCanvasBackground />

      {/* TODO: wire delete (remove the current photo from the canvas). */}
      <Pressable
        style={[
          styles.deleteButton,
          { borderColor: theme.deleteBorder, backgroundColor: theme.background },
        ]}>
        <SvgXml xml={DELETE_ICON} width={24} height={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 16, // 16 below the nav bar
    left: 16, // 16 from the left edge
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
