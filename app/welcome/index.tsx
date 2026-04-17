// app/welcome/index.tsx
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAppColors from "@/theme/useAppColors";
import { useAppTheme } from "@/theme/ThemeContext";
import { authStore$ } from "@/stores/authStore";
import { observer } from "@legendapp/state/react";
import { ThemeToggle } from "@/components/ThemeToggle";

const { width, height } = Dimensions.get("window");

export default observer(function TabLayout() {
  const colors = useAppColors();
  const { theme } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const session = authStore$.session.get();
  const isDark = theme === "dark";

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.stagger(150, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const handleSkip = () => {
    // Go to app as guest (limited features)
    router.replace("/(user-tabs)");
  };

  const handleSignUp = () => {
    router.push("/(auth)/sign-up");
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient Effect */}
      <View
        style={[
          styles.gradientOrb,
          {
            backgroundColor: colors.primary,
            opacity: isDark ? 0.15 : 0.08,
            top: height * 0.1,
            right: -width * 0.3,
          },
        ]}
      />
      <View
        style={[
          styles.gradientOrb,
          {
            backgroundColor: colors.secondary,
            opacity: isDark ? 0.1 : 0.06,
            bottom: height * 0.2,
            left: -width * 0.4,
          },
        ]}
      />

      <ThemeToggle />

      {/* Skip Button - Top Right */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 16 }]}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={colors.textMuted}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo/Icon */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: colors.primary + "20", // 20% opacity
            },
          ]}
        >
          <Ionicons name="medical" size={64} color={colors.primary} />
        </Animated.View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          Your Health
          <Text style={{ color: colors.primary }}> Companion</Text>
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Book appointments, track your health, and connect with trusted medical
          professionals—all in one place.
        </Text>

        {/* Feature Pills */}
        <View style={styles.features}>
          {["Easy Booking", "Secure", "24/7 Support"].map((feature, i) => (
            <View
              key={feature}
              style={[
                styles.pill,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.success}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Bottom Actions */}
      <Animated.View
        style={[
          styles.actions,
          {
            opacity: fadeAnim,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Primary: Get Started */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleSignUp}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        {/* Secondary: Already have account */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: colors.textMuted }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  gradientOrb: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  skipButton: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    zIndex: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: 32,
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  loginText: {
    fontSize: 15,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: "700",
  },
});
