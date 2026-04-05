import { AppContainer } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { Text } from "react-native";

export default function ProfileScreen() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <AppContainer>
        <Text>Loading...</Text>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Text>{session ? `Profile: ${session.user.name}` : "No token found"}</Text>
    </AppContainer>
  );
}
