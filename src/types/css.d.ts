/**
 * Metro/Expo resolves `.css` side-effect imports (used for web CSS variables in
 * constants/theme.ts). Expo normally emits this declaration into the git-ignored
 * `expo-env.d.ts`, which only exists after a dev server has run — declaring it
 * here keeps a fresh checkout type-checking without one.
 */
declare module '*.css';
