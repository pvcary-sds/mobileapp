import { Linking, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { PACKAGE_ICON } from '@/constants/builder-icons';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Opens the carrier's tracking page. 48 tall, white fill, 2px Gray/200 border,
 * parcel icon + label in Body 1 / SemiBold 16/24.
 *
 * Callers render it only once the shipment actually has a URL — Prodigi creates no
 * shipment, and so no tracking, until an order is dispatched, and a button that
 * silently does nothing is worse than no button.
 *
 * Pass `style` for spacing: it sits 12 below the address on the Orders list card and
 * 16 below it on the order detail screen.
 */
export function TrackShippingButton({
  url,
  style,
}: {
  url: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="button"
      style={[styles.button, { backgroundColor: theme.background, borderColor: theme.border }, style]}>
      <SvgXml xml={PACKAGE_ICON} width={24} height={24} color={theme.text} />
      <Text style={[styles.label, { color: theme.text }]}>Track shipping</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // 8 from the icon to the label
    borderRadius: 8,
    borderWidth: 2, // Gray/200
  },
  label: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
});
