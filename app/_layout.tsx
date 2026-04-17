// _layout.tsx
import { AuthSync } from "@/components/AuthSync";
import { AppProviders } from "@/providers/AppProviders";
import { CustomThemeProvider } from "@/theme/ThemeContext";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Public - No auth needed */}
        <Stack.Screen name="index" />
        <Stack.Screen name="test" />
        <Stack.Screen name="[...404]" options={{ headerTitle: "" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
