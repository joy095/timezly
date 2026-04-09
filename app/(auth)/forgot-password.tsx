import { AppButton, AppContainer, AppInput } from "@/components/ui";
import { forgetPasswordSchema } from "@/schemas/auth.schema";
import useAppColors from "@/theme/useAppColors";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Card, TextInput } from "react-native-paper";
import { authClient } from "@/lib/auth-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ForgetPasswordScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const params = useLocalSearchParams();
  const emailParam = Array.isArray(params.email)
    ? params.email[0]
    : params.email;

  const [form, setForm] = useState({ email: "" });
  const [errors, setErrors] = useState<{ email?: string; general?: string }>(
    {}
  );
  const [isPending, setIsPending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (emailParam) setForm({ email: emailParam });
  }, [emailParam]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const updateField = (text: string) => {
    setForm({ email: text });
    setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
  };

  const handleForgetPassword = async () => {
    setErrors({});
    const result = forgetPasswordSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);

    try {
      // ✅ Better-Auth: Request password reset OTP
      const { error } = await authClient.emailOtp.requestPasswordReset({
        email: form.email,
      });

      if (error) {
        setErrors({ general: error.message || "Failed to send OTP." });
        setIsPending(false);
        return;
      }

      // Start cooldown
      setCooldownSeconds(60);

      // Navigate to reset password screen
      router.push({
        pathname: "/(auth)/reset-password",
        params: { email: form.email },
      });
    } catch (err: any) {
      setErrors({
        general: err?.message || "Network error. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AppContainer contentStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              {/* Header */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <TextInput.Icon
                    icon="email-lock"
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  Forgot Password?
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Enter your email and we&#39;ll send you a{" "}
                  <Text style={[styles.highlight, { color: colors.primary }]}>
                    6-digit code
                  </Text>{" "}
                  to reset your password.
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* General Error */}
                {errors.general && (
                  <View
                    style={[
                      styles.errorBanner,
                      {
                        backgroundColor: colors.error + "15",
                        borderLeftColor: colors.error,
                      },
                    ]}
                  >
                    <Text style={[styles.errorBannerText, { color: colors.error }]}>
                      {errors.general}
                    </Text>
                  </View>
                )}

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <AppInput
                    label="Email Address"
                    value={form.email}
                    onChangeText={updateField}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    error={errors.email}
                    left={<TextInput.Icon icon="email-outline" size={20} />}
                    style={styles.input}
                  />
                  {errors.email && (
                    <Text style={[styles.fieldError, { color: colors.error }]}>
                      {errors.email}
                    </Text>
                  )}
                </View>

                {/* Reset Button */}
                <AppButton
                  title={isPending ? "Sending..." : "Send Reset Code"}
                  onPress={handleForgetPassword}
                  loading={isPending}
                  disabled={isPending || cooldownSeconds > 0}
                  style={[
                    styles.resetButton,
                    { backgroundColor: colors.primary },
                  ]}
                  contentStyle={styles.resetButtonContent}
                  labelStyle={styles.resetButtonLabel}
                />

                {/* Cooldown indicator */}
                {cooldownSeconds > 0 && (
                  <Text
                    style={[styles.cooldownText, { color: colors.textMuted }]}
                  >
                    Resend available in {formatTime(cooldownSeconds)}
                  </Text>
                )}

                {/* Back to Login */}
                <View style={styles.footer}>
                  <Text
                    style={[styles.footerText, { color: colors.textMuted }]}
                  >
                    Remember your password?
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/login")}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.footerLink, { color: colors.primary }]}
                    >
                      Back to Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    card: {
      borderRadius: 24,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      backgroundColor: colors.surface,
    },
    cardContent: {
      padding: 28,
    },
    header: {
      alignItems: "center",
      marginBottom: 28,
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      marginBottom: 12,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 8,
    },
    highlight: {
      fontWeight: "700",
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      gap: 6,
    },
    input: {
      backgroundColor: colors.surfaceVariant,
    },
    fieldError: {
      fontSize: 12,
      marginLeft: 4,
      fontWeight: "500",
    },
    errorBanner: {
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderLeftWidth: 4,
      marginBottom: 8,
    },
    errorBannerText: {
      fontSize: 14,
      fontWeight: "500",
    },
    resetButton: {
      borderRadius: 14,
      marginTop: 8,
    },
    resetButtonContent: {
      height: 54,
    },
    resetButtonLabel: {
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    cooldownText: {
      textAlign: "center",
      fontSize: 13,
      fontWeight: "500",
      marginTop: -8,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
    },
    footerText: {
      fontSize: 14,
    },
    footerLink: {
      fontSize: 14,
      fontWeight: "700",
    },
  });