import Constants from 'expo-constants';

/**
 * SDS API configuration.
 *
 * Base URLs come from API.md. We default to STAGING in development and
 * PRODUCTION in a release build, and allow an explicit override via the
 * public env var `EXPO_PUBLIC_API_BASE` (handy for pointing a dev build at
 * prod, or at a local tunnel).
 */
export const API_BASE_PRODUCTION = 'https://api.samedaysnaps.com/v1';
export const API_BASE_STAGING = 'https://api.dev.samedaysnaps.com/v1';

function resolveBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_BASE?.trim();
  if (override) return override.replace(/\/+$/, '');
  return __DEV__ ? API_BASE_STAGING : API_BASE_PRODUCTION;
}

export const API_BASE = resolveBaseUrl();

/**
 * The `appversion` header is required on EVERY call (400 MISSING_APP_VERSION
 * otherwise). We send the app's own version from app.json.
 */
export const APP_VERSION: string =
  Constants.expoConfig?.version ?? '0.0.0';

/**
 * Fulfilment channel. The whole print-and-ship flow is `prodigi`; the Prodigi
 * endpoints reject anything else. `walgreens` (same-day pickup) is not wired up
 * on the client yet.
 */
export type FulfillmentType = 'prodigi' | 'walgreens';
export const DEFAULT_FULFILLMENT: FulfillmentType = 'prodigi';
