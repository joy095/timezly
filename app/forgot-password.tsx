import { AppButton, AppContainer, AppInput } from "@/components/ui";
import { useForgetPassword } from "@/hooks/useAuth";
import { forgetPasswordSchema } from "@/schemas/auth.schema";
import useAppColors from "@/theme/useAppColors";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "react-native-paper";

export default function ForgetPasswordScreen() {
  const colors = useAppColors();

  const styles = getStyles(colors);

  const params = useLocalSearchParams(); // Getting email form query params
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const [form, setForm] = useState<{
    email: string;
  }>({
    email: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    general?: string;
  }>({});

  useEffect(() => {
    if (email) {
      setForm({ email });
    }
  }, [email]);

  const forgetPasswordMutation = useForgetPassword();

  const handleForgetPassword = async () => {
    setErrors({});

    const result = forgetPasswordSchema.safeParse(form);

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
      await forgetPasswordMutation.mutateAsync(form);
      router.push({
        pathname: "/reset-password",
        params: { email: form.email },
      });
    } catch (err: any) {
      console.log(err);
      setErrors({
        general: err?.message || "OTP Send failed.",
      });
    }
  };

  return (
    <AppContainer contentStyle={styles.containerCenter}>
      <Card >
        <Card.Content>
          <Text style={styles.title}>Forgot password </Text>

          <Text style={styles.subtitle}>
            Please entre your email to reset the password
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

            {errors.general && (
              <Text style={styles.error}>{errors.general}</Text>
            )}

            <AppButton
              title="Reset password"
              onPress={handleForgetPassword}
              loading={forgetPasswordMutation.isPending}
              disabled={forgetPasswordMutation.isPending}
            />
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

    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 16,
      color: colors.text,
    },

    subtitle: {
      marginTop: 6,
      fontSize: 14,
      color: colors.text,
    },

    form: {
      marginTop: 16,
    },

    error: {
      color: colors.error,
      marginBottom: 10,
    },
  });
