import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

import { AppTheme } from "./types";

export const LightTheme: AppTheme = {
  ...DefaultTheme,
  ...MD3LightTheme,
  colors: {
    ...DefaultTheme.colors,
    ...MD3LightTheme.colors,

    background: "#F8FAFC",
    text: "#0F172A",
    primary: "#2563EB",
    card: "#FFFFFF",
    border: "#E2E8F0",

    primaryLight: "#3B82F6",
    primaryDark: "#1D4ED8",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    textSecondary: "#475569",
    textMuted: "#94A3B8",

    cardElevated: "#FFFFFF",
    cardPressed: "#273548",

    available: "#10B981",
    booked: "#F59E0B",
    unavailable: "#94A3B8",
    urgent: "#EF4444",

    cardiology: "#EF4444",
    dermatology: "#F97316",
    neurology: "#8B5CF6",
    pediatrics: "#EC4899",
    orthopedics: "#2563EB",
    general: "#10B981",
  },
};

export const DarkThemeCustom: AppTheme = {
  ...DarkTheme,
  ...MD3DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...MD3DarkTheme.colors,

    background: "#0F172A",
    text: "#F8FAFC",
    primary: "#3B82F6",
    card: "#1E293B",
    border: "#334155",

    primaryLight: "#60A5FA",
    primaryDark: "#2563EB",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
    info: "#60A5FA",

    textSecondary: "#CBD5E1",
    textMuted: "#64748B",

    cardElevated: "#334155",
    cardPressed: "#0F172A",

    available: "#34D399",
    booked: "#FBBF24",
    unavailable: "#64748B",
    urgent: "#F87171",

    cardiology: "#F87171",
    dermatology: "#FB923C",
    neurology: "#A78BFA",
    pediatrics: "#F472B6",
    orthopedics: "#60A5FA",
    general: "#34D399",
  },
};
