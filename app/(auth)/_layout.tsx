// (auth)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { observer } from "@legendapp/state/react";
import useAppColors from "@/theme/useAppColors";
import { View, ActivityIndicator } from "react-native";
import { authStore$ } from "@/stores/authStore";

export default observer(function AuthLayout() {
  // observer wrapper
  const colors = useAppColors();

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
    return <Redirect href="/(tabs)" />;
  }

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
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen name="login" options={{ headerTitle: "" }} />
      <Stack.Screen name="sign-up" options={{ headerTitle: "" }} />
      <Stack.Screen name="forgot-password" options={{ headerTitle: "" }} />
      <Stack.Screen name="reset-password" options={{ headerTitle: "" }} />
      <Stack.Screen name="success" options={{ headerTitle: "Success" }} />
      <Stack.Screen
        name="verify-email"
        options={{ headerTitle: "Verify Email" }}
      />
    </Stack>
  );
});
