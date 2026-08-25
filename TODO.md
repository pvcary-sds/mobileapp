# TODO

Tracked follow-ups for SameDaySnaps. Spans this app (`pvcary-sds/mobileapp`),
the API (`pvcary-sds/api`), and Storyblok content. Check items off as they land;
add new ones here rather than leaving them only in chat/session notes.

## API + CMS

- [ ] **Make PDP badges API-driven.** The PDP shows a hardcoded "Free shipping"
      badge (`src/app/(home)/product/[id].tsx`, `Badge` / `HeaderShareButton`
      area, marked `// TODO`). Add a `badges` array to the product response
      (`GET /v1/products/{id}`), sourced from the Storyblok product story
      (decide shape, e.g. `{ label, variant? }[]`). Update the API contract +
      `src/services/storyblok.ts`, add a Badges field in Storyblok, then render
      `product.badges` in the app and drop the hardcode.
- [ ] **Add a size unit to the variant API.** `variant.size` is just e.g. `4x6`
      with no unit, so the app hardcodes " in" (PDP `SizeChip`, marked
      `// TODO`). Add a `unit` field (e.g. `in` / `cm`) to `ProductVariant`
      from the Storyblok variant blok; default to `in`. Then render
      `{size} {unit}` and remove the hardcoded string.

- [ ] **Add a `fixed` (whole-dollars-off) coupon discount type.** The API only
      supports `percent` + `free_shipping`; `$X off` codes (e.g. `SAVE15`) need a
      `fixed` type (`src/services/coupons.ts` `Discount` union + `priceCoupon`, plus
      the app's `CouponDiscount`). See `docs/dynamodb-setup.md` / cart.md TODO notes.

## Mobile app

- [ ] **Wire the PDP share action.** The PDP header has a share icon
      (`HeaderShareButton`, `// TODO`) that currently does nothing. On press,
      open the native share sheet with the product link/details (deep link to
      `/product/{id}`, name, maybe image).
- [ ] **Build the checkout flow.** From the cart's Checkout button: render +
      upload each print → `POST /v1/checkout` (Stripe PaymentIntent, with the
      applied `couponCode`) → confirm the card → `POST /v1/orders` (Prodigi).
- [ ] **Collect the customer email at checkout.** The coupon **1×-per-customer**
      limit only *binds* when `/v1/checkout` receives the email (see cart.md /
      the API's API.md). Add an email field to the checkout contact step, pass it
      to `POST /v1/checkout`, and **persist it locally** so `GET /v1/coupons?email=`
      can hide already-used codes.
- [ ] **Wire the checkout legal links.** On the Payment step
      (`src/app/(tabs)/cart/checkout/payment.tsx`) the "By ordering, I agree…"
      line has underlined **Terms of Use** and **Privacy Policy** spans that don't
      do anything yet. Give each an `onPress` (open the doc — in-app screen or the
      hosted URL via `Linking`).
- [ ] **Cart persistence.** The cart is in-memory (`src/lib/cart-store.ts`) and
      resets on app restart — persist it via AsyncStorage.
- [ ] **Collapse redundant `CartItem` fields.** `title` / `size` / `price` /
      `productId` / `sku` duplicate what's already in `selection`; derive them.

## Content (Storyblok)

- [ ] **Build the remaining tier2 sub-catalogs.** Only `tier2/wallart` exists.
      Add a story per tier1 product that drills down (`tier2/prints`,
      `tier2/posters`, `tier2/framedprints`, …) in the `Tier2` folder.
- [ ] **Fill in product images** across tier1 / tier2 items (many `imageUrl`
      fields are empty, so cards show the placeholder).

## Cleanup

- [ ] **Retire the config fallback** (`api` `src/config/tiers.ts`) once the
      Storyblok tier content is verified complete and stable.

## Done

- [x] **Coupons — API-driven + product-based.** Offers from
      `GET /v1/coupons?fulfillmentType=prodigi&skus=…` (only codes that apply to the
      cart's products), apply/preview via `POST /v1/coupons/validate`, an applied
      **"Active"** card state (white fill, badge, "Remove Code"), and a **success
      toast**. Server-side: an SDS coupon system (DynamoDB) with checkout
      enforcement. See `docs/cart.md` + the API's `API.md` / `docs/dynamodb-setup.md`.
- [x] **Reusable toast system** (`src/lib/toast-store.ts` + `components/toast*`).
- [x] **Cart page** — local store, quantity stepper (line-total price),
      edit-in-place via the builder, promo field, summary, cart-count badges.
- [x] **Builder / customizer** — crop, filters, adjust slider, pinch-zoom/pan, and
      the WYSIWYG Prodigi print frame. See `docs/customize-builder.md`.
- [x] Fix PDP description paragraph spacing (split richtext into per-paragraph
      Text blocks with a gap).
