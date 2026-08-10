import { useSyncExternalStore } from 'react';

/**
 * The cart is **local** (client-side) state, not a server resource: a cart item
 * is the customer's local photo (`file://` URI) + its builder edits, none of
 * which exists server-side until checkout (upload → Stripe → Prodigi order). So
 * a tiny external store (no provider needed) backs the Cart screen; components
 * read it with `useCartItems()`.
 */

/** A picked photo plus all its builder edits (crop, filter, adjust, rotation). */
export type PhotoEdit = {
  uri: string;
  width?: number;
  height?: number;
  rotated: boolean;
  fillMode: 'fit' | 'fill';
  filter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

/** One print in the cart: a product/size + the photo (with its edits) to print. */
export type CartItem = {
  id: string;
  sku: string;
  title: string; // product name, e.g. "Acrylic Prints"
  size: string; // e.g. "8x10 in"
  price: string; // unit price, USD decimal string e.g. "75.00"
  quantity: number; // copies of this print (the row's stepper), min 1
  photo: PhotoEdit;
};

let items: CartItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const cartStore = {
  getItems: (): CartItem[] => items,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** Add one print per photo — the builder's "Add N to Cart" (photos = quantity). */
  addPrints(product: Omit<CartItem, 'id' | 'quantity' | 'photo'>, photos: PhotoEdit[]) {
    const added = photos.map((photo) => ({ ...product, id: `c${++seq}`, quantity: 1, photo }));
    items = [...items, ...added];
    emit();
  },
  /** Set a row's copy count (floored at 1). */
  setQuantity(id: string, quantity: number) {
    items = items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i));
    emit();
  },
  remove(id: string) {
    items = items.filter((i) => i.id !== id);
    emit();
  },
  clear() {
    items = [];
    emit();
  },
};

/** Subscribe to the cart's items; re-renders the caller when they change. */
export function useCartItems(): CartItem[] {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getItems, cartStore.getItems);
}
