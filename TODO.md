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

## Product options (borders, frames, finishes)

`ProductVariant` is `{ sku, size, price, orientation }` — **size is the only
variant axis**. That held while acrylic was the only product; every product added
since has options the model can't express, and Prodigi surfaces them two different
ways:

| Product | Option | How Prodigi models it |
|---|---|---|
| Maple wood | border — none / 1/4" / 1/2" | **in the SKU**: `…-NAT-NOBDR` / `-QTRBDR` / `-HALFBDR` |
| Maple wood | finish — natural / white | **in the SKU**: `…-NAT-` / `-WHI-` |
| Aluminium | finish — high gloss / mid-gloss / satin / sheer glossy / sheer matte | **an `attributes` value** on one SKU |

> **These four are the same gap.** The PDP can render a size grid and a flat list
> of attribute values, and nothing else. Every product added since acrylic has
> wanted something it can't draw:
>
> | Product | Needs | Why the PDP can't |
> |---|---|---|
> | Stretched / eco canvas | `ImageWrap`, `MirrorWrap` | the **edge** isn't drawn at all |
> | Maple wood | 1/4" and 1/2" borders | a second **SKU-encoded axis** beside size |
> | Slim canvas (not stocked) | 19mm vs 38mm depth | same SKU axis, and **depth** isn't drawn |
> | Poster hangers | portrait vs landscape | two identical-looking chips per size |
>
> Two capabilities cover all four: **render the edge/depth of a print**, and
> **offer a second SKU-encoded axis**. Doing them once unlocks image wraps, both
> wood borders, slim canvas as a product, and makes hangers buyable — rather than
> four separate workarounds.

