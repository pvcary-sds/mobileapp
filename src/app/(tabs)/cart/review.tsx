import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Checkout step 1 — "Review order". Pushed from the cart's Checkout button.
 * Being built section by section: contact details, shipping, order summary, and
 * payment (form validation lives in `src/lib/checkout-form.ts`).
 */
export default function ReviewOrderScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* "Contact details" — Title 1 / SemiBold 24/32, 24 below the nav bar. */}
        <Text style={[styles.header, { color: theme.text }]}>Contact details</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 24, // 24 from the top (below the nav bar)
    paddingHorizontal: 16, // 16 leading / trailing (app convention)
  },
  header: {
    fontFamily: FontFamily.title, // Title 1 / SemiBold (Crimson Text) 24/32
    fontSize: 24,
    lineHeight: 32,
  },
});
