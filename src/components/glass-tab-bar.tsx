import { GlassView } from 'expo-glass-effect';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/tab-bar-icon';
import { Colors, FontFamily } from '@/constants/theme';

const TAB_CONFIG: Record<string, { label: string; icon: string }> = {
  '(home)': { label: 'Home', icon: 'home' },
  gallery: { label: 'Gallery', icon: 'gallery' },
  cart: { label: 'Cart', icon: 'cart' },
  orders: { label: 'Orders', icon: 'orders' },
};

// Minimal shape of the bottom-tab bar props we use (avoids depending on
// @react-navigation/bottom-tabs directly).
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

/**
 * Custom tab bar on a real Liquid Glass surface (`GlassView`). Unlike the native
 * `NativeTabs`, we render the labels ourselves — so we control the exact colors
 * (Gray 500 / near-black), DM Sans weights (Medium / SemiBold), size 12,
 * lineHeight 18, and the 8px icon↔label gap.
 */
export function GlassTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <GlassView style={styles.bar} glassEffectStyle="regular">
        {state.routes.map((route, index) => {
          const cfg = TAB_CONFIG[route.name];
          if (!cfg) return null;
          const focused = state.index === index;
          const color = focused ? Colors.text : Colors.textSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} style={styles.item} onPress={onPress} hitSlop={6}>
              <TabBarIcon name={cfg.icon} focused={focused} color={color} size={24} />
              <Text
                style={[
                  styles.label,
                  {
                    color,
                    fontFamily: focused ? FontFamily.bodySemiBold : FontFamily.bodyMedium,
                  },
                ]}>
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 8, // 8px icon ↔ label
  },
  label: {
    fontSize: 12,
    lineHeight: 18,
  },
});
