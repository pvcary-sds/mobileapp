import { StyleSheet } from 'react-native';
import { Circle, Defs, Pattern, Rect, Svg } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

// A regular dot grid: Gray/200 dots on a Gray/100 field, ~19px apart. Rendered
// as a tiling SVG <Pattern> (a few nodes) rather than the ~270KB export of every
// individual dot — same look, far cheaper.
const GAP = 19.2;
const DOT_RADIUS = 1.7;

/**
 * Full-bleed canvas background for the photo builder. Fills its parent (top to
 * bottom, edge to edge).
 */
export function PhotoCanvasBackground() {
  const theme = useTheme();
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id="dot-grid" width={GAP} height={GAP} patternUnits="userSpaceOnUse">
          <Circle cx={GAP / 2} cy={GAP / 2} r={DOT_RADIUS} fill={theme.border} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={theme.backgroundElement} />
      <Rect width="100%" height="100%" fill="url(#dot-grid)" />
    </Svg>
  );
}
