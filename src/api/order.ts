import { apiRequest } from './client';
import type { CheckoutShipTo } from './checkout';
import { DEFAULT_FULFILLMENT } from './config';

/**
 * `POST /v1/orders` — place the Prodigi order AFTER payment. The API re-checks
 * that the PaymentIntent is paid and that the items match the paid-for basket, so
 * each order item's `sku`/`copies` must equal what `/v1/checkout` was given (the
 * basket signature is `sku:copies` per item, sorted — so send one line per cart
 * item to BOTH calls, not aggregated by SKU).
 */

export type OrderRecipient = {
  name: string;
  email: string;
  phone?: string;
  address: CheckoutShipTo;
};

export type OrderItem = {
  sku: string;
  copies: number;
  /** The `key` from POST /v1/uploads for this print's photo. */
  uploadKey: string;
  /** How the photo maps to the print rectangle; defaults to `fillPrintArea`. */
  sizing?: 'fillPrintArea' | 'fitPrintArea' | 'stretchToPrintArea';
  attributes?: Record<string, unknown>;
};

export type PlaceOrderRequest = {
  /** App's own id for this order — same key on a retry = same order (never double-charged). */
  idempotencyKey: string;
  paymentIntentId: string;
  shippingMethod?: 'Budget' | 'Standard' | 'Express' | 'Overnight';
  recipient: OrderRecipient;
  items: OrderItem[];
};

/** The order as the API shapes it (Prodigi lifecycle flattened onto our fields). */
export type PlacedOrder = {
  id: string | null;
  idempotencyKey: string | null;
  created: string | null;
  lastUpdated: string | null;
  shippingMethod: string | null;
  stage: string | null;
  progress: Record<string, string>;
  issues: unknown[];
  recipient: unknown;
  items: {
    id: string | null;
    sku: string | null;
    copies: number | null;
    status: string | null;
  }[];
  shipments: unknown[];
  charges: unknown[];
};

export type PlaceOrderResponse = {
  idempotencyKey: string;
  order: PlacedOrder;
};

/**
 * Place the order. This is the money-spending call (Prodigi bills our account),
 * so it runs only after the PaymentIntent is paid.
 */
export async function placeOrder(
  req: PlaceOrderRequest,
  signal?: AbortSignal,
): Promise<PlaceOrderResponse> {
  return apiRequest<PlaceOrderResponse>('/orders', {
    method: 'POST',
    body: { fulfillmentType: DEFAULT_FULFILLMENT, ...req },
    signal,
  });
}
