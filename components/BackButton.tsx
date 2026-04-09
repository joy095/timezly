import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import {
  Platform,
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import useAppColors from "@/theme/useAppColors";
import { useAppTheme } from "@/theme/ThemeContext";

const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const useHapticFeedback = () => {
  return useCallback(() => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
};

export function BackButton({
  onPress,
  color,
  isDark,
  colors,
}: {
  onPress?: () => void;
  color?: string;
  isDark?: boolean;
  colors?: ReturnType<typeof useAppColors>;
}) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const haptic = useHapticFeedback();
  
  // Use provided values or fallback to hooks
  const fallbackColors = useAppColors();
  const { theme } = useAppTheme();
  const finalColors = colors || fallbackColors;
  const finalIsDark = isDark ?? theme === "dark";
  const finalColor = color || finalColors.primary;

  const handlePress = onPress || (() => router.back());
  const styles = useMemo(() => getStyles(finalColors), [finalColors]);

  const handlePressIn = () => {
    haptic();
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      friction: 8,
      tension: 400,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 400,
    }).start();
  };

  const bgColor = finalIsDark 
    ? hexToRgba(finalColor, 0.12) 
    : hexToRgba(finalColor, 0.08);
  const borderColor = finalIsDark 
    ? hexToRgba(finalColor, 0.25) 
    : hexToRgba(finalColor, 0.15);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      style={styles.backButtonContainer}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View
          style={[
            styles.backButton,
            {
              backgroundColor: bgColor,
              borderColor: borderColor,
            },
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={finalColor}
            style={styles.backIcon}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    backButtonContainer: {
      marginLeft: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    backIcon: {
      marginLeft: -2,
    },
  });