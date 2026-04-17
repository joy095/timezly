import { AppButton, AppInput, AppContainer } from "@/components/ui";
import { signUpSchema, SignUpInput } from "@/schemas/auth.schema";
import useAppColors from "@/theme/useAppColors";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Card, TextInput, Divider } from "react-native-paper";
import { signIn, signUp } from "@/lib/auth-client";
import { Image } from "expo-image";
import { getCallbackURL } from "@/utils";
import { useForm } from "@/hooks/useForm";

export default function SignUpScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // FORM
  const { register, handleSubmit, errors, setFocus, getValues, setValue } =
    useForm<SignUpInput>({
      schema: signUpSchema,
      defaultValues: {
        name: "",
        email: "",
        password: "",
      },
    });

  const nameField = register("name");
  const emailField = register("email");
  const passwordField = register("password");

  // Prefill email
  useEffect(() => {
    const emailParam = Array.isArray(params.email)
      ? params.email[0]
      : params.email;

    if (emailParam) {
      setValue("email", emailParam);
    }
  }, [params.email, setValue]);

  const onSubmit = async (data: SignUpInput) => {
    setGeneralError(null);
    setIsPending(true);

    try {
      const { error } = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (error) {
        setGeneralError(error.message ?? "Sign up failed. Please try again.");
        return;
      }

      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: data.email },
      });
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const onInvalid = (
    formErrors: Partial<Record<keyof SignUpInput, string>>,
  ) => {
    const first = Object.keys(formErrors)[0] as keyof SignUpInput;
    if (first) setFocus(first);
  };

  const handleLoginWithGoogle = async () => {
    setIsGoogleLoading(true);
    setGeneralError(null);

    try {
      const { error } = await signIn.social({
        provider: "google",
        callbackURL: getCallbackURL(),
      });

      if (error) {
        setGeneralError(
          error.message ?? "Google sign in failed. Please try again.",
        );
      }
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.navigate({
      pathname: "/(auth)/login",
      params: { email: getValues().email },
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
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Join us and start your journey today
                </Text>
              </View>

              {/* Google */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleLoginWithGoogle}
                disabled={isGoogleLoading || isPending}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#333" />
                ) : (
                  <>
                    <View style={styles.googleIconContainer}>
                      <Image
                        style={styles.image}
                        source={require("@/assets/images/google.png")}
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
                {generalError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{generalError}</Text>
                  </View>
                )}

                {/* Name */}
                <View style={styles.inputGroup}>
                  <AppInput
                    label="Full Name"
                    ref={nameField.ref}
                    onChangeText={nameField.onChangeText}
                    onBlur={nameField.onBlur}
                    autoCapitalize="words"
                    autoComplete="name"
                    error={errors.name}
                    left={<TextInput.Icon icon="account-outline" size={20} />}
                  />
                  {errors.name && (
                    <Text style={styles.fieldError}>{errors.name}</Text>
                  )}
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <AppInput
                    label="Email Address"
                    ref={emailField.ref}
                    onChangeText={emailField.onChangeText}
                    onBlur={emailField.onBlur}
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

                {/* Password */}
                <View style={styles.inputGroup}>
                  <AppInput
                    label="Password"
                    ref={passwordField.ref}
                    onChangeText={passwordField.onChangeText}
                    onBlur={passwordField.onBlur}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    error={errors.password}
                    left={<TextInput.Icon icon="lock-outline" size={20} />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword((p) => !p)}
                        size={20}
                      />
                    }
                  />
                  {errors.password && (
                    <Text style={styles.fieldError}>{errors.password}</Text>
                  )}
                </View>

                {/* Submit */}
                <AppButton
                  title="Create Account"
                  onPress={handleSubmit(onSubmit, onInvalid)}
                  loading={isPending}
                  disabled={isPending || isGoogleLoading}
                  style={styles.signUpButton}
                  contentStyle={styles.signUpButtonContent}
                />

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={navigateToLogin}>
                    <Text style={styles.loginLink}>Sign In</Text>
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
      marginBottom: 24,
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
    signUpButton: {
      borderRadius: 12,
      marginTop: 8,
    },
    signUpButtonContent: {
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
    loginLink: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
