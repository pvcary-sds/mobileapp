import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatUSD } from '@/lib/checkout-context';
import { useOrderHistory, useOrderHistoryHydrated, type StoredOrder } from '@/lib/order-history';

/** ISO → "Aug 27, 2026". */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** One order card in the list. */
function OrderCard({ order }: { order: StoredOrder }) {
  const theme = useTheme();
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Pressable
      style={[styles.card, { borderColor: theme.border }]}
      onPress={() => router.push(`/orders/${order.orderId}`)}>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.date, { color: theme.text }]}>{formatDate(order.created)}</Text>
          <Text style={[styles.total, { color: theme.text }]}>
            {order.total ? formatUSD(Number(order.total)) : ''}
          </Text>
        </View>
        <Text style={[styles.summary, { color: theme.textSecondary }]}>
          {count} {count === 1 ? 'print' : 'prints'}
        </Text>
        <Text style={[styles.orderId, { color: theme.textMuted }]}>{order.orderId}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
    </Pressable>
  );
}

/** Orders tab — the device's order history (newest first). */
export default function OrdersListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const orders = useOrderHistory();
  const hydrated = useOrderHistoryHydrated();

  // Before the first read completes we don't know if it's empty — render nothing to
  // avoid a flash of the empty state.
  if (!hydrated) return <View style={[styles.container, { backgroundColor: theme.background }]} />;

  if (orders.length === 0) {
    return (
      <PlaceholderScreen
        icon="receipt-outline"
        title="No orders yet"
        message="Once you place an order, you can track it here."
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.orderId}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12, // 12 between cards
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold 16/24
    fontSize: 16,
    lineHeight: 24,
  },
  total: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  summary: {
    fontFamily: FontFamily.body, // Body 2 / Regular 14/20
    fontSize: 14,
    lineHeight: 20,
  },
  orderId: {
    fontFamily: FontFamily.body, // Caption 12/16
    fontSize: 12,
    lineHeight: 16,
  },
});
