import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { getTier2 } from '@/api/catalog';
import type { CatalogItem } from '@/api/types';
import {
  CatalogCard,
  CATALOG_GRID_GAP,
  CATALOG_GRID_PADDING,
} from '@/components/catalog-card';
import { ScreenState } from '@/components/screen-state';
import { ThemedView } from '@/components/themed-view';
import { useAsync } from '@/hooks/use-async';

/**
 * tier2 — the sub-catalog for a tier1 category. Tapping a product opens its
 * product page (`/product/{id}`). An unknown id yields 404 TIER_NOT_FOUND,
 * which ScreenState renders as an error.
 */
export default function Tier2Screen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  const { data, error, loading, reload } = useAsync(
    (signal) => getTier2(id, 'prodigi', signal),
    [id],
  );

  const openProduct = useCallback(
    (item: CatalogItem) => {
      router.push({ pathname: '/product/[id]', params: { id: item.id } });
    },
    [router],
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: title ?? 'Products' }} />
      <ScreenState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!!data && data.length === 0}
        emptyMessage="No products in this category yet.">
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <CatalogCard item={item} onPress={() => openProduct(item)} />
          )}
          contentContainerStyle={styles.list}
        />
      </ScreenState>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: CATALOG_GRID_PADDING,
    rowGap: CATALOG_GRID_GAP,
  },
  row: {
    justifyContent: 'space-between',
  },
});
