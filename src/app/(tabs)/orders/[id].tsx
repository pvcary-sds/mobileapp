import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocalSearchParams } from 'expo-router';

import { getOrder, type PlacedOrder } from '@/api/order';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatUSD } from '@/lib/checkout-context';
import { orderHistory } from '@/lib/order-history';

/** The five Prodigi lifecycle steps, in order, with customer-friendly labels. */
const PROGRESS_STEPS: [key: string, label: string][] = [
  ['downloadAssets', 'Photos received'],
  ['printReadyAssetsPrepared', 'Prepared for print'],
  ['allocateProductionLocation', 'Assigned to a lab'],
  ['inProduction', 'In production'],
  ['shipping', 'Shipped'],
];

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

/** Order detail / tracking — live status from `GET /v1/orders/:id`, plus the
 *  retail total + friendly item names from the device-local history. */
export default function OrderDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const stored = id ? orderHistory.get(id) : null;

  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setState('loading');
    getOrder(id, controller.signal)
      .then((res) => {
        setOrder(res.order);
        setState('ready');
      })
      .catch((e) => {
        if (!controller.signal.aborted) setState(e?.name === 'AbortError' ? 'loading' : 'error');
      });
    return () => controller.abort();
  }, [id]);

  if (state === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  if (state === 'error' || !order) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          We couldn’t load this order right now. Pull to retry, or check back shortly.
        </Text>
      </View>
    );
  }

  const shipment = order.shipments?.[0] ?? null;
  const tracking = shipment?.tracking ?? null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Header */}
        <Text style={[styles.orderId, { color: theme.text }]}>{order.id}</Text>
        <Text style={[styles.placed, { color: theme.textSecondary }]}>
          Placed {formatDate(order.created)}
          {stored?.total ? ` · ${formatUSD(Number(stored.total))}` : ''}
        </Text>

        {/* Status — the 5-step progress checklist. */}
        <Section title="Status">
          {PROGRESS_STEPS.map(([key, label]) => {
            const done = order.progress?.[key] === 'Complete';
            return (
              <View key={key} style={styles.step}>
                <Ionicons
                  name={done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={done ? theme.primary : theme.borderStrong}
                />
                <Text
                  style={[styles.stepLabel, { color: done ? theme.text : theme.textSecondary }]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </Section>

        {/* Shipment / tracking — only once a shipment exists. */}
        {shipment ? (
          <Section title="Shipment">
            {shipment.dispatchDate ? (
              <Text style={[styles.line, { color: theme.text }]}>
                Dispatched {formatDate(shipment.dispatchDate)}
              </Text>
            ) : null}
            {shipment.carrier?.name ? (
              <Text style={[styles.line, { color: theme.text }]}>
                {shipment.carrier.name}
                {shipment.carrier.service ? ` · ${shipment.carrier.service}` : ''}
              </Text>
            ) : null}
            {tracking?.url ? (
              <Pressable onPress={() => Linking.openURL(tracking.url!)}>
                <Text style={[styles.line, styles.link, { color: theme.primary }]}>
                  Track shipment{tracking.number ? ` (${tracking.number})` : ''}
                </Text>
              </Pressable>
            ) : tracking?.number ? (
              <Text style={[styles.line, { color: theme.text }]}>Tracking {tracking.number}</Text>
            ) : null}
          </Section>
        ) : null}

        {/* Items — thumbnails from the live order, names from local history. */}
        <Section title="Items">
          {order.items.map((it, i) => (
            <View key={it.id ?? i} style={styles.item}>
              {it.thumbnailUrl ? (
                <Image
                  source={{ uri: it.thumbnailUrl }}
                  style={[styles.thumb, { backgroundColor: theme.backgroundElement }]}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.thumb, { backgroundColor: theme.backgroundElement }]} />
              )}
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  {stored?.items[i]?.title ?? it.sku}
                </Text>
                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {stored?.items[i]?.size ? `${stored.items[i].size} · ` : ''}Qty {it.copies ?? 1}
                </Text>
              </View>
              {it.status ? (
                <Text style={[styles.itemStatus, { color: theme.textSecondary }]}>{it.status}</Text>
              ) : null}
            </View>
          ))}
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: {
    textAlign: 'center',
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  content: {
    padding: 16,
  },
  orderId: {
    fontFamily: FontFamily.bodySemiBold, // Body 1 / SemiBold
    fontSize: 20,
    lineHeight: 28,
  },
  placed: {
    marginTop: 2,
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.title, // Title / SemiBold (Crimson)
    fontSize: 20,
    lineHeight: 28,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepLabel: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  line: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  link: {
    textDecorationLine: 'underline',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  itemMeta: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  itemStatus: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
