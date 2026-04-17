// app/(user-tabs)/_layout.tsx
import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { observer } from "@legendapp/state/react";
import { authStore$ } from "@/stores/authStore";
import { FloatingBottomTabs, TabConfig } from "@/components/FloatingBottomTabs";
import useAppColors from "@/theme/useAppColors";
import { appMode$ } from "@/stores/userClinicSwitch";
import { Redirect } from "expo-router";

const MY_TABS: TabConfig[] = [
  {
    name: "index",
    href: "/",
    icon: "home",
    isCenter: false,
    authRequired: false,
  },
  {
    name: "explore",
    href: "/explore",
    icon: "search",
    isCenter: false,
    authRequired: false,
  },
  {
    name: "profile",
    href: "/profile",
    icon: "person",
    isCenter: false,
    authRequired: false,
  },
];

export default observer(function UserTabLayout() {
  const isPending = authStore$.isPending.get();

  const colors = useAppColors();

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currentMode = appMode$.activeMode.get();

  if (currentMode === "clinic") {
    return <Redirect href="/(clinic-tabs)/menu" />;
  }
  return (
    <Tabs style={styles.container}>
      <TabSlot />
      <FloatingBottomTabs colors={colors} tabs={MY_TABS} />
      {/* Pass colors, not theme */}
      <TabList style={styles.hidden}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="explore" href="/explore" />
        <TabTrigger name="profile" href="/profile" />
      </TabList>
    </Tabs>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  hidden: { display: "none" },
});
