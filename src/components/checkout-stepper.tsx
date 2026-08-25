import { Ionicons } from '@expo/vector-icons';
import { Fragment, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CHECKOUT_STEPS } from '@/lib/checkout-context';

/**
 * The checkout step indicator (Contact · Payment · Confirmation). Rendered at the
 * top of each step screen's scroll content, so it scrolls with the page. Three
 * states per step:
 *   - **completed** (before current): Primary/600 circle + white check; title Body2/Medium.
 *   - **current**: outlined circle (white fill, 2px Primary/600 border) + Primary/600
 *     number; title Body2/Bold.
 *   - **upcoming**: Gray/300 circle + white number; title Body2/Medium, Gray/500.
 * The Primary/600 fill runs up to the current circle; everything to its right is gray.
 */

/** One 3px line — a leading/trailing stub (`flex` 1) or a connector between two
 *  circles (`flex` 2). Gray base with a Primary/600 fill that animates 0↔100%.
 *  `animateOnMount` starts the fill empty so it grows in when the page mounts — used
 *  for the connector leading into the current step, so it fills as you arrive. */
function StepLine({
  active,
  flex = 1,
  animateOnMount = false,
}: {
  active: boolean;
  flex?: number;
  animateOnMount?: boolean;
}) {
  const theme = useTheme();
  const fill = useRef(new Animated.Value(animateOnMount ? 0 : active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: active ? 1 : 0,
      duration: 280,
      // Wait out the page-slide transition so the fill is actually seen growing in,
      // not completed while the page is still sliding on.
      delay: animateOnMount ? 360 : 0,
      useNativeDriver: false, // animating width — not supported on the native driver
    }).start();
  }, [active, fill, animateOnMount]);
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
  return (
    <View style={styles.wrap}>
      <View style={styles.titles}>
        {CHECKOUT_STEPS.map((label, i) => (
          <View key={label} style={styles.cell}>
            <Text
              style={[
                i === step ? styles.titleCurrent : styles.title,
                { color: i > step ? theme.textSecondary : theme.text },
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
            {i < step ? (
              <View style={[styles.circle, { backgroundColor: theme.stepActive }]}>
                <Ionicons name="checkmark" size={13} color={theme.onPrimary} />
              </View>
            ) : i === step ? (
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
              // The connector leading INTO the current step fills in on mount.
              <StepLine active={i < step} flex={2} animateOnMount={i === step - 1} />
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
