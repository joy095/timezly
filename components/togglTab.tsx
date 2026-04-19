import useAppColors from "@/theme/useAppColors";
import { router, useSegments } from "expo-router";
import { useMemo } from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TabItem = {
  label: string;
  route: string;
  path: string;
};

type ToggleTabsProps = {
  tabs: TabItem[];
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  activeTextStyle?: TextStyle;
  inactiveTextStyle?: TextStyle;
  indicatorStyle?: ViewStyle;
};

export default function ToggleTabs({
  tabs,
  containerStyle,
  textStyle,
  activeTextStyle,
  inactiveTextStyle,
  indicatorStyle,
}: ToggleTabsProps) {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];

  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = currentRoute === tab.route;

          return (
            <TouchableOpacity
              key={tab.route}
              onPress={() => router.push(tab.path)}
              activeOpacity={0.7}
              style={styles.tabButton}
            >
              <Text
                style={[
                  styles.text,
                  textStyle,
                  isActive
                    ? [styles.activeText, activeTextStyle]
                    : [styles.inactiveText, inactiveTextStyle],
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.indicator,
                  indicatorStyle,
                  isActive ? styles.activeIndicator : styles.inactiveIndicator,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    outerContainer: {
      width: "100%",
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    container: {
      flexDirection: "row",
      width: "100%",
    },
    tabButton: {
      flex: 1, // Each tab takes equal space
      alignItems: "center",
      paddingVertical: 12,
    },
    text: {
      fontSize: 20,
      fontWeight: "600",
    },
    activeText: {
      color: colors.primary,
    },
    inactiveText: {
      color: colors.surfaceDisabled,
    },
    indicator: {
      height: 3,
      width: "100%",
      marginTop: 8,
      borderRadius: 1,
    },
    activeIndicator: {
      backgroundColor: colors.primary,
    },
    inactiveIndicator: {
      backgroundColor: "transparent",
    },
  });
