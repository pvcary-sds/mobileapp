import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * A segmented control styled to match the native iOS `UISegmentedControl`
 * (rounded gray track, white thumb on the selected segment). This is a JS
 * lookalike — the real native module (`@react-native-segmented-control`) would
 * need a dev-client rebuild; swap to it later if the platform feel matters.
 */
export function SegmentedControl({
  segments,
  value,
  onChange,
}: {
  segments: string[];
  value: number;
  onChange: (index: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      {segments.map((seg, i) => {
        const selected = i === value;
        return (
          <Pressable
            key={seg}
            onPress={() => onChange(i)}
            style={[
              styles.segment,
              selected && [styles.segmentSelected, { backgroundColor: theme.background }],
            ]}>
            <Text
              style={[
                styles.label,
                selected ? styles.labelSelected : styles.labelIdle,
                { color: theme.text },
              ]}>
              {seg}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 9,
    padding: 2,
  },
  segment: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
    paddingHorizontal: 20,
  },
  segmentSelected: {
    // White thumb with the subtle iOS lift.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  labelIdle: {
    fontFamily: FontFamily.body,
  },
  labelSelected: {
    fontFamily: FontFamily.bodySemiBold,
  },
});
