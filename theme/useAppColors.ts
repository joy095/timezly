import { useTheme } from "@react-navigation/native";
import type { AppTheme } from "./types";

export default function useAppColors() {
  const theme = useTheme() as AppTheme;
  return theme.colors;
}
