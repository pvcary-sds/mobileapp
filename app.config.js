/**
 * Dynamic Expo config. Static values live in `app.json`; this layer bakes the
 * target ENVIRONMENT into the build.
 *
 * The environment is chosen by the `APP_ENV` env var, which the EAS build
 * profiles set (see `eas.json`): `staging` builds off `main`, `production`
 * builds off `release`. With no `APP_ENV` (local `expo start`) it defaults to
 * staging. The result is exposed to the app as `expoConfig.extra.environment`
 * and `.apiBaseUrl`.
 *
 * Plain JS (not TS) so EAS's config loader doesn't need TypeScript
 * transpilation, which fails under some Node versions.
 */
const API_BASE_URLS = {
  staging: 'https://api.dev.samedaysnaps.com/v1',
  production: 'https://api.samedaysnaps.com/v1',
};

function resolveEnvironment() {
  return process.env.APP_ENV === 'production' ? 'production' : 'staging';
}

module.exports = ({ config }) => {
  const environment = resolveEnvironment();
  return {
    ...config,
    name: config.name ?? 'SameDaySnaps',
    slug: config.slug ?? 'mobileapp',
    extra: {
      ...config.extra,
      environment,
      apiBaseUrl: API_BASE_URLS[environment],
    },
  };
};