- [ ] **Surface hanger orientation on the PDP — blocks buying a hanger.** Poster
      hangers sell the same size in portrait and landscape as separate SKUs at
      different prices (20x28 is $43 portrait, $48 landscape — the rail width
      follows the print's width). Both variants carry size `20x28`, so the picker
      shows **two identical-looking chips**. The `orientation` field is populated
      (`Portrait` / `Landscape` / `Square`) and correct; nothing renders it.
      Pricing is already handled — that table keys on SKU rather than size, the
      only one that does.

- [ ] **Sell the wood border options (1/4" and 1/2").** We ship `NAT-NOBDR` only.
      All three cost the same and report the same `productDimensions`, but the
      printable area differs (11x14: 3300x4200 / 3240x4140 / 3150x4050), so the
      crop ratio changes by 0.4–1.0%. The builder already prefers
      `printAreaSizes.default` over the nominal size, so geometry is handled;
      what's missing is a way to *choose* and a picker that doesn't read as
      duplicate sizes. `import-variants.mjs --sku-match` currently narrows to one.
- [ ] **Support attribute-based options (blocks selling aluminium).** Aluminium
      SKUs **require** a `finish`; a quote or order without one is a
      **400 from Prodigi**. `CartItem` has no attributes field and nothing in the
      app ever sets `OrderItem.attributes` (`src/api/order.ts:27` — declared,
      never populated), while the API passes whatever the client sends straight
      through (`src/routes/order.ts:205`). **The customer is charged before the
      Prodigi order is placed** (`order.ts:223` verifies the PaymentIntent,
      `:266` calls `createProdigiOrder`), so an aluminium order would take the
      money and then fail. Aluminium cannot ship until this is done.
- [ ] **Decide how options reach the cart and the order.** Both kinds need to
      survive PDP -> builder -> cart -> checkout -> order, and "Edit prints" has
      to restore them (`CartItem.selection`). A SKU-encoded option changes the
      `sku`; an attribute-encoded one changes `attributes` while the sku stays
      put — the cart shouldn't need to know which.
- [ ] **Show the canvas wrap — blocking `ImageWrap` only.** Stretched canvas
      requires a `wrap` (`ImageWrap` / `MirrorWrap` / `White` / `Black`), all four
      at the same cost. It is unlike `finish`: finish changes the face, which the
      builder already shows, while wrap changes the **edges**, which the builder
      does not render at all — it draws a flat rectangle. On a 38mm (1.5")
      stretcher those edges are very visible in the room.

      **Decision 2026-09-13, revised: selling `Black` / `White` / `MirrorWrap`;
      holding `ImageWrap`.** The line is whether the customer can predict the
      result without seeing it:

      | Wrap | Edges | Needs a preview? |
      |---|---|---|
      | `Black` / `White` | solid colour | no — self-explanatory |
      | `MirrorWrap` | the face mirrored around the sides | no — purely additive; nothing leaves the face, so the crop frame stays accurate |
      | `ImageWrap` | the photo continues around the sides | **yes** — what lands on the edge depends on what sits near the border of their crop, which the flat frame cannot convey |

      So this item is now only about `ImageWrap`. Selling it needs the builder to
      represent the edge — a depth/wrap preview, or at minimum a diagram.
      (Prodigi generates the wrap itself: the print area is only +0.09"/side on
      38mm and does not scale with depth, so this is a presentation problem, not a
      crop-geometry one. The frame stays the visible face.)

- [ ] **Guard the failure mode regardless.** Even once options exist, the API
      should reject an order whose SKU has required attributes that are missing,
      *before* it charges — rather than surfacing a Prodigi 400 after the money
      has moved.

## Release — production is behind staging

`main` trails `develop`, so production runs older API code than staging. Most of
the gap is `scripts/**`, which never deploys (it is in the workflow's
`paths-ignore`) and only affects local tooling. Two things do affect the running
service:

- [ ] **`framecolor` in `ATTRIBUTE_FIELDS`** — without it `posterhangers` returns
      `options: []` in production, so the PDP has no Frame colour picker and a
      hanger cannot be bought there. Checkout itself is fine: it reads Prodigi's
      own attributes, so a colour sent by a client is accepted and priced
      correctly ($43/$48 verified in production).
- [ ] **The `posters` tier2 config entry** — the fallback that keeps
      `POST /v1/tier2/posters` from 404ing before its CMS story resolves.

Cutting a release is a deliberate act against live Stripe and live Prodigi, so
it happens when it happens. Recorded here so the drift is tracked rather than
rediscovered.

## Pricing — the canvas oversize shipping cliff

Prodigi's stretched-canvas shipping is tiered by longest side, and the top tier is
a **cliff, not a curve**. Measured 2026-09-13 (US→US, Standard, qty 1):

| Longest side | Shipping |
|---|---|
| 6–8" | $21.55 |
| 10–16" | $24.80 |
| 18–24" | $25.90 |
| 26–32" | $32.35 |
| 36" | $34.55 |
| 38–40" | $50.75 |
| **42–60"** | **$232.20** |

Crossing 40" multiplies shipping **4.6x**, and on those sizes shipping is **73% of
landed cost**. The item price itself scales normally throughout — this is entirely
carriage.

Because shipping is free to the customer and baked into retail (see `PRICING.md`),
that lands in the sticker price:

| | Area | Shipping | Retail at 12% |
|---|---|---|---|
| `30x40` | 1200 in² | $50.75 | **$140** |
| `20x60` | 1200 in² | $232.20 | **$365** |
| `40x40` | 1600 in² | $50.75 | **$165** |
| `40x50` | 2000 in² | $232.20 | **$390** |

Same area, 2.6x the price. A customer seeing 40x40 at $165 next to 40x50 at $390
reads that as a mistake.

**Decision 2026-09-13: cap canvas at a 40" longest side.** 18 of the 80 sizes sit
above the cliff and none are listed. That caps canvas at 40x40 / $165.

- [ ] **Decide whether to sell above 40" at all.** Three options, none free:
      (a) stay capped — simplest, loses the statement-piece end of the market;
      (b) list them at ~$365–425 and accept the ladder looks broken;
      (c) charge shipping separately on oversize items — which breaks the
      free-shipping promise that is currently baked into every price on every
      product, so it is not a canvas-only change.
- [ ] **Check whether the cliff exists on other lines.** Acrylic goes to 30x40 and
      wood to 30x40, both under the threshold, so it has not bitten yet — but the
      next large-format product could hit it silently. Nothing in the pricing
      script warns when shipping jumps disproportionately to size.
- [ ] **Consider a guard in the pricing workflow.** A size whose shipping is >40%
      of landed cost is almost certainly mispriced or shouldn't be listed; today
      that is only caught by reading the table.

## Cancel order

Prodigi supports cancellation (`POST /v4.0/orders/{id}/actions/cancel`), but it is
**best-effort**: once an order reaches production Prodigi refuses it
(`ActionNotAvailable` / `FailedToCancel`). Decisions taken while building this:

- [ ] **No auth on cancel — anyone with an order id can cancel someone's order and
      trigger a refund.** `GET /v1/orders/:id` and the new cancel endpoint are both
      unauthenticated (there's no user model yet), so an order id is the only thing
      standing between a stranger and cancelling a paid order. Accepted for now;
      close it when the API gets a user model, or gate cancel on the recipient's
      email in the meantime.
- [x] **Cancelled orders live in the Completed tab.** Both `Complete` and
      `Cancelled` are terminal, so the Orders list treats them the same — a
      cancelled order would otherwise sit in Pending forever.
- [ ] **A cancelled order's coupon is not released.** Redemption is recorded at
      placement (`POST /v1/orders`) and never reversed, so a one-time code is spent
      even if the order is cancelled and refunded. The customer can't reuse it.
- [x] **Cancellation is blocked once fulfilment has started** — not offered as a
      partial refund. Prodigi refunds shipping only after fulfilment begins, and we
      charge the customer $0 shipping (it's baked into the retail price), so a
      post-fulfilment "cancel" would refund nothing. A button that cancels without
      refunding is worse than no button, so the API refuses and the app hides it.

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
- [ ] **State picker on the review screen.** The State field is a plain text input
      with a chevron; make it a real picker (USPS 2-letter list, see
      `src/lib/checkout-form.ts`).
- [ ] **Wire the checkout legal links.** On the Payment step
      (`src/app/(tabs)/cart/checkout/payment.tsx`) the "By ordering, I agree…"
      line has underlined **Terms of Use** and **Privacy Policy** spans that don't
      do anything yet. Give each an `onPress` (open the doc — in-app screen or the
      hosted URL via `Linking`).
- [ ] **"Track your order" screen.** The API now stores each placed order and keeps
      it fresh from Prodigi webhooks (`pvcary-sds/api` — the `orders` table +
      `POST /v1/webhooks/prodigi`). Build a screen that polls `GET /v1/orders/:id`
      and shows `stage`/`progress`, the shipment **`dispatchDate`** + carrier +
      **tracking** link, and per-item status. Reachable from the Confirmation step
      (thread the order id through) and, later, an order-history list. **Note:**
      read-by-id has no auth yet, and there's no "my orders" list until the API gets
      a user model — so entry is via the confirmation for now.
- [ ] **Show the order date on Confirmation.** `runCheckout` only returns the
      `orderId` today; thread the order's `created` through so Confirmation can show
      when it was placed. (No delivery estimate is available at placement — Prodigi
      returns none; those dates arrive later via the tracking screen above.)
- [ ] **Persist the customer email.** It's now *collected* on the review screen and
      passed to `POST /v1/checkout` (so the 1×-per-customer coupon limit binds), but
      not yet **stored locally** — persist it so `GET /v1/coupons?email=` can hide
      already-used codes across sessions.
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
