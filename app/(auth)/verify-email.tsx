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
import {
  verifyEmailOtpSchema,
  VerifyEmailOtpInput,
} from "@/schemas/auth.schema";
import { AppButton, AppContainer, AppOTPInput } from "@/components/ui";
import useAppColors from "@/theme/useAppColors";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@/hooks/useForm";

const RESEND_COOLDOWN = 60;

export default function EmailVerifyScreen() {
  const router = useRouter();
  const colors = useAppColors();

  // Memoize styles to prevent recalculation
  const styles = useMemo(() => getStyles(colors), [colors]);

  const params = useLocalSearchParams();
  const email = useMemo(
    () => (Array.isArray(params.email) ? params.email[0] : params.email),
    [params.email],
  );

  // UI State
  const [isPending, setIsPending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");

  // Form hook
  const { handleSubmit, errors, setValue, getValues } =
    useForm<VerifyEmailOtpInput>({
      schema: verifyEmailOtpSchema,
      defaultValues: {
        email: email || "",
        otp: "",
      },
    });

  // Memoized handlers
  const handleOtpChange = useCallback(
    (text: string) => {
      setOtpValue(text);
      setValue("otp", text);
    },
    [setValue],
  );

  const onSubmit = useCallback(
    async (data: VerifyEmailOtpInput) => {
      setGeneralError(null);
      setIsPending(true);

      try {
        const { error } = await authClient.emailOtp.verifyEmail({
          email: data.email,
          otp: data.otp,
        });

        if (error) {
          setGeneralError(error.message ?? "Email verification failed");
          return;
        }

        router.push({
          pathname: "/success",
          params: {
            title: "Email Verified 🎉",
            message: "Your email has been successfully verified.",
            buttonText: "Go to Login",
            redirectTo: "/login",
          },
        });
      } catch {
        setGeneralError("Verification failed. Please try again.");
      } finally {
        setIsPending(false);
      }
    },
    [router],
  );

  const onInvalid = useCallback(
    (formErrors: Partial<Record<keyof VerifyEmailOtpInput, string>>) => {
      console.log("Validation errors:", formErrors);
    },
    [],
  );

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;

    const currentEmail = getValues().email;
    if (!currentEmail) return;

    setIsResending(true);
    setGeneralError(null);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: currentEmail,
        type: "email-verification",
      });

      if (error) {
        setGeneralError(error.message ?? "Failed to resend code");
        return;
      }

      setResendTimer(RESEND_COOLDOWN);
    } catch {
      setGeneralError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  }, [resendTimer, getValues]);

  // Memoized computed values
  const canResend = useMemo(
    () => resendTimer === 0 && !isResending,
    [resendTimer, isResending],
  );

  const resendLabel = useMemo(() => {
    if (isResending) return "Sending...";
    if (resendTimer > 0) return `Resend in ${resendTimer}s`;
    return "Resend code";
  }, [isResending, resendTimer]);

  const isVerifyDisabled = useMemo(
    () => isPending || otpValue.length !== 6,
    [isPending, otpValue.length],
  );

  // Effects
  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  // Memoized submit action
  const submitAction = useMemo(
    () => handleSubmit(onSubmit, onInvalid),
    [handleSubmit, onSubmit, onInvalid],
  );

  return (
    <AppContainer contentStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                We&apos;ve sent a 6-digit verification code to
              </Text>
              <Text style={styles.emailHighlight}>{email}</Text>
            </View>

            <View style={styles.form}>
              {generalError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              )}

              <View style={styles.otpWrapper}>
                <AppOTPInput
                  length={6}
                  value={otpValue}
                  onChange={handleOtpChange}
                  disabled={isPending}
                />
              </View>

              {errors.otp && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.otp}</Text>
                </View>
              )}

              <AppButton
                title="Verify Email"
                onPress={submitAction}
                loading={isPending}
                disabled={isVerifyDisabled}
                style={styles.verifyButton}
              />

              <View style={styles.resendContainer}>
                <Text style={styles.resendHint}>
                  Didn&apos;t receive the code?
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
    errorBanner: {
      backgroundColor: colors.error + "15",
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
      marginBottom: 8,
    },
    errorBannerText: {
      color: colors.error,
      fontSize: 14,
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
