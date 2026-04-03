import { AppButton, AppContainer, AppInput } from "@/components/ui";
import useAppColors from "@/theme/useAppColors";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, TextInput } from "react-native-paper";
import { useLogin } from "@/hooks/useAuth";
import { loginSchema } from "@/schemas/auth.schema";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useAppColors();

  const styles = getStyles(colors);

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<{
    email: string;
    password: string;
  }>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    rememberMe?: string;
    general?: string;
  }>({});

  const loginMutation = useLogin();

  const handleLogin = async () => {
    setErrors({});

    const result = loginSchema.safeParse(form);

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
      await loginMutation.mutateAsync(form);
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
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>
            Don&#39;t have an account?{" "}
            <Text
              style={styles.link}
              accessibilityRole="link"
              onPress={() =>
                router.replace({
                  pathname: "/sign-up",
                  params: { email: form.email },
                })
              }
            >
              Sign Up
            </Text>
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

            {/* Password */}
            <AppInput
              label="Password"
              value={form.password}
              secureTextEntry={!showPassword}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, password: text }))
              }
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

            {errors.general && (
              <Text style={styles.error}>{errors.general}</Text>
            )}

            <Text
              style={[styles.link, styles.forget]}
              onPress={() =>
                router.push({
                  pathname: "/forgot-password",
                  params: { email: form.email },
                })
              }
            >
              Forgot password?
            </Text>
            <AppButton
              title="Login"
              onPress={handleLogin}
              loading={loginMutation.isPending}
              disabled={loginMutation.isPending}
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

    link: {
      color: colors.primary,
    },

    form: {
      marginTop: 16,
    },

    forget: {
      display: "flex",
      flexDirection: "row-reverse",
    },

    error: {
      color: colors.error,
      marginBottom: 10,
    },
  });
