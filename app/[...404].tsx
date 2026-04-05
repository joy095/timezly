import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppContainer } from "@/components/ui";

const { width, height } = Dimensions.get("window");

export default function NotFoundScreen() {
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous floating animation for the 404 number
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 20,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Subtle rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <AppContainer style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Animated Background Gradient */}
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative rotating circles */}
      <Animated.View
        style={[
          styles.circle,
          styles.circle1,
          { transform: [{ rotate: spin }] },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          styles.circle2,
          { transform: [{ rotate: spin }] },
        ]}
      />

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Floating 404 Number */}
        <Animated.View
          style={[
            styles.numberContainer,
            { transform: [{ translateY: floatAnim }] },
          ]}
        >
          <Text style={styles.number}>404</Text>
          <View style={styles.glitchEffect} />
        </Animated.View>

        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="planet-outline" size={80} color="#fff" />
        </View>

        {/* Message */}
        <Text style={styles.title}>Lost in Space?</Text>
        <Text style={styles.subtitle}>
          The page you&#39;re looking for seems to have drifted into another
          dimension.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("/")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#4776E6", "#8E54E9"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name="home-outline"
                size={20}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Go Home</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back-outline"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Stars Background Effect */}
      <View style={styles.starsContainer}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                top: Math.random() * height,
                left: Math.random() * width,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                opacity: Math.random() * 0.8 + 0.2,
              },
            ]}
          />
        ))}
      </View>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0c29",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  circle1: {
    width: 400,
    height: 400,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 300,
    height: 300,
    bottom: -50,
    left: -50,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    zIndex: 10,
  },
  numberContainer: {
    position: "relative",
    marginBottom: 20,
  },
  number: {
    fontSize: 120,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(142, 84, 233, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: -5,
  },
  glitchEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    transform: [{ translateX: 5 }, { translateY: 5 }],
    opacity: 0.5,
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 300,
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  primaryButton: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#4776E6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 100,
  },
});
