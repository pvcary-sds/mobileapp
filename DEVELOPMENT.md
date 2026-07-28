# SameDaySnaps Mobile — Development & Release Setup

How this app is developed, which **environment** each build talks to, and how
**branches** map to those environments. Read this before shipping anything.

---

## TL;DR

| | |
|---|---|
| **Environments** | `staging` → `api.dev.samedaysnaps.com` · `production` → `api.samedaysnaps.com` |
| **Branches** | `main` → **staging** · `release` → **production** |
| **Promote to prod** | merge `main` → `release` |
| **Run locally** | `npx expo start` (defaults to **staging**) |
| **Switch env in a dev build** | tap the env pill in the Home header |

---

## Running locally

```bash
npm install
npx expo start        # press i (iOS simulator), a (Android), w (web)
```

A local `expo start` has no `APP_ENV`, so it talks to **staging** by default.
Point it somewhere else without rebuilding by exporting `EXPO_PUBLIC_API_BASE`
(e.g. a local API tunnel) — it overrides everything below.

> The current tab bar uses `NativeTabs` (real native tab bar → Liquid Glass on
> iOS 26). Stripe checkout will later require a **development build**
> (`npx expo run:ios`) instead of Expo Go — not needed for the browse flow.

---

## Environments

Two environments, each a different SDS API:

| Environment | API base | Purpose |
|---|---|---|
| **staging** | `https://api.dev.samedaysnaps.com/v1` | Development & QA (sandbox Prodigi/Stripe, draft content) |
| **production** | `https://api.samedaysnaps.com/v1` | Real customers (live Prodigi/Stripe, published content) |

### How an environment is selected

The environment is decided **at build time** and flows through the app like this:

```
EAS build profile (eas.json)          e.g. profile "production" sets APP_ENV=production
        │  APP_ENV
        ▼
app.config.ts                         reads APP_ENV → sets extra.environment + extra.apiBaseUrl
        │  expoConfig.extra
        ▼
src/api/environment.ts                BUILD_ENVIRONMENT + getApiBaseUrl()
        │
        ▼
src/api/client.ts                     every request uses getApiBaseUrl()
```

Resolution order for the base URL (first match wins):

1. **`EXPO_PUBLIC_API_BASE`** env var — explicit override (local tunnels).
2. **Dev runtime override** — the in-app toggle, dev builds only (below).
3. **Build environment** — `extra.environment` from the EAS profile; defaults to `staging`.

### The dev environment toggle

Dev builds show a small **environment pill in the Home header** (`Staging` /
`Production`). Tapping it switches the API environment, persists the choice
(`AsyncStorage`), and reloads the app so everything refetches. It renders only
when `__DEV__` — **production builds never show it and can't be overridden.**

---

## Branches → environments

A long-lived branch per environment:

| Branch | Environment | What it is |
|---|---|---|
| **`main`** | staging | The integration branch. Everything merges here first. |
| **`release`** | production | What ships to the App Store / real users. |

### Day-to-day flow

```
feature branch ──PR──▶ main ──────────────▶ staging builds (QA)
                        │
                        │  when a build is verified on staging
                        ▼
                     release  ─────────────▶ production builds (App Store)
   (promote by merging main → release)
```

1. Branch off `main` (`feat/…`, `fix/…`), open a **PR into `main`**.
2. Merged `main` is the **staging** line — build/test it against the staging API.
3. To ship, **merge `main` → `release`**. `release` is the **production** line;
   production builds are cut from it.

> **Rule:** never commit straight to `main` or `release` — always via PR.
> `release` only ever receives merges *from* `main` (a promotion), never direct work.

> Note: this is `release`-as-production, which is intentionally **different from
> the API repo** (where `main` is production). Keeping unreviewed work off the
> production line is the reason.

---

## Building (EAS)

Build profiles live in [`eas.json`](./eas.json):

| Profile | `APP_ENV` | Typical use | Built from |
|---|---|---|---|
| `development` | staging | dev client (native modules) | any branch |
| `staging` | staging | internal test builds | `main` |
| `production` | production | store submission | `release` |

One-time setup (needs an Expo account):

```bash
npm i -g eas-cli
eas login
eas init            # links the project, writes the EAS projectId
```

Then:

```bash
eas build --profile staging     --platform ios   # from main
eas build --profile production  --platform ios   # from release
eas submit --profile production  --platform ios
```

> **TODO:** wire EAS to build automatically on push to `main` (staging) and
> `release` (production) via the EAS GitHub app, mirroring the API's
> branch-based deploys. Manual `eas build` until then.

---

## See also

- [`README.md`](./README.md) — project overview & layout
- SDS API `API.md` (api repo) — the full API contract this app consumes
