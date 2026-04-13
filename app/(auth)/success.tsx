import { AppButton, AppContainer } from "@/components/ui";
import useAppColors from "@/theme/useAppColors";
import { Image } from "expo-image";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "react-native-paper";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

export default function SuccessScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const params = useLocalSearchParams();

  // Support custom messages via params
  const title = (params.title as string) || "Success!";
  const message =
    (params.message as string) ||
    "Your password has been changed successfully.";
  const buttonText = (params.buttonText as string) || "Continue";
  const redirectTo = (params.redirectTo as string) || "/login";
  const ALLOWED_REDIRECTS = ["/login", "/home", "/dashboard"] as const;

  const handleContinue = () => {
    const safeRedirect = ALLOWED_REDIRECTS.includes(redirectTo as any) 
    ? redirectTo 
    : "/login";
  router.replace(safeRedirect as Href);
  };

  return (
    <AppContainer contentStyle={styles.container}>
      <View style={styles.content}>
        <Animated.View
          entering={FadeInUp.duration(600).springify()}
          style={styles.cardWrapper}
        >
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              {/* Success Icon/Image */}
              <Animated.View
                entering={FadeIn.delay(200).duration(800)}
                style={styles.iconContainer}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: colors.success + "20" },
                  ]}
                >
                  <Image
                    style={styles.image}
                    source={require("@/assets/images/successmark.png")}
                    contentFit="contain"
                    transition={800}
                  />
                </View>
              </Animated.View>

              {/* Title */}
              <Animated.Text
                entering={FadeInUp.delay(300).duration(600)}
                style={styles.title}
              >
                {title}
              </Animated.Text>

              {/* Message */}
              <Animated.View
                entering={FadeInUp.delay(400).duration(600)}
                style={styles.messageContainer}
              >
                <Text style={styles.subtitle}>{message}</Text>
              </Animated.View>

              {/* Action Button */}
              <Animated.View
                entering={FadeInUp.delay(500).duration(600)}
                style={styles.buttonContainer}
              >
                <AppButton
                  title={buttonText}
                  onPress={handleContinue}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                />
              </Animated.View>
            </Card.Content>
          </Card>
        </Animated.View>
      </View>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    content: {
      alignItems: "center",
      width: "100%",
    },
    cardWrapper: {
      width: "100%",
      maxWidth: 380,
    },
    card: {
      borderRadius: 24,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      backgroundColor: colors.surface,
    },
    cardContent: {
      padding: 40,
      alignItems: "center",
    },
    iconContainer: {
      marginBottom: 24,
    },
    iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: colors.success,
    },
    image: {
      width: 50,
      height: 50,
      tintColor: colors.success,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 12,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    messageContainer: {
      maxWidth: 280,
      marginBottom: 32,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 24,
    },
    buttonContainer: {
      width: "100%",
    },
    button: {
      borderRadius: 12,
      width: "100%",
    },
    buttonContent: {
      height: 52,
    },
  });
