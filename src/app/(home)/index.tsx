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

// Static for now; will become API-driven.
const CATEGORIES = ['All', 'Framed', 'Deals', 'Holiday'];

/**
 * tier1 — the landing screen. Top-level categories (Prints, Wall art, …).
 * Tapping one opens its sub-catalog (`/tier2/{id}`).
 */
export default function HomeScreen() {
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]);
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

  return (
    <ThemedView style={styles.container}>
      <ScreenState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!!data && data.length === 0}
        emptyMessage="No categories are available right now.">
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          // The category filter is the list header so it scrolls away with the grid.
          ListHeaderComponent={
            <CategoryFilter categories={CATEGORIES} selected={category} onSelect={setCategory} />
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
