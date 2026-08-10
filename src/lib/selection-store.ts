import { useSyncExternalStore } from 'react';

import type { Product, ProductVariant } from '@/api/types';

/**
 * The product the customer is currently building — captured on the PDP when they
 * pick a size and hit Select, then read by the builder (for labels + the print
 * spec) and used to seed cart items. A small local store (no provider) so the
 * full product details flow through cleanly instead of being squeezed into
 * route-param query strings.
 */
export type Selection = { product: Product; variant: ProductVariant };

let selection: Selection | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const selectionStore = {
  get: (): Selection | null => selection,
  set: (product: Product, variant: ProductVariant) => {
    selection = { product, variant };
    emit();
  },
  clear: () => {
    selection = null;
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

/** The current selection (product + chosen variant), or null. */
export function useSelection(): Selection | null {
  return useSyncExternalStore(selectionStore.subscribe, selectionStore.get, selectionStore.get);
}
