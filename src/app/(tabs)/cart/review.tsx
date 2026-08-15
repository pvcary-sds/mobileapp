import { PlaceholderScreen } from '@/components/placeholder-screen';

/**
 * Checkout step 1 — "Review order". Pushed from the cart's Checkout button.
 * Placeholder for now; the order summary, contact + shipping form (see
 * `src/lib/checkout-form.ts`), and payment go here next.
 */
export default function ReviewOrderScreen() {
  return (
    <PlaceholderScreen
      icon="receipt-outline"
      title="Review order"
      message="Your order summary, shipping details, and payment will go here."
    />
  );
}
