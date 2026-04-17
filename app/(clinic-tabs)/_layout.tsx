// app/(clinic-tabs)/_layout.tsx
import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { observer } from "@legendapp/state/react";
import { authStore$ } from "@/stores/authStore";
import { FloatingBottomTabs, TabConfig } from "@/components/FloatingBottomTabs";
import useAppColors from "@/theme/useAppColors";
import { Redirect } from "expo-router";
import { appMode$ } from "@/stores/userClinicSwitch";

const MY_TABS: TabConfig[] = [
  {
    name: "index",
    href: "/",
    icon: "home",
    isCenter: false,
    authRequired: false,
  },
  {
    name: "menu",
    href: "/menu",
    icon: "menu",
    isCenter: false,
    authRequired: false,
  },
];

export default observer(function ClinicTabLayout() {
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

  if (currentMode === "user") {
    return <Redirect href="/(user-tabs)/profile" />;
  }

  return (
    <Tabs style={styles.container}>
      <TabSlot />
      <FloatingBottomTabs colors={colors} tabs={MY_TABS} />
      <TabList style={styles.hidden}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="menu" href="/menu" />
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
