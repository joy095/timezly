// _layout.tsx

import { AppProviders } from "@/providers/AppProviders";
import { CustomThemeProvider, useAppTheme } from "@/theme/ThemeContext";
import useAppColors from "@/theme/useAppColors";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import {
  Platform,
  StatusBar,
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AppProviders>
        <RootLayoutInner />
      </AppProviders>
    </CustomThemeProvider>
  );
}

// Utility to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const HeaderActionPlaceholder = () => <View style={{ width: 52 }} />;

// Animated header with iOS blur effect support
const AnimatedHeaderBackground = ({
  scrollY,
  colors,
  isDark,
}: {
  scrollY: Animated.Value;
  colors: ReturnType<typeof useAppColors>;
  isDark: boolean;
}) => {
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: headerOpacity,
          backgroundColor: isDark
            ? "rgba(30, 41, 59, 0.85)"
            : "rgba(255, 255, 255, 0.85)",
        },
      ]}
    />
  );
};

// Haptic feedback on press
const useHapticFeedback = () => {
  return useCallback(() => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
};

// Medical-themed back button with FULL color control
const BackButton = ({
  onPress,
  color,
  isDark,
  colors,
}: {
  onPress: () => void;
  color: string;
  isDark: boolean;
  colors: ReturnType<typeof useAppColors>;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const haptic = useHapticFeedback();

  const styles = useMemo(() => getStyles(colors), [colors]);

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

  // Convert hex to rgba for proper opacity
  const bgColor = isDark ? hexToRgba(color, 0.12) : hexToRgba(color, 0.08);
  const borderColor = isDark ? hexToRgba(color, 0.25) : hexToRgba(color, 0.15);

  return (
    <TouchableOpacity
      onPress={onPress}
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
            color={color}
            style={styles.backIcon}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

function RootLayoutInner() {
  const colors = useAppColors();
  const { theme } = useAppTheme(); // now inside CustomThemeProvider
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const isDark = theme === "dark";

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      headerTransparent: true,
      ...(Platform.OS === "ios" && {
        headerBlurEffect: isDark
          ? "systemThinMaterialDark"
          : "systemThinMaterialLight",
      }),
      headerBackground: () => (
        <AnimatedHeaderBackground
          scrollY={scrollY}
          colors={colors}
          isDark={isDark}
        />
      ),
      headerTitleAlign: "center" as const,
      headerTitleStyle: {
        fontWeight: "600" as const,
        fontSize: 17,
        color: colors.text,
        letterSpacing: -0.3,
      },
      headerLeft: () => (
        <BackButton
          onPress={handleBack}
          color={colors.primary}
          isDark={isDark}
          colors={colors}
        />
      ),
      headerRight: () => <HeaderActionPlaceholder />,
      headerStatusBarHeight: insets.top,
      animation: "slide_from_right" as const,
      animationDuration: 250,
      contentStyle: {
        backgroundColor: colors.background,
      },
      gestureEnabled: true,
      gestureDirection: "horizontal" as const,
      fullScreenGestureEnabled: true,
    }),
    [colors, isDark, insets.top, handleBack, scrollY],
  );

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen
          name="index"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen name="login" options={{ headerTitle: "" }} />
        <Stack.Screen name="sign-up" options={{ headerTitle: "" }} />
        <Stack.Screen name="forgot-password" options={{ headerTitle: "" }} />
        <Stack.Screen name="reset-password" options={{ headerTitle: "" }} />
        <Stack.Screen name="success" options={{ headerTitle: "Success" }} />
        <Stack.Screen
          name="verify-email"
          options={{ headerTitle: "Verify Email" }}
        />

        {/* <Stack.Screen
          name="doctor/[id]"
          options={{ headerTitle: "Doctor Profile" }}
        />
        <Stack.Screen
          name="booking/[doctorId]"
          options={{ headerTitle: "Book Appointment" }}
        />
        <Stack.Screen
          name="booking/confirm"
          options={{ headerTitle: "Confirm Booking", headerBackVisible: false }}
        /> */}
      </Stack>
    </>
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
    headerRightPlaceholder: {
      width: 52,
    },
  });
