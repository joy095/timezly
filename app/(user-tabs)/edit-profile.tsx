import { AppButton, AppInput, AppContainer } from "@/components/ui";
import {
  editProfileSchema,
  changeEmailSchema,
  changePasswordSchema,
  EditProfileInput,
  ChangeEmailInput,
  ChangePasswordInput,
} from "@/schemas/auth.schema";
import useAppColors from "@/theme/useAppColors";
import { useRouter } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Card, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { authStore$ } from "@/stores/authStore";
import { observer } from "@legendapp/state/react";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@/hooks/useForm";

// ─── Types ─────────────────────────────────────────────────────────

type Section = "profile" | "email" | "password";

interface MessageState {
  type: "success" | "error";
  text: string;
}

// ─── Component ─────────────────────────────────────────────────────

export default observer(function EditProfileTab() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const user = authStore$.user.get();
  const session = authStore$.session.get();

  // ─── Section State ─────────────────────────────────────────────

  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // ─── Profile Form ──────────────────────────────────────────────

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    errors: profileErrors,
    setFocus: setFocusProfile,
    getValues: getProfileValues,
    reset: resetProfile,
  } = useForm<EditProfileInput>({
    schema: editProfileSchema,
    defaultValues: {
      name: user?.name || "",
    },
  });

  const nameField = registerProfile("name");

  // ─── Email Form ────────────────────────────────────────────────

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    errors: emailErrors,
    setFocus: setFocusEmail,
    reset: resetEmail,
  } = useForm<ChangeEmailInput>({
    schema: changeEmailSchema,
    defaultValues: {
      email: "",
    },
  });

  const emailField = registerEmail("email");

  // ─── Password Form ─────────────────────────────────────────────

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    errors: passwordErrors,
    setFocus: setFocusPassword,
    reset: resetPassword,
  } = useForm<ChangePasswordInput>({
    schema: changePasswordSchema,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const currentPasswordField = registerPassword("currentPassword");
  const newPasswordField = registerPassword("newPassword");
  const confirmPasswordField = registerPassword("confirmPassword");

  // ─── Visibility State ────────────────────────────────────────────

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── Message Helpers ───────────────────────────────────────────

  const clearMessages = () => {
    setMessage(null);
    setError(null);
  };

  const showError = (text: string) => {
    setMessage(null);
    setError(text);
  };

  const showSuccess = (text: string) => {
    setError(null);
    setMessage({ type: "success", text });
  };

  // ─── Handlers ────────────────────────────────────────────────────

  const onSaveProfile = async (data: EditProfileInput) => {
    clearMessages();
    setIsSaving(true);

    const { error: apiError } = await authClient.updateUser({
      name: data.name,
    });

    setIsSaving(false);
    if (apiError) {
      showError(apiError.message || "Failed to update profile");
      return;
    }

    // updateUser returns { status: true }, not user data
    authStore$.user.set((prev) => ({
      ...prev,
      name: data.name,
    }));
    resetProfile({ name: data.name });
    showSuccess("Profile updated successfully");
  };

  const onInvalidProfile = (
    formErrors: Partial<Record<keyof EditProfileInput, string>>,
  ) => {
    const first = Object.keys(formErrors)[0] as keyof EditProfileInput;
    if (first) setFocusProfile(first);
  };

  const onChangeEmail = async (data: ChangeEmailInput) => {
    clearMessages();
    setIsSaving(true);

    const { error: apiError } = await authClient.changeEmail({
      newEmail: data.email,
      callbackURL: "/(user-tabs)/profile",
    });

    setIsSaving(false);
    if (apiError) {
      showError(apiError.message || "Failed to change email");
      return;
    }

    setEmailChanged(true);
    resetEmail();
    showSuccess(`Verification sent to ${data.email}`);
  };

  const onInvalidEmail = (
    formErrors: Partial<Record<keyof ChangeEmailInput, string>>,
  ) => {
    const first = Object.keys(formErrors)[0] as keyof ChangeEmailInput;
    if (first) setFocusEmail(first);
  };

  const onChangePassword = async (data: ChangePasswordInput) => {
    clearMessages();
    setIsSaving(true);
    setGeneralError(null);

    // Use authClient.changePassword (requires better-auth plugin or custom endpoint)
    const { error } = await (authClient as any).changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    setIsSaving(false);

    if (error) {
      setGeneralError(error.message ?? "Failed to change password");
      return;
    }

    resetPassword();
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    showSuccess("Password changed successfully");
  };

  const onInvalidPassword = (
    formErrors: Partial<Record<keyof ChangePasswordInput, string>>,
  ) => {
    const first = Object.keys(formErrors)[0] as keyof ChangePasswordInput;
    if (first) setFocusPassword(first);
  };

  const handleRequestPasswordReset = useCallback(async () => {
    clearMessages();

    if (!user?.email) {
      showError("No email associated with account");
      return;
    }

    setIsSaving(true);
    const { error: apiError } = await authClient.requestPasswordReset({
      email: user.email,
      redirectTo: "/reset-password",
    });

    setIsSaving(false);
    if (apiError) {
      showError(apiError.message || "Failed to send reset link");
      return;
    }

    showSuccess("Reset link sent to your email");
  }, [user?.email]);

  // ─── Navigation Guard ──────────────────────────────────────────

  const hasProfileChanges = getProfileValues().name !== (user?.name || "");

  const handleGoBack = useCallback(() => {
    if (hasProfileChanges && activeSection === "profile") {
      // Use a simple confirm or navigate back directly
      // For Expo Router, you might want to use a custom modal
      router.back();
    } else {
      router.back();
    }
  }, [hasProfileChanges, activeSection, router]);

  // ─── Render Helpers ────────────────────────────────────────────

  const renderSectionButton = (
    label: string,
    section: Section,
    icon: string,
  ) => (
    <TouchableOpacity
      style={[
        styles.sectionButton,
        activeSection === section && {
          backgroundColor: `${colors.primary}15`,
          borderColor: colors.primary,
        },
        { borderColor: colors.border },
      ]}
      onPress={() => {
        setActiveSection(section);
        setEmailChanged(false);
        clearMessages();
      }}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={
          activeSection === section ? colors.primary : colors.textSecondary
        }
      />
      <Text
        style={[
          styles.sectionButtonText,
          {
            color: activeSection === section ? colors.primary : colors.text,
          },
        ]}
      >
        {label}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={
          activeSection === section ? colors.primary : colors.textSecondary
        }
      />
    </TouchableOpacity>
  );

  const renderMessage = () => {
    if (!message && !error) return null;

    return (
      <View
        style={[
          styles.messageBanner,
          {
            backgroundColor: error
              ? `${colors.error}15`
              : `${colors.success}15`,
            borderLeftColor: error ? colors.error : colors.success,
          },
        ]}
      >
        <Ionicons
          name={error ? "alert-circle" : "checkmark-circle"}
          size={18}
          color={error ? colors.error : colors.success}
        />
        <Text
          style={[
            styles.messageText,
            { color: error ? colors.error : colors.success },
          ]}
        >
          {error || message?.text}
        </Text>
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────────────────

  if (!session) {
    return (
      <AppContainer contentStyle={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="person-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Not Signed In
          </Text>
          <AppButton
            title="Sign In"
            onPress={() => router.push("/login")}
            style={styles.signInButton}
          />
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer contentStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Edit Profile
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section Switcher */}
          <Card style={styles.menuCard}>
            <Card.Content style={styles.menuCardContent}>
              {generalError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              )}

              {renderSectionButton(
                "Personal Info",
                "profile",
                "person-outline",
              )}
              {renderSectionButton("Change Email", "email", "mail-outline")}
              {renderSectionButton(
                "Password",
                "password",
                "lock-closed-outline",
              )}
            </Card.Content>
          </Card>

          {/* Global Message */}
          {renderMessage()}

          {/* ─── PROFILE SECTION ───────────────────────────────────── */}
          {activeSection === "profile" && (
            <Card style={styles.formCard}>
              <Card.Content style={styles.formCardContent}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  Change name
                </Text>

                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    Current: {user?.name}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <AppInput
                    label="Full Name"
                    ref={nameField.ref}
                    onChangeText={(text) => {
                      nameField.onChangeText(text);
                      clearMessages();
                    }}
                    onBlur={nameField.onBlur}
                    autoCapitalize="words"
                    autoComplete="name"
                    error={profileErrors.name}
                    left={<TextInput.Icon icon="account-outline" size={20} />}
                  />
                  {profileErrors.name && (
                    <Text style={styles.fieldError}>{profileErrors.name}</Text>
                  )}
                </View>

                <AppButton
                  title={isSaving ? "Saving..." : "Save Changes"}
                  onPress={handleSubmitProfile(onSaveProfile, onInvalidProfile)}
                  disabled={isSaving || !hasProfileChanges}
                  style={[
                    styles.saveButton,
                    (!hasProfileChanges || isSaving) &&
                      styles.saveButtonDisabled,
                  ]}
                  contentStyle={styles.saveButtonContent}
                />
              </Card.Content>
            </Card>
          )}

          {/* ─── EMAIL SECTION ───────────────────────────────────── */}
          {activeSection === "email" && (
            <Card style={styles.formCard}>
              <Card.Content style={styles.formCardContent}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  Change email
                </Text>

                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    Current: {user?.email}
                  </Text>
                </View>

                {emailChanged ? (
                  <View style={styles.successBox}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.success}
                    />
                    <Text
                      style={[styles.successText, { color: colors.success }]}
                    >
                      Verification email sent! Check your new inbox to confirm.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <AppInput
                        label="New Email Address"
                        ref={emailField.ref}
                        onChangeText={(text) => {
                          emailField.onChangeText(text);
                          clearMessages();
                        }}
                        onBlur={emailField.onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        error={emailErrors.email}
                        left={<TextInput.Icon icon="email-outline" size={20} />}
                      />
                      {emailErrors.email && (
                        <Text style={styles.fieldError}>
                          {emailErrors.email}
                        </Text>
                      )}
                    </View>

                    <AppButton
                      title={isSaving ? "Sending..." : "Change Email"}
                      onPress={handleSubmitEmail(onChangeEmail, onInvalidEmail)}
                      disabled={isSaving}
                      style={styles.saveButton}
                      contentStyle={styles.saveButtonContent}
                    />
                  </>
                )}
              </Card.Content>
            </Card>
          )}

          {/* ─── PASSWORD SECTION ───────────────────────────────── */}
          {activeSection === "password" && (
            <Card style={styles.formCard}>
              <Card.Content style={styles.formCardContent}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  Change password
                </Text>

                <View style={styles.inputGroup}>
                  <AppInput
                    label="Current Password"
                    ref={currentPasswordField.ref}
                    onChangeText={(text) => {
                      currentPasswordField.onChangeText(text);
                      clearMessages();
                    }}
                    onBlur={currentPasswordField.onBlur}
                    secureTextEntry={!showCurrentPassword}
                    error={passwordErrors.currentPassword}
                    left={<TextInput.Icon icon="lock-outline" size={20} />}
                    right={
                      <TextInput.Icon
                        icon={showCurrentPassword ? "eye-off" : "eye"}
                        onPress={() => setShowCurrentPassword((p) => !p)}
                        size={20}
                      />
                    }
                  />
                  {passwordErrors.currentPassword && (
                    <Text style={styles.fieldError}>
                      {passwordErrors.currentPassword}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <AppInput
                    label="New Password"
                    ref={newPasswordField.ref}
                    onChangeText={(text) => {
                      newPasswordField.onChangeText(text);
                      clearMessages();
                    }}
                    onBlur={newPasswordField.onBlur}
                    secureTextEntry={!showNewPassword}
                    error={passwordErrors.newPassword}
                    left={<TextInput.Icon icon="lock-outline" size={20} />}
                    right={
                      <TextInput.Icon
                        icon={showNewPassword ? "eye-off" : "eye"}
                        onPress={() => setShowNewPassword((p) => !p)}
                        size={20}
                      />
                    }
                  />
                  {passwordErrors.newPassword && (
                    <Text style={styles.fieldError}>
                      {passwordErrors.newPassword}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <AppInput
                    label="Confirm New Password"
                    ref={confirmPasswordField.ref}
                    onChangeText={(text) => {
                      confirmPasswordField.onChangeText(text);
                      clearMessages();
                    }}
                    onBlur={confirmPasswordField.onBlur}
                    secureTextEntry={!showConfirmPassword}
                    error={passwordErrors.confirmPassword}
                    left={<TextInput.Icon icon="lock-outline" size={20} />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? "eye-off" : "eye"}
                        onPress={() => setShowConfirmPassword((p) => !p)}
                        size={20}
                      />
                    }
                  />
                  {passwordErrors.confirmPassword && (
                    <Text style={styles.fieldError}>
                      {passwordErrors.confirmPassword}
                    </Text>
                  )}
                </View>

                <AppButton
                  title={isSaving ? "Updating..." : "Update Password"}
                  onPress={handleSubmitPassword(
                    onChangePassword,
                    onInvalidPassword,
                  )}
                  disabled={isSaving}
                  style={styles.saveButton}
                  contentStyle={styles.saveButtonContent}
                />

                <View style={styles.divider}>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <Text
                    style={[
                      styles.dividerText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    OR
                  </Text>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleRequestPasswordReset}
                  disabled={isSaving}
                >
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    Forgot password? Send reset link
                  </Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          )}

          {/* Cancel */}
          <TouchableOpacity onPress={handleGoBack} style={styles.cancelButton}>
            <Text
              style={[styles.cancelButtonText, { color: colors.textSecondary }]}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppContainer>
  );
});

// ─── Styles ──────────────────────────────────────────────────────

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    headerRight: {
      width: 40,
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
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginTop: 16,
      marginBottom: 24,
    },
    signInButton: {
      borderRadius: 12,
      width: "80%",
    },
    menuCard: {
      borderRadius: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      backgroundColor: colors.surface,
    },
    menuCardContent: {
      padding: 12,
      gap: 4,
    },
    sectionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      gap: 12,
    },
    sectionButtonText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
    },
    messageBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderLeftWidth: 4,
    },
    messageText: {
      fontSize: 14,
      fontWeight: "500",
      flex: 1,
    },
    formCard: {
      borderRadius: 20,
      marginBottom: 24,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      backgroundColor: colors.surface,
    },
    formCardContent: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 16,
      letterSpacing: 0.5,
    },
    infoBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: `${colors.primary}10`,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    infoText: {
      fontSize: 14,
      fontWeight: "500",
      flex: 1,
    },
    successBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: `${colors.success}10`,
      padding: 16,
      borderRadius: 12,
    },
    successText: {
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
    },
    inputGroup: {
      marginBottom: 16,
    },
    fieldError: {
      color: colors.error,
      fontSize: 12,
      marginLeft: 4,
      fontWeight: "500",
    },
    saveButton: {
      borderRadius: 16,
      marginTop: 8,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonContent: {
      height: 52,
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
    },
    dividerText: {
      fontSize: 12,
      fontWeight: "600",
    },
    linkText: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    cancelButton: {
      alignItems: "center",
      paddingVertical: 12,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
  });
