import { Ionicons } from '@expo/vector-icons';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useNavigation } from 'expo-router';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CHECKOUT_STEPS } from '@/lib/checkout-context';

/**
 * The checkout step indicator (Contact · Payment · Confirmation), at the top of
 * each step screen's scroll content. On arriving at a step, the connector leading
 * into it grows in (once the page has slid on), and only when that fill FINISHES
 * do the circle + title advance — so the line reaches the next circle, then it
 * lights up. Three states per step:
 *   - **completed**: Primary/600 circle + white check; title Body2/Medium.
 *   - **current**: outlined circle (white fill, 2px Primary/600 border) + Primary/600
 *     number; title Body2/Bold.
 *   - **upcoming**: Gray/300 circle + white number; title Body2/Medium, Gray/500.
 */

/** One 3px line — a leading/trailing stub (`flex` 1) or a connector between two
 *  circles (`flex` 2). Gray base with a Primary/600 fill that animates 0↔100%.
 *  `animateOnMount` starts it empty (held until `play`) and calls `onFilled` when the
 *  grow-in completes. */
function StepLine({
  active,
  flex = 1,
  animateOnMount = false,
  play = true,
  onFilled,
}: {
  active: boolean;
  flex?: number;
  animateOnMount?: boolean;
  play?: boolean;
  onFilled?: () => void;
}) {
  const theme = useTheme();
  const fill = useRef(new Animated.Value(animateOnMount ? 0 : active ? 1 : 0)).current;
  useEffect(() => {
    if (animateOnMount && !play) return; // wait for the page to settle
    Animated.timing(fill, {
      toValue: active ? 1 : 0,
      duration: 280,
      useNativeDriver: false, // animating width — not supported on the native driver
    }).start(({ finished }) => {
      if (finished && animateOnMount) onFilled?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, fill, animateOnMount, play]);
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

export function CheckoutStepper({ step }: { step: number }) {
  const theme = useTheme();
  const navigation = useNavigation();
  // Play the incoming connector's fill once the page has slid in.
  const [settled, setSettled] = useState(false);
  // Circles/titles reflect `shownStep`, which starts one behind and advances to
  // `step` only after the connector fill finishes.
  const [shownStep, setShownStep] = useState(step > 0 ? step - 1 : step);

  useEffect(() => {
    // `transitionEnd` is a native-stack event, not in the generic navigation type.
    const nav = navigation as unknown as {
      addListener: (e: string, cb: (ev: { data?: { closing?: boolean } }) => void) => () => void;
    };
    const sub = nav.addListener('transitionEnd', (e) => {
      if (!e?.data?.closing) setSettled(true);
    });
    const fallback = setTimeout(() => setSettled(true), 600);
    return () => {
      sub();
      clearTimeout(fallback);
    };
  }, [navigation]);

  return (
    <View style={styles.wrap}>
      <View style={styles.titles}>
        {CHECKOUT_STEPS.map((label, i) => (
          <View key={label} style={styles.cell}>
            <Text
              style={[
                i === shownStep ? styles.titleCurrent : styles.title,
                { color: i > shownStep ? theme.textSecondary : theme.text },
              ]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.track}>
        {/* Leading stub — always Primary (precedes the first/current step). Stub flex
            1 / connector flex 2 lands the circles under their titles (1/6, 1/2, 5/6). */}
        <StepLine active flex={1} />
        {CHECKOUT_STEPS.map((label, i) => (
          <Fragment key={label}>
            {i < shownStep ? (
              <View style={[styles.circle, { backgroundColor: theme.stepActive }]}>
                <Ionicons name="checkmark" size={13} color={theme.onPrimary} />
              </View>
            ) : i === shownStep ? (
              <View
                style={[
                  styles.circle,
                  styles.circleCurrent,
                  { backgroundColor: theme.background, borderColor: theme.stepActive },
                ]}>
                <Text style={[styles.num, { color: theme.stepActive }]}>{i + 1}</Text>
              </View>
            ) : (
              <View style={[styles.circle, { backgroundColor: theme.stepTrack }]}>
                <Text style={[styles.num, { color: theme.onPrimary }]}>{i + 1}</Text>
              </View>
            )}
            {i < CHECKOUT_STEPS.length - 1 ? (
              i === step - 1 ? (
                // The connector INTO the current step: fill it in, then advance the
                // circles/titles (setShownStep) so they change right after the animation.
                <StepLine
                  active
                  flex={2}
                  animateOnMount
                  play={settled}
                  onFilled={() => setShownStep(step)}
                />
              ) : (
                <StepLine active={i < shownStep} flex={2} />
              )
            ) : null}
          </Fragment>
        ))}
        {/* Trailing stub — never filled. */}
        <StepLine active={false} flex={1} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch', // full width even inside a centered content container
    marginBottom: 24, // 24 gap to the content below
  },
  titles: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1, // three equal columns; title centered under its circle
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.bodyMedium, // completed + upcoming — Body 2 / Medium 14/20
    fontSize: 14,
    lineHeight: 20,
  },
  titleCurrent: {
    fontFamily: FontFamily.bodyBold, // current step — Body 2 / Bold 14/20
    fontSize: 14,
    lineHeight: 20,
  },
  track: {
    marginTop: 10, // 10 below the titles
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepLine: {
    height: 3, // 3px line (Gray/300 base); flex set per-line (stub 1 / connector 2)
    overflow: 'hidden',
  },
  stepLineFill: {
    position: 'absolute', // Primary/600 fill, width animated 0→100% from the left
    left: 0,
    top: 0,
    bottom: 0,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 4, // 4px between the circle and each line
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCurrent: {
    borderWidth: 2, // current step — outlined, no fill (border set inline: Primary/600)
  },
  num: {
    fontFamily: FontFamily.bodyBold, // Caption / Bold 12 — step number in a circle.
    fontSize: 12,
    textAlign: 'center',
  },
});
