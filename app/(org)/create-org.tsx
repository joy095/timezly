import { AppButton, AppInput } from "@/components/ui";
import { useForm } from "@/hooks/useForm";
import { authClient } from "@/lib/auth-client";
import { OrgSchema, orgSchemaInput } from "@/schemas/org.schema";
import { authStore$ } from "@/stores/authStore";
import useAppColors from "@/theme/useAppColors";
import { router } from "expo-router";
import { useMemo, useState, useCallback, useRef } from "react";
import { Card, TextInput, ActivityIndicator } from "react-native-paper";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";

const normalizeSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CreateOrgScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const user = authStore$.user.get();

  const [isPending, setIsPending] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugSuggestion, setSlugSuggestion] = useState<string>("");

  const slugRef = useRef("");
  const slugCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const { register, handleSubmit, errors, setFocus, setValue } =
    useForm<orgSchemaInput>({
      schema: OrgSchema,
      defaultValues: { name: "", slug: "", userId: user?.id || "" },
    });

  // register() is now cached in useForm — these are stable object references
  const nameField = register("name");
  const slugField = register("slug");

  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }
    if (slugCheckTimeoutRef.current) clearTimeout(slugCheckTimeoutRef.current);
    slugCheckTimeoutRef.current = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const response = await authClient.organization.checkSlug({ slug });
        setSlugAvailable(response?.data?.status ?? false);
      } catch {
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 300);
  }, []); // no deps needed — only uses refs and setters

  const handleNameChange = useCallback(
    (text: string) => {
      nameField.onChangeText(text);
      setSlugSuggestion(normalizeSlug(text));
    },
    [nameField], // stable — register() caches the object
  );

  const handleSlugChange = useCallback(
    (text: string) => {
      const normalized = normalizeSlug(text);
      slugRef.current = normalized;
      slugField.onChangeText(normalized);
      checkSlugAvailability(normalized);
    },
    [slugField, checkSlugAvailability],
  );

  const applySuggestion = useCallback(() => {
    if (!slugSuggestion) return;
    slugRef.current = slugSuggestion;
    setValue("slug", slugSuggestion);
    slugField.onChangeText(slugSuggestion);
    checkSlugAvailability(slugSuggestion);
  }, [slugSuggestion, setValue, slugField, checkSlugAvailability]);

  const onSubmit = async (data: orgSchemaInput) => {
    setGeneralError(null);
    setIsPending(true);
    try {
      if (slugAvailable === false) {
        setGeneralError("This slug is already taken. Please choose another.");
        return;
      }
      const { error } = await authClient.organization.create({
        name: data.name,
        slug: data.slug,
      });
      if (error) {
        setGeneralError(error.message || "Failed to create Organization.");
        return;
      }
      router.push({ pathname: "/(clinic-tabs)/listings" });
    } catch (err: any) {
      setGeneralError(err?.message || "Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const onInvalid = (
    formErrors: Partial<Record<keyof orgSchemaInput, string>>,
  ) => {
    const first = Object.keys(formErrors)[0] as keyof orgSchemaInput;
    if (first) setFocus(first);
  };

  return (
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
            <View style={styles.header}>
              <Text style={styles.title}>Create Organization</Text>
              <Text style={styles.subtitle}>
                Set up your organization workspace
              </Text>
            </View>

            <View style={styles.form}>
              {generalError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <AppInput
                  label="Organization Name"
                  ref={nameField.ref}
                  onChangeText={handleNameChange}
                  onBlur={nameField.onBlur}
                  autoCapitalize="words"
                  autoComplete="off"
                  error={errors.name}
                  left={
                    <TextInput.Icon icon="office-building-outline" size={20} />
                  }
                />
                {errors.name && (
                  <Text style={styles.fieldError}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <AppInput
                  label="Organization Slug"
                  ref={slugField.ref}
                  onChangeText={handleSlugChange}
                  onBlur={slugField.onBlur}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                  error={
                    errors.slug ||
                    (slugAvailable === false
                      ? "Slug is already taken"
                      : undefined)
                  }
                  left={<TextInput.Icon icon="link-variant" size={20} />}
                  right={
                    isCheckingSlug ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : slugAvailable === true ? (
                      <TextInput.Icon
                        icon="check-circle"
                        color={colors.success || "green"}
                        size={20}
                      />
                    ) : slugAvailable === false ? (
                      <TextInput.Icon
                        icon="close-circle"
                        color={colors.error}
                        size={20}
                      />
                    ) : null
                  }
                />

                {slugSuggestion && !slugRef.current && (
                  <TouchableOpacity
                    onPress={applySuggestion}
                    style={styles.suggestionRow}
                  >
                    <Text style={styles.suggestionText}>
                      Suggested:{" "}
                      <Text style={styles.suggestionHighlight}>
                        {slugSuggestion}
                      </Text>
                    </Text>
                    <Text style={styles.suggestionAction}>Use this</Text>
                  </TouchableOpacity>
                )}

                {!isCheckingSlug &&
                  slugAvailable !== null &&
                  slugRef.current && (
                    <Text
                      style={[
                        styles.availabilityText,
                        slugAvailable ? styles.available : styles.unavailable,
                      ]}
                    >
                      {slugAvailable ? "✓ Available" : "✗ Already taken"}
                    </Text>
                  )}

                {errors.slug && (
                  <Text style={styles.fieldError}>{errors.slug}</Text>
                )}
              </View>

              <AppButton
                title="Create Organization"
                onPress={handleSubmit(onSubmit, onInvalid)}
                loading={isPending}
                disabled={isPending || slugAvailable === false}
                style={styles.createButton}
                contentStyle={styles.createButtonContent}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Want to go back?</Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <Text style={styles.loginLink}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: "center", marginTop: 80 },
    card: {
      borderRadius: 20,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      backgroundColor: colors.surface,
      marginHorizontal: 16,
    },
    cardContent: { padding: 28 },
    header: { alignItems: "center", marginBottom: 32 },
    title: {
      fontSize: 28,
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
    form: { gap: 16 },
    inputGroup: { gap: 6 },
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
    errorBannerText: { color: colors.error, fontSize: 14, fontWeight: "500" },
    suggestionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
      paddingHorizontal: 4,
    },
    suggestionText: { fontSize: 13, color: colors.textSecondary || "#666" },
    suggestionHighlight: { color: colors.primary, fontWeight: "600" },
    suggestionAction: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "500",
    },
    availabilityText: {
      fontSize: 12,
      marginLeft: 4,
      marginTop: 4,
      fontWeight: "500",
    },
    available: { color: colors.success || "green" },
    unavailable: { color: colors.error },
    createButton: { marginTop: 8, borderRadius: 12 },
    createButtonContent: { paddingVertical: 8 },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: 16,
    },
    footerText: { fontSize: 14, color: colors.textSecondary || "#666" },
    loginLink: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  });
