import { createCheckout, type CheckoutRequest } from '@/api/checkout';
import { Colors } from '@/constants/theme';
import { getStripePublishableKey, isStripeNativeAvailable } from '@/lib/stripe';

/**
 * Runs the checkout → Stripe PaymentSheet flow:
 *   1. `POST /v1/checkout` → PaymentIntent client secret.
 *   2. Present Stripe's PaymentSheet to collect + confirm the card.
 *
 * The Stripe SDK is **lazy-required** (never a top-level import) so a dev client
 * without the native module doesn't crash — the guard returns `unavailable` first.
 * Placing the Prodigi order (`/v1/orders`) is a separate step after this succeeds.
 */
export type PaymentOutcome =
  | { status: 'completed'; paymentIntentId: string; total: string }
  | { status: 'canceled' }
  | { status: 'unavailable' } // no Stripe-enabled build, or no publishable key
  | { status: 'error'; message: string };

export async function runCheckoutPayment(req: CheckoutRequest): Promise<PaymentOutcome> {
  if (!isStripeNativeAvailable() || !getStripePublishableKey()) {
    return { status: 'unavailable' };
  }

  // Safe now (guarded): the SDK loads its native module via getEnforcing at import.
  const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native') as {
    initPaymentSheet: (opts: Record<string, unknown>) => Promise<{ error?: { message: string } }>;
    presentPaymentSheet: () => Promise<{ error?: { code: string; message: string } }>;
  };

  let checkout;
  try {
    checkout = await createCheckout(req);
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Checkout failed.' };
  }
  const { clientSecret, paymentIntentId } = checkout.checkout.payment;

  const init = await initPaymentSheet({
    merchantDisplayName: 'SameDaySnaps',
    paymentIntentClientSecret: clientSecret,
    returnURL: 'mobileapp://stripe-redirect', // for 3DS / bank redirects
    defaultBillingDetails: req.email ? { email: req.email } : undefined,
    // Brand the sheet to match the app: 8px radius on fields/options, Gray/200
    // borders, and a Primary/500 + white Pay button. (Stripe's appearance API has
    // no button-height setting; it uses a fixed ~48 height, which we want anyway.)
    appearance: {
      colors: {
        componentBorder: Colors.border, // Gray/200 — field / option borders
        componentDivider: Colors.border, // Gray/200
      },
      shapes: {
        borderRadius: 8, // 8px across the fields / options
      },
      primaryButton: {
        colors: { background: Colors.primary, text: Colors.onPrimary },
        shapes: { borderRadius: 8 },
      },
    },
  });
  if (init.error) return { status: 'error', message: init.error.message };

  const present = await presentPaymentSheet();
  if (present.error) {
    return present.error.code === 'Canceled'
      ? { status: 'canceled' }
      : { status: 'error', message: present.error.message };
  }

  return { status: 'completed', paymentIntentId, total: checkout.checkout.total };
}
