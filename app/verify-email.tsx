import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "react-native-paper";
import { verifyEmailOtpSchema } from "@/schemas/auth.schema";
import { AppButton, AppContainer, AppOTPInput } from "@/components/ui";
import useAppColors from "@/theme/useAppColors";
import { authClient } from "@/lib/auth-client";

const RESEND_COOLDOWN = 60; // seconds

export default function EmailVerifyScreen() {
  const router = useRouter();
  const colors = useAppColors();

  const styles = useMemo(() => getStyles(colors), [colors]);

  const params = useLocalSearchParams();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [isPending, setIsPending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const [form, setForm] = useState<{
    email: string;
    otp: string;
  }>({
    email: email || "",
    otp: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    general?: string;
  }>({});

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const updateField = useCallback(
    (field: keyof typeof form) => (text: string) => {
      setForm((prev) => ({ ...prev, [field]: text }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      // Clear general error when user types
      if (errors.general) {
        setErrors((prev) => ({ ...prev, general: undefined }));
      }
    },
    [errors],
  );

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !form.email) return;

    setIsResending(true);
    setErrors({});

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: form.email,
      type: "email-verification",
    });

    setIsResending(false);

    if (error) {
      setErrors({ general: error.message ?? "Failed to resend code" });
      return;
    }

    // Start cooldown
    setResendTimer(RESEND_COOLDOWN);
  };

  const handleVerifyEmail = async () => {
    setErrors({});

    const result = verifyEmailOtpSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });

      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);

    const { error } = await authClient.emailOtp.verifyEmail({
      email: form.email,
      otp: form.otp,
    });

    setIsPending(false);

    if (error) {
      setErrors({ general: error.message ?? "Email verification failed" });
      return;
    }

    // Success - navigate to next screen
    router.push({
      pathname: "/success",
      params: {
        title: "Email Verified 🎉",
        message: "Your email has been successfully verified.",
        buttonText: "Go to Login",
        redirectTo: "/login",
      },
    });
  };

  const canResend = resendTimer === 0 && !isResending;
  const resendLabel = isResending
    ? "Sending..."
    : resendTimer > 0
      ? `Resend in ${resendTimer}s`
      : "Resend code";

  return (
    <AppContainer contentStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                We&#39;ve sent a 6-digit verification code to
              </Text>
              <Text style={styles.emailHighlight}>{email}</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* OTP Input */}
              <View style={styles.otpWrapper}>
                <AppOTPInput
                  length={6}
                  value={form.otp}
                  onChange={updateField("otp")}
                  disabled={isPending}
                />
              </View>

              {/* Error Messages */}
              {errors.otp && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.otp}</Text>
                </View>
              )}

              {errors.general && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              )}

              {/* Verify Button */}
              <AppButton
                title="Verify Email"
                onPress={handleVerifyEmail}
                loading={isPending}
                disabled={isPending || form.otp.length !== 6}
                style={styles.verifyButton}
              />

              {/* Resend Section */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendHint}>
                  Didn&#39;t receive the code?
                </Text>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={!canResend}
                  activeOpacity={0.7}
                  style={styles.resendButton}
                >
                  <Text
                    style={[
                      styles.resendText,
                      !canResend && styles.resendTextDisabled,
                    ]}
                  >
                    {resendLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card.Content>
        </Card>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    keyboardView: {
      flex: 1,
      justifyContent: "center",
    },
    card: {
      borderRadius: 16,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      backgroundColor: colors.surface,
    },
    cardContent: {
      padding: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 12,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 20,
    },
    emailHighlight: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.primary,
      marginTop: 4,
      textAlign: "center",
    },
    form: {
      width: "100%",
    },
    otpWrapper: {
      alignItems: "center",
      marginBottom: 20,
    },
    errorContainer: {
      backgroundColor: colors.error + "15", // 15 = ~8% opacity in hex
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 16,
      borderLeftWidth: 3,
      borderLeftColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: "500",
    },
    verifyButton: {
      marginTop: 8,
      borderRadius: 12,
      height: 50,
    },
    resendContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
      gap: 6,
    },
    resendHint: {
      fontSize: 14,
      color: colors.textSecondary || colors.text,
    },
    resendButton: {
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    resendText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    resendTextDisabled: {
      color: colors.textSecondary || "#999",
      fontWeight: "500",
    },
  });
