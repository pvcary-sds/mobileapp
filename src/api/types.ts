/**
 * Response types for the SDS API (see the API's API.md).
 *
 * Every response carries a `status`. Success payloads are typed below; errors
 * always look like `{ status: 'error', error: { code, message } }`.
 */

export type ApiSuccess<T> = { status: 'success' } & T;
export type ApiErrorBody = {
  status: 'error';
  error: { code: string; message: string };
};

/** A catalog card in tier1 / tier2 (`shipToYou` items). */
export interface CatalogItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  imageUrl: string;
  imageUrlWide: string;
  /** Category ids this item appears under (empty = only under "All"). */
  categories: string[];
  /**
   * CMS-authored display price range for a tier2 category card, e.g.
   * "$45 – $315". Empty / absent when not set (the card shows a placeholder).
   */
  priceRange?: string;
}

/** A filter chip above the tier1 grid. `id` is stable; `label` is display text. */
export interface Category {
  id: string;
  label: string;
  iconUrl: string;
}

/** tier1 / tier2 both return the picked channel's array (here: `shipToYou`). */
export interface CatalogResponse {
  /** Filter chips — present on tier1. */
  categories?: Category[];
  shipToYou?: CatalogItem[];
  sameDayPickup?: CatalogItem[];
}

/** One size of a product line. `sku` drives the fulfilment endpoints. */
export interface ProductVariant {
  sku: string;
  size: string;
  price: string; // decimal string, USD, no symbol e.g. "60.00"
  orientation: string; // "Square" | "Portrait / landscape"
}

/** The full product page (`GET /v1/products/{id}`). */
export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string; // HTML string
  images: { filename: string; alt: string }[];
  skuPrefix: string;
  features: string[];
  materials: string[];
  packaging: string[];
  variants: ProductVariant[];
}

export interface ProductResponse {
  product: Product;
}

/** Required pixel canvas + computed DPI for one size. */
export interface PrintAreaSize {
  horizontalResolution: number;
  verticalResolution: number;
  horizontalDpi: number | null;
  verticalDpi: number | null;
}

export interface PrintAreaSizesResponse {
  sku: string;
  widthIn: number | null;
  heightIn: number | null;
  printAreaSizes: Record<string, PrintAreaSize>;
}
