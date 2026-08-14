import { useCallback, useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/toast';
import { toast, useToast } from '@/lib/toast-store';

/** Standard nav-bar content height, so the toast rests just below it. */
const NAV_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

/**
 * Renders the active toast (from `toast-store`) over everything, once, at the app
 * root. Slides **down from the top** to rest 16 below the nav bar (16 leading/
 * trailing), auto-dismisses after the toast's duration, and dismisses on the X.
 *
 * Mounted in `app/_layout.tsx` so any screen's `toast.success(...)` surfaces here.
 */
export function ToastHost() {
  const data = useToast();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;

  const hide = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => finished && toast.hide());
  }, [translateY]);

  // Enter + auto-dismiss whenever a new toast appears (keyed on id via `data`).
  useEffect(() => {
    if (!data) return;
    translateY.setValue(-200);
    Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    const t = setTimeout(hide, data.durationMs);
    return () => clearTimeout(t);
  }, [data, hide, translateY]);

  if (!data) return null;

  return (
    <Animated.View
      pointerEvents="box-none" // taps pass through except on the toast itself
      style={[
        styles.host,
        { top: insets.top + NAV_BAR_HEIGHT + 16, transform: [{ translateY }] },
      ]}>
      <Toast variant={data.variant} title={data.title} subtitle={data.subtitle} onClose={hide} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16, // 16 leading / trailing
    right: 16,
    zIndex: 1000, // over everything
  },
});
