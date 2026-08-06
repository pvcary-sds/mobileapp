# Photo & Print Flow

How a customer goes from browsing to a print-ready photo, and the mechanics
behind it. Written for both product and engineering. Companion to
[`DEVELOPMENT.md`](../DEVELOPMENT.md); API endpoints are specified in the API
repo's `API.md`.

---

## The journey

```
Browse (tier1) → category (tier2) → product page (PDP)
      → choose a size + quantity
      → Select → native photo picker → pick a photo
      → Customize (builder): preview, quality check, swap photo
      → [add to cart / checkout — future]
```

1. **Browse.** tier1 landing → tap a category → tier2 sub-catalog → tap a product → **PDP**.
2. **PDP.** Pick a **size** (a `variant`, each carrying a Prodigi `sku`) and a **quantity**.
3. **Select.** Opens the **native photo picker** (iOS PHPicker / Android photo picker).
4. **Pick a photo.** Only then does the **builder** ("Customize") open.
5. **Builder.** Shows the photo, runs the **print-quality check**, and lets the customer swap the photo. Add-to-cart / checkout is the next slice.

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

## Photo-selection modes (`photoSelection`)

A per-product field on the product API that decides **how many photos** the
picker lets the customer choose. Authored in Storyblok on the product; defaults
to `perUnit`.

| Mode | Meaning | Picker | Quantity | Example |
|---|---|---|---|---|
| `perUnit` *(default)* | one photo per unit | select **`quantity`** photos | stepper = number of prints | acrylic, canvas, framed |
| `gallery` | unlimited; **one print per photo** | select **any number** | stepper hidden — count = number of prints | Prints |
| `single` | one photo, printed N times | select **1** | stepper = copies | — |

> **Status:** the API field ships in the product response; the **app-side
> multi-select is not built yet** — the app currently always single-selects.
> Setting `photoSelection` in Storyblok is safe now (it just isn't consumed
> until the app work lands).

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
| PDP — size/quantity, Select → picker → navigate | `src/app/(home)/product/[id].tsx` |
| Builder — fetch print spec, quality check, re-pick | `src/app/(home)/builder/[sku].tsx` |
| API client — `getProduct`, `getPrintAreaSizes` | `src/api/catalog.ts` |
| Async fetch + loading/error/retry | `src/hooks/use-async.ts` |
| Product / variant / print-area types | `src/api/types.ts` |

API side (see the api repo): `GET /v1/products/{id}` (PDP content, incl.
`photoSelection`), `GET /v1/print-area-sizes/{sku}` (resolution + DPI).

---

## Status / TODO

- ✅ PDP → picker → builder; cancel-picker → PDP; builder-fetched quality check with Retry.
- ✅ `photoSelection` on the product API (`perUnit` / `gallery` / `single`).
- ⬜ App multi-select consuming `photoSelection` (pick `quantity` / unlimited).
- ⬜ `shipsTo` = US guard (API).
- ⬜ Builder UI (crop / fit), add-to-cart, checkout.
