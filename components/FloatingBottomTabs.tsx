// components/FloatingBottomTabs.tsx
import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { observer } from "@legendapp/state/react";
import { authStore$ } from "@/stores/authStore";
import { CustomColors } from "@/theme/types"; // Import the colors type

const { width } = Dimensions.get("window");

interface FloatingBottomTabsProps {
  colors: CustomColors; // Change from AppTheme to AppColors
}

const TABS = [
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
] as const;

export const FloatingBottomTabs = observer(function FloatingBottomTabs({
  colors,
}: FloatingBottomTabsProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const session = authStore$.session.get();

  const scaleAnim = React.useRef(TABS.map(() => new Animated.Value(1))).current;

  const handlePress = (index: number, href: string) => {
    Animated.sequence([
      Animated.timing(scaleAnim[index], {
        toValue: 0.8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim[index], {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    router.push(href as any);
  };

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    return pathname.startsWith(href) && href !== "/";
  };

  const visibleTabs = TABS.filter((tab) => {
    if (tab.authRequired && !session) return false;
    return true;
  });

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {visibleTabs.map((tab, index) => {
          const active = isActive(tab.href);

          if (tab.isCenter) {
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => handlePress(index, tab.href)}
                style={[
                  styles.centerButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={32}
                  color={colors.onPrimary}
                />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handlePress(index, tab.href)}
              style={styles.tabButton}
            >
              <Animated.View
                style={{ transform: [{ scale: scaleAnim[index] }] }}
              >
                <Ionicons
                  name={
                    active ? (tab.icon as any) : (`${tab.icon}-outline` as any)
                  }
                  size={24}
                  color={active ? colors.primary : colors.textMuted}
                />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    minWidth: width - 40,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
  },

  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 4,
    borderColor: "#F0F4F8",
  },
});
