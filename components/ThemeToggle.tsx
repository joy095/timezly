import { observer } from "@legendapp/state/react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useAppColors from "@/theme/useAppColors";
import { useAppTheme } from "@/theme/ThemeContext";

export const ThemeToggle = observer(() => {
  const { toggleTheme, theme } = useAppTheme();
  const colors = useAppColors();
  const isDark = theme === "dark";

  return (
    <Pressable
      onPress={toggleTheme}
      style={[styles.button, { backgroundColor: colors.card }]}
    >
      <Ionicons
        name={isDark ? "sunny" : "moon"}
        size={20}
        color={isDark ? "#FBBF24" : "#6366F1"}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    height: 38,
    width: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
