// (org)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { observer } from "@legendapp/state/react";
import useAppColors from "@/theme/useAppColors";
import { View, ActivityIndicator } from "react-native";
import { authStore$ } from "@/stores/authStore";

export default observer(function AuthLayout() {
  // observer wrapper
  const colors = useAppColors();

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
          color: colors.text,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, animation: "fade" }}
      />
    </Stack>
  );
});
