import { AppButton, AppContainer, AppInput } from "@/components/ui";
import useAppColors from "@/theme/useAppColors";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  ActivityIndicator,
  Card,
  Divider,
  TextInput,
} from "react-native-paper";
import { loginSchema } from "@/schemas/auth.schema";
import { authClient } from "@/lib/auth-client";
import { Image } from "expo-image";
import * as GoogleIcon from "@/assets/images/google.svg";
import { getCallbackURL } from "@/utils";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
    general?: string;
  }>({});

  const updateField = useCallback(
    (field: keyof typeof form) => (text: string) => {
      setForm((prev) => ({ ...prev, [field]: text }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (errors.general) {
        setErrors((prev) => ({ ...prev, general: undefined }));
      }
    },
    [errors],
  );

  const handleLogin = async () => {
    setErrors({});

    const result = loginSchema.safeParse(form);

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

    const { error } = await authClient.signIn.email({
      email: form.email,
      password: form.password,
      rememberMe: true,
    });

    setIsPending(false);

    if (error) {
      setErrors({ general: error.message ?? "Login failed" });
      return;
    }

    router.replace("/(tabs)");
  };

  const handleLoginWithGoogle = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: getCallbackURL(), // Redirect after successful auth
      });

      if (error) {
        setErrors({
          general: error.message ?? "Google sign in failed. Please try again.",
        });
      }
      // Note: better-auth handles the redirect automatically on success
    } catch (err) {
      setErrors({
        general: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const navigateToSignUp = () => {
    router.navigate({
      pathname: "/sign-up",
      params: { email: form.email },
    });
  };

  const navigateToForgotPassword = () => {
    router.navigate({
      pathname: "/forgot-password",
      params: { email: form.email },
    });
  };

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
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Sign in to continue to your account
                </Text>
              </View>

              {/* Google Sign Up Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleLoginWithGoogle}
                disabled={isGoogleLoading || isPending}
                activeOpacity={0.8}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#333" />
                ) : (
                  <>
                    <View style={styles.googleIconContainer}>
                      <Image
                        style={styles.image}
                        source={GoogleIcon}
                        contentFit="contain"
                      />
                    </View>
                    <Text style={styles.googleButtonText}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.dividerText}>or sign up with email</Text>
                <Divider style={styles.divider} />
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* General Error */}
                {errors.general && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{errors.general}</Text>
                  </View>
                )}

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <AppInput
                    label="Email Address"
                    value={form.email}
                    onChangeText={updateField("email")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    error={errors.email}
                    left={<TextInput.Icon icon="email-outline" size={20} />}
                  />
                  {errors.email && (
                    <Text style={styles.fieldError}>{errors.email}</Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <AppInput
                    label="Password"
                    value={form.password}
                    secureTextEntry={!showPassword}
                    onChangeText={updateField("password")}
                    autoComplete="password"
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

                {/* Forgot Password */}
                <TouchableOpacity
                  onPress={navigateToForgotPassword}
                  style={styles.forgotPasswordContainer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>

                {/* Login Button */}
                <AppButton
                  title="Sign In"
                  onPress={handleLogin}
                  loading={isPending}
                  disabled={isPending || !form.email || !form.password}
                  style={styles.loginButton}
                  contentStyle={styles.loginButtonContent}
                />

                {/* Sign Up Link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Don&#39;t have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={navigateToSignUp}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signUpLink}>Create one</Text>
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
    cardContent: {
      padding: 28,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
    },
    image: {
      width: 25,
      height: 25,
      tintColor: colors.success,
    },
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 20,
      gap: 12,
    },
    googleIconContainer: {
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    googleButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#333",
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      gap: 12,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border || "#e0e0e0",
    },
    dividerText: {
      fontSize: 13,
      color: colors.textSecondary || "#999",
      fontWeight: "500",
    },
    form: {
      gap: 16,
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
      marginBottom: 8,
    },
    errorBannerText: {
      color: colors.error,
      fontSize: 14,
      fontWeight: "500",
    },
    forgotPasswordContainer: {
      alignSelf: "flex-end",
      marginTop: -8,
      marginBottom: 8,
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    loginButton: {
      borderRadius: 12,
      marginTop: 8,
    },
    loginButtonContent: {
      height: 52,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 24,
      gap: 4,
    },
    footerText: {
      fontSize: 15,
      color: colors.textSecondary || colors.text,
    },
    signUpLink: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
