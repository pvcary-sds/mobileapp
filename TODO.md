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
- [ ] **Phase 2 — WYSIWYG print render.** Checkout currently uploads the
      **original** photo (Phase 1). Replace it with a **full-res Skia render** of the
      builder edits (crop/filter/adjust/zoom) so the print matches what the customer
      designed. Export in `runCheckout`'s upload step (`src/lib/payment.ts` →
      `src/api/uploads.ts`); honor the print frame from `docs/customize-builder.md`.
- [ ] **Persist the customer email.** It's now *collected* on the review screen and
      passed to `POST /v1/checkout` (so the 1×-per-customer coupon limit binds), but
      not yet **stored locally** — persist it so `GET /v1/coupons?email=` can hide
      already-used codes across sessions.
- [ ] **State picker on the review screen.** The State field is a plain text input
      with a chevron; make it a real picker (USPS 2-letter list, see
      `src/lib/checkout-form.ts`).
- [ ] **Cart persistence.** The cart is in-memory (`src/lib/cart-store.ts`) and
      resets on app restart — persist it via AsyncStorage.
- [ ] **Collapse redundant `CartItem` fields.** `title` / `size` / `price` /
      `productId` / `sku` duplicate what's already in `selection`; derive them.

## Stripe — production readiness

Checkout runs end to end on **staging** (Stripe **test** mode + sandbox Prodigi).
Before it can take real money in **production**, the following must be in place. See
[`docs/checkout.md`](docs/checkout.md) for how each piece is wired today.

**Account & payouts**
- [ ] **Activate the Stripe account for live payments** — business details,
      identity verification, and a **payout bank account** + schedule. A test-mode
      account cannot take live charges.
- [ ] **Statement descriptor + branding** — set the descriptor that shows on the
      customer's card statement, plus business name, support email/phone, and the
      brand logo/color (used on the PaymentSheet + receipts).
- [ ] **Receipts** — enable Stripe email receipts in **live** mode (or decide we
      send our own).

**Keys**
- [ ] **Live publishable key** — `app.config.js` `production` is empty. Set
      `STRIPE_PUBLISHABLE_KEY_LIVE` (EAS production env) or paste the `pk_live_…`.
- [ ] **Live secret key on the API** — the production API (`pvcary-sds/api`) must
      have the `sk_live_…` in **SSM** for the prod environment (staging uses the
      test secret). Confirm the prod deploy reads it.

**Payment methods (settings are PER-MODE — test ≠ live)**
- [ ] **Re-do the payment-method selection in LIVE mode** — enable **card, Apple
      Pay, Amazon Pay**; disable Link, Cash App, Affirm, Klarna, bank debits (the
      test-mode choices don't carry over).
- [ ] **Apple Pay** — create an **Apple Merchant ID**, register it in the Stripe
      Dashboard (Apple Pay settings), set the config plugin's `merchantIdentifier`
      in `app.json`, and cut a **new EAS build**. Required both for Apple Pay inside
      the sheet *and* the standalone button below. Needs a **real device** to test.
- [ ] **Standalone Apple Pay button** — surface Apple Pay as its own
      `PlatformPayButton` (`@stripe/stripe-react-native`) above the card flow on the
      review screen, wired via `confirmPlatformPayPayment` /
      `isPlatformPaySupported`. Depends on the Apple Merchant ID setup above.
- [ ] **Amazon Pay** — if we keep it, confirm it's configured/approved in live.

**Tax**
- [ ] **Stripe Tax in live mode** — enable Stripe Tax for the live account and
      enter the **IL** registration (our only nexus today). Add states as nexus
      grows; the API already applies Stripe Tax at `/v1/checkout` (IL-only).

**Webhooks & reconciliation** *(biggest gap — do not ship live without this)*
- [ ] **Production webhook endpoint** for PaymentIntent events
      (`payment_intent.succeeded` / `.payment_failed`, `charge.dispute.created`).
      The client places the order after payment, so if the app dies between charge
      and `POST /v1/orders` the customer is charged with **no order** — a webhook
      gives the server a source of truth to **reconcile** (auto-place the order, or
      flag/refund). This is what the app's `order_error` outcome relies on being
      caught server-side.
- [ ] **Refund path** — a process (Dashboard to start) for the paid-but-not-placed
      case and normal support refunds.

**Fraud & compliance**
- [ ] **Review Stripe Radar rules** for live traffic.
- [ ] Confirm 3D Secure / SCA redirects return correctly on a **production** build
      (`returnURL: mobileapp://stripe-redirect`). PaymentSheet keeps us in **PCI SAQ
      A** (card data never touches our code) — keep it that way.

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

- [x] **Checkout flow — end to end (Phase 1).** Cart → **Review order** screen
      (contact + shipping + total) → `runCheckout` (`src/lib/payment.ts`): price the
      basket (`POST /v1/checkout`) + upload every photo **in parallel**, present the
      Stripe **PaymentSheet**, then place the Prodigi order (`POST /v1/orders`).
      Uploads run before payment (a failed upload never charges the card); one line
      per cart item keeps the checkout/order **basket signatures** matching; a
      distinct `order_error` outcome avoids double-charging. Uploads the original
      photo for now (Phase 2 = WYSIWYG render). See `docs/checkout.md`.
- [x] **Stripe payments wired.** `@stripe/stripe-react-native` + config plugin,
      guarded `AppStripeProvider` / native-module probe (`src/lib/stripe.ts`),
      publishable keys per environment (`app.config.js`), and a branded PaymentSheet
      (DM Sans, Gray/200 borders, 8px radius, Primary/500 Pay button). Working on
      **staging** with Stripe test cards.
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
