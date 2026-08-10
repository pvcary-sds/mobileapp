import { StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCartItems } from '@/lib/cart-store';

/**
 * Cart tab — the built prints waiting for checkout. Backed by the local cart
 * store (see `cart-store.ts`); no API until checkout.
 */
export default function CartScreen() {
  const theme = useTheme();
  const items = useCartItems();
  const count = items.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* "Your products: N items" — Title 1 / SemiBold 24/32, 24 below the nav bar. */}
      <Text style={[styles.header, { color: theme.text }]}>
        Your products: {count} {count === 1 ? 'item' : 'items'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 24, // 24 below the nav bar
    marginHorizontal: 16, // standard content inset
    fontFamily: FontFamily.bodySemiBold, // Title 1 / SemiBold
    fontSize: 24,
    lineHeight: 32,
  },
});
