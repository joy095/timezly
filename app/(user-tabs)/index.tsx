import { AppButton, AppContainer } from "@/components/ui";
import { router } from "expo-router";
import { Text } from "react-native";

export default function UserHomeTab() {
  return (
    <AppContainer>
      <Text>HomeTab</Text>
      <AppButton title="Test" onPress={() => router.push("/test")} />
    </AppContainer>
  );
}
