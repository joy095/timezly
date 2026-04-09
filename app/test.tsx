import { observer } from "@legendapp/state/react";
import { authStore$ } from "@/stores/authStore";
import { Image } from "expo-image";
import { Text, View, ActivityIndicator } from "react-native";

export const UserAvatar = observer(() => {
  const image = authStore$.user.image.get(); // fine-grained — only re-renders if image changes
  console.log("user", authStore$.user.image.get());
  if (!image) return null;

  return (
    <Image
      style={{ height: 25, width: 25, borderRadius: 25 }}
      source={{ uri: image }}
    />
  );
});

export const ProfileScreen = observer(() => {
  const name = authStore$.user.name.get(); // fine-grained — only re-renders if name changes
  return <Text>{name}</Text>;
});

export default observer(function TestScreen() {
  const isPending = authStore$.isPending.get();
  const user = authStore$.user.get();

  if (isPending) return <ActivityIndicator />;

  if (!user) return <Text>Not logged in</Text>;

  return (
    <View>
      <Text>Hello from test screen</Text>
      <UserAvatar />
      <ProfileScreen />
    </View>
  );
});
