import {
  AppButton,
  AppContainer,
  AppInput,
  AppOTPInput,
} from "@/components/ui";
import {
  forgetPasswordSchema,
  resetPasswordOtpSchema,
} from "@/schemas/auth.schema";
import { getRemainingSeconds, otpTimerState } from "@/store/otpTimerStore";
import useAppColors from "@/theme/useAppColors";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Card, TextInput } from "react-native-paper";
import { useComputed } from "@legendapp/state/react";
import { authClient } from "@/lib/auth-client";

const RESEND_COOLDOWN_MS = 60_000;

export default function ResetPasswordScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [isPending, setIsPending] = useState(false);

  const params = useLocalSearchParams();
  const email = Array.isArray(params.email)
    ? params.email[0]
    : (params.email ?? "");

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email, password: "", otp: "" });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    otp?: string;
    general?: string;
  }>({});

  const displaySeconds = useComputed(() => getRemainingSeconds(email));

  // Sync email into form if it arrives late from params
  useEffect(() => {
    if (email) setForm((prev) => ({ ...prev, email }));
  }, [email]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const updateField = useCallback(
    (field: keyof typeof form) => (text: string) => {
      setForm((prev) => ({ ...prev, [field]: text }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
      if (errors.general)
        setErrors((prev) => ({ ...prev, general: undefined }));
    },
    [errors],
  );

  const handleResendOtp = async () => {
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

    const { error } = await authClient.emailOtp.requestPasswordReset({
      email: form.email,
    });

    setIsPending(false);

    if (error) {
      setErrors({ general: error.message ?? "Failed to resend OTP." });
      return;
    }
    otpTimerState.timers[email].set({
      expiresAt: Date.now() + RESEND_COOLDOWN_MS,
    });
  };

  const handleResetPassword = async () => {
    setErrors({});
    const result = resetPasswordOtpSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);

    const { error } = await authClient.emailOtp.resetPassword({
      email: form.email,
      otp: form.otp,
      password: form.password,
    });

    setIsPending(false);

    if (error) {
      setErrors({ general: error.message ?? "Failed to reset password." });
      return;
    }
    otpTimerState.timers[email].set({ expiresAt: null });
    router.replace("/(app)/home");
  };

  const seconds = displaySeconds.get();
  const isCoolingDown = seconds !== null && seconds > 0;
  const canResend = !isCoolingDown && !isPending;

  const resendLabel = isPending
    ? "Sending…"
    : isCoolingDown
      ? `Resend in ${formatTime(seconds!)}`
      : "Resend Code";

  const isFormValid = form.password.length >= 8 && form.otp.length === 6;

  return (
    <AppContainer contentStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <TextInput.Icon
                    icon="shield-check"
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.title}>Reset Password</Text>
                <View style={styles.emailContainer}>
                  <Text style={styles.subtitle}>
                    Enter the 6-digit code sent to{" "}
                    <Text style={styles.emailHighlight}>{email}</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.editButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editLink}>Change email</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* General Error */}
                {errors.general && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{errors.general}</Text>
                  </View>
                )}

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <AppInput
                    label="New Password"
                    value={form.password}
                    secureTextEntry={!showPassword}
                    onChangeText={updateField("password")}
                    autoComplete="new-password"
                    error={errors.password}
                    left={<TextInput.Icon icon="lock-outline" size={20} />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword((prev) => !prev)}
                        size={20}
                      />
                    }
                  />
                  {errors.password && (
                    <Text style={styles.fieldError}>{errors.password}</Text>
                  )}
                </View>

                {/* OTP Input */}
                <View style={styles.otpSection}>
                  <Text style={styles.otpLabel}>Verification Code</Text>
                  <View style={styles.otpWrapper}>
                    <AppOTPInput
                      length={6}
                      value={form.otp}
                      onChange={updateField("otp")}
                      disabled={isPending}
                    />
                  </View>
                  {errors.otp && (
                    <Text style={styles.fieldError}>{errors.otp}</Text>
                  )}
                </View>

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

                {/* Reset Button */}
                <AppButton
                  title="Reset Password"
                  onPress={handleResetPassword}
                  loading={isPending}
                  disabled={isPending || !isFormValid}
                  style={styles.resetButton}
                  contentStyle={styles.resetButtonContent}
                />
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
      paddingVertical: 24,
    },
    card: {
      borderRadius: 20,
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
      backgroundColor: colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 12,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    emailContainer: {
      alignItems: "center",
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 22,
    },
    emailHighlight: {
      fontWeight: "700",
      color: colors.primary,
    },
    editButton: {
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    editLink: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    form: {
      gap: 20,
    },
    inputGroup: {
      gap: 6,
    },
    fieldError: {
      color: colors.error,
      fontSize: 12,
      marginLeft: 4,
      fontWeight: "500",
    },
    errorBanner: {
      backgroundColor: colors.error + "15",
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
      marginBottom: 4,
    },
    errorBannerText: {
      color: colors.error,
      fontSize: 14,
      fontWeight: "500",
    },
    otpSection: {
      gap: 10,
    },
    otpLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 4,
    },
    otpWrapper: {
      alignItems: "center",
    },
    resendContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: -4,
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
      fontWeight: "700",
      color: colors.primary,
    },
    resendTextDisabled: {
      color: colors.textSecondary || "#999",
      fontWeight: "600",
    },
    resetButton: {
      borderRadius: 12,
      marginTop: 4,
    },
    resetButtonContent: {
      height: 52,
    },
  });
