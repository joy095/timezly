// _layout.tsx
import { AuthSync } from "@/components/AuthSync";
import { AppProviders } from "@/providers/AppProviders";
import { CustomThemeProvider } from "@/theme/ThemeContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AppProviders>
        <AuthSync />
        <RootLayoutInner />
      </AppProviders>
    </CustomThemeProvider>
  );
}

function RootLayoutInner() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Public - No auth needed */}
        <Stack.Screen name="welcome" />
        <Stack.Screen name="index" />
        <Stack.Screen name="test" />
        <Stack.Screen name="(tabs)" />

        {/* Auth - Blocks logged in users */}
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}
