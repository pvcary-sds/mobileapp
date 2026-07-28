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

## Environments & branches

Two environments, each a different SDS API:

| Environment | API | Built from |
|---|---|---|
| **staging** | `api.dev.samedaysnaps.com` | `main` |
| **production** | `api.samedaysnaps.com` | `release` |

**How it's wired.** Each build is pinned to an environment at build time:
`app.config.ts` reads `APP_ENV` (set by the EAS build profile in `eas.json`) and
exposes it to the app as `expoConfig.extra.environment` / `.apiBaseUrl`. The API
client reads it via `src/api/environment.ts`. With no `APP_ENV` (plain
`npx expo start`) it defaults to **staging**.

**Branch flow.** Feature branches → PR → `main` (staging). To ship, merge
`main` → `release` (production). Mirrors the branch-per-environment model, just
`release`-as-production instead of the API repo's `main`-as-production.

**Switching while developing.** Dev builds show an environment pill in the Home
header — tap it to flip staging ↔ production (persisted, reloads the app).
Production builds never show it. `EXPO_PUBLIC_API_BASE` still overrides everything
(e.g. a local tunnel).

**Builds** (needs an Expo account): `eas login` && `eas init` once, then
`eas build --profile staging` / `--profile production`.

## Project layout

```
src/
  api/          API client — environment (base URL), config, client, catalog, types
  app/          expo-router screens
    _layout.tsx         bottom tab bar (Home, Gallery, Cart, Orders)
    (home)/             Home tab — the browse stack
      index.tsx           tier1 — landing categories
      tier2/[id].tsx      tier2 — sub-catalog
      product/[id].tsx    product page (copy, images, sizes)
    gallery.tsx / cart.tsx / orders.tsx   placeholder tabs
  components/   ThemedText/View, CatalogCard, ScreenState, DevEnvSwitcher
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
