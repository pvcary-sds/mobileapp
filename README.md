# SameDaySnaps — Mobile App

The React Native (Expo) app for **SameDaySnaps**: browse products, upload a
photo, and order custom acrylic prints fulfilled by Prodigi and paid via Stripe.
It consumes the [SDS API](https://api.samedaysnaps.com/v1) (see the API repo's
`API.md` for the full contract).

## Stack

- **Expo** (SDK 57) + **expo-router** (file-based routing), TypeScript strict.
- Targets a **development build** (not Expo Go) once native modules land
  (Stripe, image picker, HEIC → JPEG).

## Getting started

```bash
npm install
npx expo start        # dev; press i for iOS simulator, a for Android
```

By default a **dev** build talks to **staging** (`api.dev.samedaysnaps.com`); a
release build talks to **production**. Override with `EXPO_PUBLIC_API_BASE`.

## Project layout

```
src/
  api/          API client (config, typed client, catalog calls, response types)
  app/          expo-router screens
    index.tsx           tier1 — landing categories
    tier2/[id].tsx      tier2 — sub-catalog
    product/[id].tsx    product page (copy, images, sizes)
  components/   ThemedText/View, CatalogCard, ScreenState
  hooks/        useAsync (load/error/retry), theme + color-scheme hooks
  lib/          helpers (html → text)
```

## The browse flow

`POST /v1/tier1` → `POST /v1/tier2/{id}` → `GET /v1/products/{id}` →
(next) `GET /v1/print-area-sizes/{sku}` → photo upload → checkout → order.

Browsing is keyed by `id`; fulfilment by a variant's `sku`. Every request sends
the required `appversion` header; Prodigi endpoints send `fulfillmentType: "prodigi"`.

## Status

Built: project scaffold, API client, and the browse slice (tier1 → tier2 →
product page with size selection). Next: print-area-sizes + photo pick/upload,
then Stripe checkout.
