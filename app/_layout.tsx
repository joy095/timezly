import { Stack } from "expo-router";
import { CustomThemeProvider } from "@/theme/ThemeContext";
import { AppProviders } from "@/providers/AppProviders";

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AppProviders>
        <Stack />
      </AppProviders>
    </CustomThemeProvider>
  );
}
