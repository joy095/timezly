// app/welcome/_layout.tsx
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAppColors from "@/theme/useAppColors";
import { useAppTheme } from "@/theme/ThemeContext";
import { authStore$ } from "@/stores/authStore";
import { observer } from "@legendapp/state/react";

export default observer(function WelcomeLayout() {
  const colors = useAppColors();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const isPending = authStore$.isPending.get();
  const session = authStore$.session.get();

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(user-tabs)" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
            paddingTop: insets.top,
          },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
