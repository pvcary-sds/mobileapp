/**
 * The app's single (light) theme. Semantic color roles mapped from the Figma
 * palette primitives in `palette.ts`. Components consume these roles — never the
 * raw palette. There is intentionally no dark variant: the app is locked to this
 * one theme (see `userInterfaceStyle` in app.json).
 */

import '@/global.css';

import { Platform } from 'react-native';

import { Base, Brand, Gray, Label, LightBlue, Primary, withAlpha } from '@/constants/palette';

export const Colors = {
  // Text
  text: Gray[900], // primary text
  textTertiary: Gray[700], // supporting text a step lighter than primary (e.g. prices)
  textSecondary: Gray[500], // descriptions, captions
  textMuted: Gray[400], // hints, disabled

  // Surfaces
  background: Base.white, // screen background
  backgroundElement: Gray[100], // raised fills / image placeholders
  backgroundSelected: Gray[200], // pressed / subtle selected surface
  border: Gray[200], // card borders, dividers
  borderStrong: Gray[300], // a step darker — segmented controls, emphasized dividers
  lightBlueSurface: LightBlue[100], // LightBlue/100 — soft blue tile (size "Show more")

  // Brand / action
  primary: Brand.red, // #E62600 — brand action color = Primary/500 (CTAs, nav tint)
  primarySoft: Primary[50], // tinted selected background
  onPrimary: Base.white, // text/icon on a primary fill

  // Over imagery (Gray/0 = white)
  overlayContent: Gray[0], // dots / controls sitting on a photo
  overlayLight: withAlpha(Gray[0], 0.1), // translucent light pill/scrim (Gray/0 @ 10%)

  // Destructive (delete) control border — Primary/600.
  deleteBorder: Primary[600],
  // Selected indicator — Primary/600 stroke + Primary/700 label.
  selectedBorder: Primary[600],
  selectedText: Primary[700],
  iconDisabled: Gray[300], // Gray/300 — a disabled icon/control



  // Status (Label pairs)
  successFg: Label.darkGreen,
  successBg: Label.lightGreen,
  errorFg: Label.darkRed,
  errorBg: Label.lightRed,
  warningFg: Label.darkYellow,
  warningBg: Label.lightYellow,
  infoFg: Label.darkBlue,
  infoBg: Label.lightBlue,
  // Neutral badge — Dark Blue/700 text on Dark Blue/light fill.
  neutralFg: Label.defaultDark, // #222244 (Dark Blue 700)
  neutralBg: Label.defaultLight, // #F0F0F4 (Dark Blue light)
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * Brand fonts (loaded in the root layout via `useFonts`):
 * body = DM Sans, title = Crimson Text. Use these family names in `fontFamily`.
 */
export const FontFamily = {
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  title: 'CrimsonText_600SemiBold',
  titleBold: 'CrimsonText_700Bold',
} as const;

/**
 * PostScript font names — required by native UIKit components (e.g. the
 * `NativeTabs` tab-bar labels), which resolve fonts by PostScript name rather
 * than the expo-font key used for React Native `<Text>`.
 */
export const NativeFontFamily = {
  bodyMedium: 'DMSans-Medium',
  bodySemiBold: 'DMSans-SemiBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
