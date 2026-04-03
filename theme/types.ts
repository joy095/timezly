import type { Theme as NavigationTheme } from "@react-navigation/native";
import type { MD3Theme } from "react-native-paper";

export type CustomColors = {
  primaryLight: string;
  primaryDark: string;

  success: string;
  warning: string;
  error: string;
  info: string;

  textSecondary: string;
  textMuted: string;

  cardElevated: string;
  cardPressed: string;

  available: string;
  booked: string;
  unavailable: string;
  urgent: string;

  cardiology: string;
  dermatology: string;
  neurology: string;
  pediatrics: string;
  orthopedics: string;
  general: string;
};

export type AppTheme = NavigationTheme &
  MD3Theme & {
    colors: NavigationTheme["colors"] & MD3Theme["colors"] & CustomColors;
  };
