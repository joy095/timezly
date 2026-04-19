// components/FloatingBottomTabs.tsx
import React, { useMemo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { observer } from "@legendapp/state/react";
import { authStore$ } from "@/stores/authStore";
import { CustomColors } from "@/theme/types";

// Tab configuration type
export interface TabConfig {
  name: string;
  href: string;
  icon: string;
  image?: ImageSourcePropType;
  isCenter?: boolean;
  authRequired?: boolean;
  useImage?: boolean;
}

interface FloatingBottomTabsProps {
  colors: CustomColors;
  tabs: TabConfig[];
}

export const FloatingBottomTabs = observer(function FloatingBottomTabs({
  colors,
  tabs,
}: FloatingBottomTabsProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const session = authStore$.session.get();

  // Memoize styles to prevent unnecessary re-renders
  const styles = useMemo(() => getStyles(colors), [colors]);

  const scaleAnim = React.useRef(tabs.map(() => new Animated.Value(1))).current;

  React.useEffect(() => {
    if (scaleAnim.length !== tabs.length) {
      scaleAnim.length = 0;
      tabs.forEach(() => scaleAnim.push(new Animated.Value(1)));
    }
  }, [tabs]);

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

  const visibleTabs = tabs.filter((tab) => {
    if (tab.authRequired && !session) return false;
    return true;
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 0),
          borderTopColor: colors.border || "#E5E5E5",
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.tabBar}>
        {visibleTabs.map((tab, index) => {
          const active = isActive(tab.href);

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handlePress(index, tab.href)}
              style={styles.tabButton}
            >
              <Animated.View
                style={[
                  { transform: [{ scale: scaleAnim[index] }] },
                  tab.useImage && styles.imageContainer,
                ]}
              >
                {tab.useImage && tab.image ? (
                  <Image
                    source={tab.image}
                    style={[
                      styles.tabImage,
                      active && [
                        styles.activeTabImage,
                        { borderColor: colors.primary },
                      ],
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name={
                      active && !tab.isCenter
                        ? (tab.icon as any)
                        : tab.isCenter
                          ? (tab.icon as any)
                          : (`${tab.icon}-outline` as any)
                    }
                    size={28}
                    color={
                      active
                        ? tab.isCenter
                          ? colors.primary
                          : colors.text
                        : tab.isCenter
                          ? colors.text
                          : colors.textMuted
                    }
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const getStyles = (colors: CustomColors) =>
  StyleSheet.create({
    container: {
      position: "absolute", // Changed from "sticky" - not valid in RN
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "transparent",
    },
    tabBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: 8,
      paddingVertical: 10,
      backgroundColor: "transparent",
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    imageContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    tabImage: {
      width: 28,
      height: 28,
      borderRadius: 14,
      opacity: 0.6,
    },
    activeTabImage: {
      opacity: 1,
      borderWidth: 2,
    },
  });
