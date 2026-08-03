import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { getTier1 } from '@/api/catalog';
import type { CatalogItem } from '@/api/types';
import {
  CatalogCard,
  CATALOG_GRID_GAP,
  CATALOG_GRID_PADDING,
} from '@/components/catalog-card';
import { CategoryFilter } from '@/components/category-filter';
import { ScreenState } from '@/components/screen-state';
import { ThemedView } from '@/components/themed-view';
import { useAsync } from '@/hooks/use-async';

/** The "no filter" sentinel category id (from the API). */
const ALL = 'all';

/**
 * tier1 — the landing screen. Category chips + a grid of top-level products.
 * Categories come from the API; tapping a chip filters the grid client-side.
 * Tapping a product opens its sub-catalog (`/tier2/{id}`).
 */
export default function HomeScreen() {
  const router = useRouter();
  const [category, setCategory] = useState(ALL);
  const { data, error, loading, reload } = useAsync(
    (signal) => getTier1('prodigi', signal),
    [],
  );

  const openTier2 = useCallback(
    (item: CatalogItem) => {
      router.push({ pathname: '/tier2/[id]', params: { id: item.id, title: item.title } });
    },
    [router],
  );

  const categories = data?.categories ?? [];
  const items = data?.items ?? [];
  const visible =
    category === ALL ? items : items.filter((item) => item.categories.includes(category));

  return (
    <ThemedView style={styles.container}>
      <ScreenState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!!data && items.length === 0}
        emptyMessage="No products are available right now.">
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          // The category filter is the list header so it scrolls away with the grid.
          ListHeaderComponent={
            categories.length > 0 ? (
              <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
            ) : null
          }
          renderItem={({ item }) => (
            <CatalogCard item={item} onPress={() => openTier2(item)} />
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
    paddingBottom: CATALOG_GRID_PADDING,
    rowGap: CATALOG_GRID_GAP, // gap between the filter header and rows, and between rows
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: CATALOG_GRID_PADDING, // side gutters live on each grid row now
  },
});
