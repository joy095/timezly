import type { Theme as NavigationTheme } from "@react-navigation/native";
import type { MD3Theme } from "react-native-paper";

export type CustomColors = {
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  cardElevated: string;
  cardPressed: string;

  // Text with WCAG AA compliant contrast ratios (4.5:1 minimum) [^18^]
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Primary action - medical teal (calming, professional)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  onPrimary: string;

  // Secondary - soft coral for warmth and urgency without panic
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  onSecondary: string;

  // Tertiary - sage green for health indicators
  tertiary: string;
  onTertiary: string;

  // Semantic colors - refined for medical context
  success: string;
  warning: string;
  error: string;
  info: string;

  // Borders and dividers - subtle but visible
  border: string;
  borderStrong: string;
  divider: string;

  // Status colors for appointments - distinct and accessible
  available: string;
  booked: string;
  unavailable: string;
  urgent: string;
  pending: string;

  // Medical specialty colors - distinct, harmonious palette
  // Using HSL hue separation for clear differentiation
  cardiology: string;
  dermatology: string;
  neurology: string;
  pediatrics: string;
  orthopedics: string;
  general: string;
  dentistry: string;
  ophthalmology: string;
  psychiatry: string;
  gynecology: string;

  // Shadow and elevation
  shadow: string;
  scrim: string;

  // Overlay for modals
  overlay: string;

  // Disabled states
  disabled: string;
  onDisabled: string;

  // Notification
  notification: string;
};

export type AppTheme = NavigationTheme &
  MD3Theme & {
    colors: NavigationTheme["colors"] & MD3Theme["colors"] & CustomColors;
  };
