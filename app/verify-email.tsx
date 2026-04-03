import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useVerifyEmailOtp } from "@/hooks/useAuth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "react-native-paper";
import { verifyEmailOtpSchema } from "@/schemas/auth.schema";
import {
  AppButton,
  AppContainer,
  AppInput,
  AppOTPInput,
} from "@/components/ui";
import useAppColors from "@/theme/useAppColors";

export default function EmailVerifyScreen() {
  const router = useRouter();
  const colors = useAppColors();

  const styles = getStyles(colors);

  const params = useLocalSearchParams(); // Getting email form query params
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [form, setForm] = useState<{
    email: string;
    otp: string;
  }>({
    email: "",
    otp: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    general?: string;
  }>({});

  const updateField = useCallback(
    (field: keyof typeof form) => (text: string) => {
      setForm((prev) => ({ ...prev, [field]: text }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [errors],
  );

  const verifyEmailOtpMutation = useVerifyEmailOtp();

  const handleVerifyEmail = async () => {
    setErrors({});

    const result = verifyEmailOtpSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: any = {};

      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });

      setErrors(fieldErrors);
      return;
    }

    try {
      await verifyEmailOtpMutation.mutateAsync(form);
      router.replace("/");
    } catch (err: any) {
      console.log(err);
      setErrors({
        general: err?.message || "Login failed",
      });
    }
  };

  return (
    <AppContainer contentStyle={styles.containerCenter}>
      <Card>
        <Card.Content>
          <Text style={styles.title}>Verify your email</Text>

          <Text style={styles.subtitle}>
            Enter the 6 digit code sent to your email
          </Text>

          <View style={styles.form}>
            {/* Email */}
            <AppInput
              label="Email"
              value={form.email}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, email: text }))
              }
              error={errors.email}
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}

            <AppOTPInput
              length={6}
              value={form.otp}
              onChange={updateField("otp")}
            />
            {errors.otp && <Text style={styles.error}>{errors.otp}</Text>}
            {errors.general && (
              <Text style={styles.error}>{errors.general}</Text>
            )}

            <AppButton
              title="Verify email"
              onPress={handleVerifyEmail}
              loading={verifyEmailOtpMutation.isPending}
              disabled={verifyEmailOtpMutation.isPending}
            />

            {/* <View style={styles.resendContainer}>
              <Text style={styles.resendLabel}>
                Haven&#39;t got the email yet?
              </Text>
              <TouchableOpacity onPress={handleResendOtp} disabled={!canResend}>
                <Text style={[styles.link, !canResend && styles.linkDisabled]}>
                  {resendLabel}
                </Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </Card.Content>
      </Card>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    containerCenter: {
      display: "flex",
      justifyContent: "center",
    },

    form: {
      marginTop: 16,
    },

    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 16,
      color: colors.text,
    },

    subtitle: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
      fontWeight: "500",
    },

    otpContainer: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 30,
    },

    resend: {
      marginTop: 20,
      color: "#007AFF",
      fontWeight: "500",
    },

    error: {
      color: colors.error,
      marginBottom: 10,
    },
  });
