# Photo & Print Flow

How a customer goes from browsing to a print-ready photo, and the mechanics
behind it. Written for both product and engineering. Companion to
[`DEVELOPMENT.md`](../DEVELOPMENT.md); API endpoints are specified in the API
repo's `API.md`.

---

## The journey

```
Browse (tier1) → category (tier2) → product page (PDP)
      → choose a size → Select
      → native photo picker (multi-select) → pick photos
      → Customize (builder): previews, quality check, swap photos
      → [add to cart / checkout — future]
```

1. **Browse.** tier1 landing → tap a category → tier2 sub-catalog → tap a product → **PDP**.
2. **PDP.** Pick a **size** (a `variant`, each carrying a Prodigi `sku`). There's **no quantity** here — see below.
3. **Select.** Opens the **native photo picker** (iOS PHPicker / Android photo picker) as **multi-select**.
4. **Pick photos.** Only then does the **builder** ("Customize") open.
5. **Builder.** Shows the photos, runs the **print-quality check** on each, and lets the customer swap them. Add-to-cart / checkout is the next slice.

### Two rules that shape the flow

- **The picker runs on the PDP**, not the builder.
- **The builder only exists once a photo is chosen.** Dismissing the picker
  leaves the customer on the PDP — never a blank builder.

---

## Print-quality (blurriness) check

The point: warn the customer when their photo is too low-resolution for the
print size they picked.

- **Data source:** `GET /v1/print-area-sizes/{sku}?fulfillmentType=prodigi`.
  Returns the physical size (`widthIn` / `heightIn`, inches) and, per print area
  (`default` for these products), the **recommended DPI** (`horizontalDpi` /
  `verticalDpi`). Everything else in Prodigi's payload is dropped server-side,
  and the Prodigi API key never reaches the client.
- **The rule (client-side, advisory):** the photo's DPI at this size is
  `photoPx ÷ inches` per axis. If **either** axis comes in **below** the
  recommended DPI, warn that the print may look blurry. The API only reports the
  numbers — it never blocks the order; the warning is the client's call.
- **Where it runs:** in the **builder**, via `useAsync` — *not* gated on the
  PDP. The photo shows immediately; quality shows **"Checking print quality…"**
  then the result. Because the check is advisory, a slow or failed Prodigi call
  shows a **Retry** (non-blocking) instead of stranding the customer or throwing
  away the photo they just picked.

---

## How many photos — photos = quantity

The picker is **always unlimited multi-select** (`allowsMultipleSelection: true`,
`selectionLimit: 0`). The customer picks as many photos as they want and confirms
with the picker's **Add / ✓** — it never auto-dismisses. **The number of photos
picked is the number of prints**, so there's no quantity control on the PDP
(quantity lives in the **cart**).

Why this model:
- It's the low-friction, industry-standard photo-commerce flow ("pick your
  photos, each becomes a print") — no premature "how many?" decision.
- One consistent picker for every product (one wall-art piece *or* a batch of
  Prints — same gesture), and a consistent ✓ confirm.
- iOS can't show a ✓ confirm for a *1-photo* limit (a `selectionLimit` of 1 is
  single-select / auto-dismiss); unlimited selection sidesteps that entirely.

> **Future — "copies of one photo".** Ordering N copies of the *same* photo
> (e.g. wallet prints) is a different shape: pick **1** photo + a **copies**
> control in the builder. If/when a product needs it, that'd be a per-product
> flag; for now every product is "one print per photo".

---

## Shipping guard — `shipsTo` must include "US" *(planned)*

Prodigi products carry a `shipsTo` list. We only sell to the US, so a product
that can't ship to the US shouldn't be orderable. **Planned:** the SDS
`print-area-sizes` endpoint validates that Prodigi's `shipsTo` includes `"US"`
(or `"GLOBAL"`) and returns an error otherwise, so the client can block building
a print that can't ship. **Not built yet.**

---

## Code map

| Concern | Location |
|---|---|
| PDP — size, Select → picker (multi) → navigate | `src/app/(home)/product/[id].tsx` |
| Builder — fetch print spec, per-photo quality check, re-pick | `src/app/(home)/builder/[sku].tsx` |
| API client — `getProduct`, `getPrintAreaSizes` | `src/api/catalog.ts` |
| Async fetch + loading/error/retry | `src/hooks/use-async.ts` |
| Product / variant / print-area types | `src/api/types.ts` |

API side (see the api repo): `GET /v1/products/{id}` (PDP content),
`GET /v1/print-area-sizes/{sku}` (resolution + DPI).

---

## Status / TODO

- ✅ PDP → picker → builder; cancel-picker → PDP; builder-fetched quality check with Retry.
- ✅ Unlimited multi-select (photos = quantity); no PDP quantity control.
- ⬜ `shipsTo` = US guard (API).
- ⬜ Builder UI (crop / fit), add-to-cart, checkout (quantity in cart).
