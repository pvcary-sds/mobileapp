import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { getTier1 } from '@/api/catalog';
import type { CatalogItem } from '@/api/types';
import { CatalogCard } from '@/components/catalog-card';
import { ScreenState } from '@/components/screen-state';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';

/**
 * tier1 — the landing screen. Top-level categories (Prints, Wall art, …).
 * Tapping one opens its sub-catalog (`/tier2/{id}`).
 */
export default function HomeScreen() {
  const router = useRouter();
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
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
