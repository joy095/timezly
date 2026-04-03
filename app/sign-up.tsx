import { AppButton, AppInput, AppContainer } from "@/components/ui";
import { signUpSchema } from "@/schemas/auth.schema";
import useAppColors from "@/theme/useAppColors";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, TextInput } from "react-native-paper";
import { useSignUp } from "../hooks/useAuth";

export default function SignUpScreen() {
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const colors = useAppColors();

  const styles = getStyles(colors);

  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    rememberMe: boolean;
  }>({
    name: "",
    email: "",
    password: "",
    rememberMe: true,
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const signUpMutation = useSignUp();

  const handleSignup = () => {
    const result = signUpSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: any = {};

      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    signUpMutation.mutate(form, {
      onSuccess: () => {
        router.replace({
          pathname: "/verify-email",
          params: { email: form.email },
        });
      },
      onError: (error: any) => {
        if (error?.message?.includes("Account already exists")) {
          router.replace({
            pathname: "/login",
            params: { email: form.email },
          });
        } else {
          setErrors({
            email: error?.message || "Sign up failed. Please try again.",
          });
        }
      },
    });
  };

  return (
    <AppContainer contentStyle={styles.containerCenter}>
      <Card>
        <Card.Content>
          <Text style={styles.title}>Sign up</Text>

          <Text style={styles.subtitle}>
            Already have an account?{" "}
            <Text
              style={styles.link}
              onPress={() =>
                router.replace({
                  pathname: "/login",
                  params: { email: form.email },
                })
              }
            >
              Login
            </Text>
          </Text>

          <View style={styles.form}>
            {/* Name */}
            <AppInput
              label="Name"
              value={form.name}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, name: text }))
              }
              error={errors.name}
            />
            {errors.name && <Text style={styles.error}>{errors.name}</Text>}

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
                  forceTextInputFocus={false}
                  size={18}
                />
              }
              error={errors.password}
            />
            {errors.password && (
              <Text style={styles.error}>{errors.password}</Text>
            )}

            <AppButton
              title="Signup"
              onPress={handleSignup}
              loading={signUpMutation.isPending}
              disabled={signUpMutation.isPending}
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

    card: {
      padding: 20,
      borderRadius: 12,
      backgroundColor: colors.card,
      elevation: 4,
    },
    title: {
      fontSize: 24,
      marginBottom: 12,
      fontWeight: "bold",
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

    error: {
      color: colors.error,
      marginBottom: 10,
    },
  });
