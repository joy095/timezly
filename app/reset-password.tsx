import {
  AppButton,
  AppContainer,
  AppInput,
  AppOTPInput,
} from "@/components/ui";
import { useForgetPassword, useResetPasswordOtp } from "@/hooks/useAuth";
import {
  forgetPasswordSchema,
  resetPasswordOtpSchema,
} from "@/schemas/auth.schema";
import { getRemainingSeconds, otpTimerState } from "@/store/otpTimerStore";
import useAppColors from "@/theme/useAppColors";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card, TextInput } from "react-native-paper";
import { useComputed } from "@legendapp/state/react";

const RESEND_COOLDOWN_MS = 60_000;

export default function ResetPasswordScreen() {
  const colors = useAppColors();
  const styles = getStyles(colors);

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

  const resetPasswordMutation = useResetPasswordOtp();
  const forgetPasswordMutation = useForgetPassword();

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

    try {
      await forgetPasswordMutation.mutateAsync(form);
      // ✅ Write directly to Legend State observable
      otpTimerState.timers[email].set({
        expiresAt: Date.now() + RESEND_COOLDOWN_MS,
      });
    } catch (err: any) {
      setErrors({ general: err?.message ?? "Failed to resend OTP." });
    }
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

    try {
      await resetPasswordMutation.mutateAsync(form);
      // ✅ Clear the timer on success
      otpTimerState.timers[email].set({ expiresAt: null });
      router.push("/success");
    } catch (err: any) {
      setErrors({ general: err?.message ?? "Failed to reset password." });
    }
  };

  const seconds = displaySeconds.get();

  const isCoolingDown = seconds !== null && seconds > 0;

  const canResend = !isCoolingDown && !forgetPasswordMutation.isPending;

  const resendLabel = forgetPasswordMutation.isPending
    ? "Sending…"
    : isCoolingDown
      ? `Resend in ${formatTime(seconds!)}`
      : "Resend OTP";

  return (
    <AppContainer contentStyle={styles.containerCenter}>
      <Card>
        <Card.Content>
          <Text style={styles.title}>Check your email</Text>
          <View style={{ alignItems: "center", marginTop: 6 }}>
            <Text style={styles.subtitle}>
              We sent a 6-digit OTP to{" "}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.editLink}>Wrong email? Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <AppInput
              label="New Password"
              value={form.password}
              secureTextEntry={!showPassword}
              onChangeText={updateField("password")}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye" : "eye-off"}
                  onPress={() => setShowPassword((prev) => !prev)}
                  size={18}
                />
              }
              error={errors.password}
            />
            {errors.password && (
              <Text style={styles.error}>{errors.password}</Text>
            )}

            <AppOTPInput
              length={6}
              value={form.otp}
              onChange={updateField("otp")}
            />
            {errors.otp && <Text style={styles.error}>{errors.otp}</Text>}
            {errors.general && (
              <Text style={styles.error}>{errors.general}</Text>
            )}

            <View style={styles.resendContainer}>
              <Text style={styles.resendLabel}>
                Haven&#39;t got the email yet?
              </Text>
              <TouchableOpacity onPress={handleResendOtp} disabled={!canResend}>
                <Text style={[styles.link, !canResend && styles.linkDisabled]}>
                  {resendLabel}
                </Text>
              </TouchableOpacity>
            </View>

            <AppButton
              title="Reset Password"
              onPress={handleResetPassword}
              loading={resetPasswordMutation.isPending}
              disabled={resetPasswordMutation.isPending}
            />
          </View>
        </Card.Content>
      </Card>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    containerCenter: { justifyContent: "center" },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 8,
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
      fontWeight: "500",
    },
    editLink: {
      color: colors.primary,
      marginTop: 4,
      textDecorationLine: "underline",
      fontWeight: "500",
    },
    emailHighlight: {
      fontWeight: "600",
      color: colors.primary,
    },
    form: {
      marginTop: 16,
      gap: 4,
    },
    resendContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 16,
    },
    resendLabel: { color: colors.text, fontSize: 14 },
    link: {
      color: colors.primary,
      textDecorationLine: "underline",
      fontWeight: "600",
      fontSize: 14,
    },
    linkDisabled: { opacity: 0.45 },
    progressFill: { height: "100%", borderRadius: 4 },
    error: { color: colors.error, fontSize: 12, marginBottom: 6 },
  });
