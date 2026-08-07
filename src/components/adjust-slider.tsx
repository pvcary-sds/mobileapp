import { useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// Value range; 0 is dead center. (Maps to the color-matrix math later.)
const MIN = -100;
const MAX = 100;
const THUMB = 20;
const TRACK_H = 6;

/**
 * Center-origin adjustment slider: 0 sits dead center, and the fill from the
 * center to the thumb is Primary/500 — so plus/minus reads at a glance. Custom
 * because the native slider only fills from the left edge, not the center, and
 * can't hit the 6px track / 20px thumb spec.
 */
export function AdjustSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  // Refs so the PanResponder (created once) always reads the latest values.
  const widthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return;
    const clamped = Math.max(0, Math.min(w, x));
    onChangeRef.current(Math.round(MIN + (clamped / w) * (MAX - MIN)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  };

  const ratio = width > 0 ? (value - MIN) / (MAX - MIN) : 0.5;
  const thumbX = ratio * width;
  const centerX = width / 2;
  const fillLeft = Math.min(centerX, thumbX); // fill spans center → thumb
  const fillWidth = Math.abs(thumbX - centerX);

  return (
    <View style={styles.container} onLayout={onLayout} {...pan.panHandlers}>
      {/* Track (Gray/200) */}
      <View style={[styles.track, { backgroundColor: theme.border }]} />
      {/* Fill from center to the thumb (Primary/500) */}
      <View style={[styles.fill, { backgroundColor: theme.primary, left: fillLeft, width: fillWidth }]} />
      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          { left: thumbX - THUMB / 2, backgroundColor: theme.background, borderColor: theme.border },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMB, // 20 — the touch area, tall enough for the thumb
    justifyContent: 'center',
  },
  track: {
    height: TRACK_H, // 6, horizontally centered, full width
    borderRadius: TRACK_H / 2,
  },
  fill: {
    position: 'absolute',
    top: (THUMB - TRACK_H) / 2, // centered on the track
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 1,
    // subtle lift
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
