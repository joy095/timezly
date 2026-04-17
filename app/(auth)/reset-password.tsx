import {
  AppButton,
  AppContainer,
  AppInput,
  AppOTPInput,
} from "@/components/ui";
import {
  resetPasswordOtpSchema,
  ResetPasswordOtpInput,
} from "@/schemas/auth.schema";
import { getRemainingSeconds, otpTimerState } from "@/stores/otpTimerStore";
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
  ActivityIndicator,
} from "react-native";
import { Card, TextInput } from "react-native-paper";
import { useComputed } from "@legendapp/state/react";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@/hooks/useForm";

const RESEND_COOLDOWN_MS = 60_000;

export default function ResetPasswordScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");

  const params = useLocalSearchParams();
  const email = Array.isArray(params.email)
    ? params.email[0]
    : (params.email ?? "");

  const { register, handleSubmit, errors, setValue, getValues, setFocus } =
    useForm<ResetPasswordOtpInput>({
      schema: resetPasswordOtpSchema,
      defaultValues: { email, password: "", otp: "" },
      mode: "onBlur",
    });

  const passwordField = register("password");

  // Sync email into form if it arrives late from params
  useEffect(() => {
    if (email) setValue("email", email);
  }, [email, setValue]);

  const displaySeconds = useComputed(() => getRemainingSeconds(email));

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Stable OTP handler — not tied to any error state
  const handleOtpChange = useCallback(
    (val: string) => {
      setOtpValue(val);
      setValue("otp", val);
    },
    [setValue],
  );

  const handleResendOtp = async () => {
    const currentEmail = getValues().email ?? email;
    if (!currentEmail) return;

    setGeneralError(null);
    setIsResending(true);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: currentEmail,
        type: "forget-password",
      });

      if (error) {
        setGeneralError(error.message ?? "Failed to resend code");
        return;
      }

      otpTimerState.timers[currentEmail].set({
        expiresAt: Date.now() + RESEND_COOLDOWN_MS,
      });
    } catch {
      setGeneralError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: ResetPasswordOtpInput) => {
    setGeneralError(null);
    setIsPending(true);

    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email: data.email,
        otp: data.otp,
        password: data.password,
      });

      if (error) {
        setGeneralError(error.message ?? "Failed to reset password");
        return;
      }

      otpTimerState.timers[data.email].set({ expiresAt: null });

      router.replace({
        pathname: "/login",
        params: {
          email: data.email,
          message:
            "Password reset successful! Please sign in with your new password.",
        },
      });
    } catch {
      setGeneralError("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const onInvalid = (
    formErrors: Partial<Record<keyof ResetPasswordOtpInput, string>>,
  ) => {
    const first = Object.keys(formErrors)[0] as keyof ResetPasswordOtpInput;
    if (first && first !== "otp") setFocus(first);
  };

  const seconds = displaySeconds.get();
  const isCoolingDown = seconds !== null && seconds > 0;
  const canResend = !isCoolingDown && !isResending && !isPending;

  const resendLabel = isResending
    ? "Sending..."
    : isCoolingDown
      ? `Resend in ${formatTime(seconds!)}`
      : "Resend Code";

  const isFormValid =
    getValues().password?.length >= 8 && otpValue.length === 6;

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
                    icon="lock-reset"
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.title}>Create New Password</Text>
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
                    <Text style={styles.editLink}>Use different email</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* General Error */}
                {generalError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{generalError}</Text>
                  </View>
                )}

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <AppInput
                    label="New Password"
                    ref={passwordField.ref}
                    onChangeText={passwordField.onChangeText}
                    onBlur={passwordField.onBlur}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    passwordRules="minlength: 8; required: lower; required: upper; required: digit;"
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
                  {errors.password ? (
                    <Text style={styles.fieldError}>{errors.password}</Text>
                  ) : (
                    <Text style={styles.hint}>
                      Must be at least 8 characters
                    </Text>
                  )}
                </View>

                {/* OTP Input */}
                <View style={styles.otpSection}>
                  <Text style={styles.otpLabel}>Verification Code</Text>
                  <View style={styles.otpWrapper}>
                    <AppOTPInput
                      length={6}
                      value={otpValue}
                      onChange={handleOtpChange}
                      disabled={isPending}
                    />
                  </View>
                  {errors.otp && (
                    <Text style={styles.fieldError}>{errors.otp}</Text>
                  )}
                </View>

                {/* Resend Section */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendHint}>Didn&#39;t receive it?</Text>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={!canResend}
                    activeOpacity={0.7}
                    style={styles.resendButton}
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text
                        style={[
                          styles.resendText,
                          !canResend && styles.resendTextDisabled,
                        ]}
                      >
                        {resendLabel}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Reset Button */}
                <AppButton
                  title="Reset Password"
                  onPress={handleSubmit(onSubmit, onInvalid)}
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
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      marginTop: 80,
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
    cardContent: { padding: 28 },
    header: { alignItems: "center", marginBottom: 28 },
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
    emailContainer: { alignItems: "center" },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 22,
    },
    emailHighlight: { fontWeight: "700", color: colors.primary },
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
    form: { gap: 20 },
    inputGroup: { gap: 6 },
    fieldError: {
      color: colors.error,
      fontSize: 12,
      marginLeft: 4,
      fontWeight: "500",
    },
    hint: {
      color: colors.textSecondary || "#999",
      fontSize: 12,
      marginLeft: 4,
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
    otpSection: { gap: 10 },
    otpLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 4,
    },
    otpWrapper: { alignItems: "center" },
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
      minWidth: 80,
      alignItems: "center",
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
    resetButton: { borderRadius: 12, marginTop: 4 },
    resetButtonContent: { height: 52 },
  });
