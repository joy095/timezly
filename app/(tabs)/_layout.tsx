// app/(tabs)/_layout.tsx
import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { observer } from "@legendapp/state/react";
import { authStore$ } from "@/stores/authStore";
import { FloatingBottomTabs } from "@/components/FloatingBottomTabs";
import useAppColors from "@/theme/useAppColors";

export default observer(function TabLayout() {
  const isPending = authStore$.isPending.get();

  const colors = useAppColors();

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs style={styles.container}>
      <View style={styles.content}>
        <TabSlot />
      </View>
      <FloatingBottomTabs colors={colors} /> {/* Pass colors, not theme */}
      <TabList style={styles.hidden}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="explore" href="/explore" />
        <TabTrigger name="profile" href="/profile" />
      </TabList>
    </Tabs>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingBottom: 100 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  hidden: { display: "none" },
});
