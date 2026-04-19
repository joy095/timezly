// (org)/_layout.tsx
import { Redirect, Stack } from "expo-router";
import { observer } from "@legendapp/state/react";
import useAppColors from "@/theme/useAppColors";
import { authStore$ } from "@/stores/authStore";
import { ActivityIndicator, View } from "react-native";

export default observer(function OrgLayout() {
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

  // if don't have a session redirect to user tab
  // if (!session) {
  //   return <Redirect href="/(user-tabs)" />;
  // }

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
      }}
    >
      <Stack.Screen name="index" options={{ animation: "fade" }} />
      <Stack.Screen
        name="create-org"
        options={{ animation: "fade", headerTitle: "Create Organization" }}
      />
    </Stack>
  );
});
