import { Ionicons } from '@expo/vector-icons';
import { Fragment, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, Stack, useSegments } from 'expo-router';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CHECKOUT_STEPS, CheckoutProvider } from '@/lib/checkout-context';

export const unstable_settings = { initialRouteName: 'contact' };

/** Map the current route segment to a step index. */
function stepForSegment(segment: string | undefined): number {
  return segment === 'payment' ? 1 : segment === 'confirmation' ? 2 : 0;
}

/**
 * One 3px line in the step track — a leading/trailing stub (`flex` 1) or a
 * connector between two circles (`flex` 2). Gray base with a Primary/600 fill whose
 * width animates 0↔100% (left → right) when `active` changes, so progress "flows"
 * as a single continuous front as you move between step screens.
 */
function StepLine({ active, flex = 1 }: { active: boolean; flex?: number }) {
  const theme = useTheme();
  const fill = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: active ? 1 : 0,
      duration: 280,
      useNativeDriver: false, // animating width — not supported on the native driver
    }).start();
  }, [active, fill]);
  return (
    <View style={[styles.stepLine, { flex, backgroundColor: theme.stepTrack }]}>
      <Animated.View
        style={[
          styles.stepLineFill,
          {
            backgroundColor: theme.stepActive,
            width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

/**
 * The step indicator, shown in the persistent checkout header. Three states:
 *   - **completed** (before current): Primary/600 circle + white check; title Body2/Medium.
 *   - **current**: outlined circle (white fill, 2px Primary/600 border) + Primary/600
 *     number; title Body2/Bold.
 *   - **upcoming**: Gray/300 circle + white number; title Body2/Medium, Gray/500.
 * The Primary/600 fill runs up to the current circle; everything right is gray.
 */
function Stepper({ step }: { step: number }) {
  const theme = useTheme();
  return (
    <View>
      <View style={styles.stepTitles}>
        {CHECKOUT_STEPS.map((label, i) => (
          <View key={label} style={styles.stepCell}>
            <Text
              style={[
                i === step ? styles.stepTitleCurrent : styles.stepTitle,
                { color: i > step ? theme.textSecondary : theme.text },
              ]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.stepTrack}>
        {/* Leading stub — always Primary (precedes the first/current step). Stub flex
            1 / connector flex 2 lands the circles under their titles (1/6, 1/2, 5/6). */}
        <StepLine active flex={1} />
        {CHECKOUT_STEPS.map((label, i) => (
          <Fragment key={label}>
            {i < step ? (
              <View style={[styles.stepCircle, { backgroundColor: theme.stepActive }]}>
                <Ionicons name="checkmark" size={13} color={theme.onPrimary} />
              </View>
            ) : i === step ? (
              <View
                style={[
                  styles.stepCircle,
                  styles.stepCircleCurrent,
                  { backgroundColor: theme.background, borderColor: theme.stepActive },
                ]}>
                <Text style={[styles.stepNum, { color: theme.stepActive }]}>{i + 1}</Text>
              </View>
            ) : (
              <View style={[styles.stepCircle, { backgroundColor: theme.stepTrack }]}>
                <Text style={[styles.stepNum, { color: theme.onPrimary }]}>{i + 1}</Text>
              </View>
            )}
            {i < CHECKOUT_STEPS.length - 1 ? <StepLine active={i < step} flex={2} /> : null}
          </Fragment>
        ))}
        {/* Trailing stub — never filled. */}
        <StepLine active={false} flex={1} />
      </View>
    </View>
  );
}

/**
 * The persistent checkout header: a custom back button + a "Checkout" title, then
 * the step indicator. It's rendered ONCE by the layout (outside the Stack), so it
 * stays put while the step screens slide beneath it — and the stepper animates as
 * the route changes.
 */
function CheckoutHeader() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const segments = useSegments();
  const step = stepForSegment(segments[segments.length - 1]);
  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top, backgroundColor: theme.background, borderBottomColor: theme.border },
      ]}>
      <View style={styles.headerBar}>
        {/* No back button on Confirmation — the order is placed. */}
        {step < 2 ? (
          <Pressable style={styles.backBtn} hitSlop={8} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </Pressable>
        ) : null}
        <Text style={[styles.headerTitle, { color: theme.text }]}>Checkout</Text>
      </View>
      <View style={styles.stepperPad}>
        <Stepper step={step} />
      </View>
    </View>
  );
}

export default function CheckoutLayout() {
  return (
    <CheckoutProvider>
      <View style={styles.container}>
        <CheckoutHeader />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="contact" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="confirmation" />
        </Stack>
      </View>
    </CheckoutProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth, // keep the app-wide nav-bar separator
    paddingBottom: 12,
  },
  headerBar: {
    height: 44,
    justifyContent: 'center', // title centered
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 8, // 16 optical inset once the chevron's own padding is counted
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  stepperPad: {
    paddingTop: 24, // 24 below the nav row (back button / title)
    paddingHorizontal: 16, // 16 leading / trailing for the titles + track
  },
  stepTitles: {
    flexDirection: 'row',
  },
  stepCell: {
    flex: 1, // three equal columns; title centered under its circle
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontFamily: FontFamily.bodyMedium, // completed + upcoming — Body 2 / Medium 14/20
    fontSize: 14,
    lineHeight: 20,
  },
  stepTitleCurrent: {
    fontFamily: FontFamily.bodyBold, // current step — Body 2 / Bold 14/20
    fontSize: 14,
    lineHeight: 20,
  },
  stepTrack: {
    marginTop: 10, // 10 below the titles
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepLine: {
    height: 3, // 3px connecting line (Gray/300 base); flex set per-line (stub 1 / connector 2)
    overflow: 'hidden',
  },
  stepLineFill: {
    position: 'absolute', // Primary/600 fill, width animated 0→100% from the left
    left: 0,
    top: 0,
    bottom: 0,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 4, // 4px between the circle and each line
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCurrent: {
    borderWidth: 2, // current step — outlined, no fill (border set inline: Primary/600)
  },
  stepNum: {
    fontFamily: FontFamily.bodyBold, // Caption / Bold 12 — step number in a circle.
    fontSize: 12,
    textAlign: 'center',
  },
});
