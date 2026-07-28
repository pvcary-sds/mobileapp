import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import type { ApiError } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  loading: boolean;
  error: ApiError | null;
  onRetry?: () => void;
  /** Optional message when there's no error but nothing to show. */
  emptyMessage?: string;
  isEmpty?: boolean;
  children?: React.ReactNode;
};

/**
 * Renders a centered spinner while loading, a friendly error with a Retry
 * button on failure (Retry shown only for retryable faults), an empty note,
 * or the children once data is ready.
 */
export function ScreenState({ loading, error, onRetry, emptyMessage, isEmpty, children }: Props) {
  const theme = useTheme();

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.textSecondary} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="subtitle" style={styles.centerText}>
          Something went wrong
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          {error.message}
        </ThemedText>
        {onRetry && (error.retryable || error.code === 'NETWORK_ERROR') && (
          <Pressable
            onPress={onRetry}
            style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">Try again</ThemedText>
          </Pressable>
        )}
      </ThemedView>
    );
  }

  if (isEmpty) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          {emptyMessage ?? 'Nothing here yet.'}
        </ThemedText>
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
});
