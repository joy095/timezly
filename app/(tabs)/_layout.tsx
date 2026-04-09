// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { authStore$ } from "@/stores/authStore";
import { observer } from "@legendapp/state/react";

export default observer(function TabLayout() {

  const isPending = authStore$.isPending.get();
  const session = authStore$.session.get();

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If NOT logged in, redirect to login
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="home" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="travel-explore" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <AntDesign name="profile" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
});
