import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { EMPTY_CART_ILLUSTRATION } from '@/constants/illustrations';
import { BottomTabInset, FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCartItems } from '@/lib/cart-store';

/** "Start shopping" button glyph (from Figma) — white stroke, on the primary fill. */
const START_SHOPPING_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 6.0534V20.3025M5 8.25467C6.26578 8.4507 7.67778 8.7766 9 9.28791M5 12.2547C5.63949 12.3537 6.3163 12.4859 7 12.6584M3.99433 3.0113C6.21271 3.26198 9.19313 3.93635 11.3168 5.42448C11.725 5.71048 12.275 5.71048 12.6832 5.42448C14.8069 3.93635 17.7873 3.26198 20.0057 3.0113C21.1036 2.88724 22 3.80405 22 4.93521V16.2C22 17.3311 21.1036 18.2483 20.0057 18.3724C17.7873 18.623 14.8069 19.2974 12.6832 20.7855C12.275 21.0715 11.725 21.0715 11.3168 20.7855C9.19313 19.2974 6.21271 18.623 3.99433 18.3724C2.89642 18.2483 2 17.3311 2 16.2V4.93521C2 3.80405 2.89642 2.88724 3.99433 3.0113Z" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

/** Format a USD amount from a decimal string, e.g. "75" → "$75.00". */
function formatUSD(price: string): string {
  const n = Number(price) || 0;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Cart tab — the built prints waiting for checkout. Backed by the local cart
 * store (see `cart-store.ts`); no API until checkout.
 */
export default function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const items = useCartItems();
  const count = items.length;
  // On a tab screen the bottom inset already spans the floating tab bar, so the
  // CTA sits 24 above it.
  const aboveTabBar = insets.bottom + 24;

  // Empty state: illustration + message centered between the nav bar and tab bar,
  // with a "Start shopping" CTA pinned above the tab bar.
  if (count === 0) {
    return (
      <View style={[styles.container, styles.empty, { backgroundColor: theme.background }]}>
        <SvgXml xml={EMPTY_CART_ILLUSTRATION} width={136} height={136} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Your shopping cart is empty
        </Text>
        <Pressable
          onPress={() => router.navigate('/')}
          style={[styles.startButton, { backgroundColor: theme.primary, bottom: aboveTabBar }]}>
          <SvgXml xml={START_SHOPPING_ICON} width={24} height={24} />
          <Text style={[styles.startLabel, { color: theme.onPrimary }]}>Start shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* "Your products: N items" — Title 1 / SemiBold 24/32, 24 below the nav bar. */}
      <Text style={[styles.header, { color: theme.text }]}>
        Your products: {count} {count === 1 ? 'item' : 'items'}
      </Text>

      {/* The cart rows — 20 below the header, 16 leading/trailing. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Image
              source={{ uri: item.photo.uri }}
              style={[styles.rowImage, { backgroundColor: theme.backgroundElement }]}
              contentFit="cover"
            />
            <View style={styles.rowInfo}>
              {/* Title (left) + price (right) — one line, spacer between. */}
              <View style={styles.rowTitleLine}>
                <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.rowPrice, { color: theme.text }]}>{formatUSD(item.price)}</Text>
              </View>
              {/* More product details to come. */}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: BottomTabInset, // discount the tab-bar area so it centers in the visible space
  },
  emptyText: {
    marginTop: 12, // 12 below the illustration
    fontFamily: FontFamily.bodyMedium, // Body / Medium 16/24, Gray/500
    fontSize: 16,
    lineHeight: 24,
  },
  startButton: {
    position: 'absolute',
    left: 16, // 16 leading / trailing
    right: 16,
    // bottom (24 above the floating tab bar) is applied inline from safe-area insets
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLabel: {
    marginLeft: 8, // 8 to the right of the icon
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  header: {
    marginTop: 24, // 24 below the nav bar
    marginHorizontal: 16, // standard content inset
    fontFamily: FontFamily.bodySemiBold, // Title 1 / SemiBold
    fontSize: 24,
    lineHeight: 32,
  },
  list: {
    paddingTop: 20, // 20 below the header
    paddingHorizontal: 16, // 16 leading / trailing
    gap: 16, // between rows (placeholder — refine when the row spec fills in)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start', // details top-align with the image; more lines stack below
  },
  rowImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  rowInfo: {
    flex: 1,
    marginLeft: 16, // 16 to the right of the image
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    flex: 1, // takes the space; price sits at the far right (the spacer)
    marginRight: 8,
    fontFamily: FontFamily.bodySemiBold, // Body / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  rowPrice: {
    fontFamily: FontFamily.bodySemiBold, // Body / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
});
