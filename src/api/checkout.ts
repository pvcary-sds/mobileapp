import { apiRequest } from './client';
import { DEFAULT_FULFILLMENT } from './config';

/**
 * `POST /v1/checkout` — prices the basket (retail + shipping + tax, minus any
 * coupon) and returns a Stripe PaymentIntent to confirm. This is what the customer
 * actually pays; the order is placed separately at `/v1/orders` after payment.
 */

export type CheckoutShipTo = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  countryCode: string; // 'US' only, today
};

export type CheckoutItem = { sku: string; copies: number };

export type CheckoutRequest = {
  idempotencyKey: string;
  shippingMethod?: 'Budget' | 'Standard' | 'Express' | 'Overnight';
  shipTo: CheckoutShipTo;
  items: CheckoutItem[];
  email?: string;
  couponCode?: string;
};

export type CheckoutResponse = {
  idempotencyKey: string;
  checkout: {
    currency: string;
    items: {
      sku: string;
      productId: string;
      size: string;
      copies: number;
      unitPrice: string;
      linePrice: string;
    }[];
    subtotal: string;
    discount?: { code: string; amount: string; freeShipping: boolean };
    shipping: string;
    tax: string;
    total: string;
    taxCalculationId: string | null;
    payment: { paymentIntentId: string; clientSecret: string };
  };
};

/** Price the basket + create the PaymentIntent. */
export async function createCheckout(
  req: CheckoutRequest,
  signal?: AbortSignal,
): Promise<CheckoutResponse> {
  return apiRequest<CheckoutResponse>('/checkout', {
    method: 'POST',
    body: { fulfillmentType: DEFAULT_FULFILLMENT, ...req },
    signal,
  });
}
