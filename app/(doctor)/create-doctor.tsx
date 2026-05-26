import { AppButton, AppInput, AppContainer } from "@/components/ui";
import { createDoctorSchema, CreateDoctorInput } from "@/schemas/doctor.schema";
import useAppColors from "@/theme/useAppColors";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import { useForm } from "@/hooks/useForm";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import type {
  CertificateInput,
  ExperienceInput,
} from "@/schemas/doctor.schema";
import { BACKEND_URL } from "@/const";

// ─── Types ─────────────────────────────────────────────────────────

interface MessageState {
  type: "success" | "error";
  text: string;
}

// ─── Defaults ──────────────────────────────────────────────────────

const DEFAULT_EXPERIENCE: ExperienceInput = {
  organization: "",
  description: "",
  startDate: "",
  endDate: "",
};

// ─── Component ─────────────────────────────────────────────────────

export default function CreateDoctorScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [message, setMessage] = useState<MessageState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Main Form ───────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    errors,
    setFocus,
    getValues,
    setValue,
    watch,
  } = useForm<CreateDoctorInput>({
    schema: createDoctorSchema,
    defaultValues: {
      name: "",
      description: "",
      specialized: "",
      slotDurationMins: 15,
      experience: DEFAULT_EXPERIENCE,
      certificates: [],
    },
  });

  const nameField = register("name");
  const descriptionField = register("description");
  const specializedField = register("specialized");

  // ─── slotDurationMins — stored as number, shown as string ────────

  // We keep a local display string so the TextInput can show "" etc.
  const [slotText, setSlotText] = useState("");

  const handleSlotChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    setSlotText(cleaned);
    const num = parseInt(cleaned, 10);
    // Store a valid number in the form, or NaN
    setValue("slotDurationMins", isNaN(num) ? (undefined as any) : num);
  };

  // ─── Certificate Sub-form ────────────────────────────────────────

  const [certForm, setCertForm] = useState<Partial<CertificateInput>>({});
  const [certDatePicker, setCertDatePicker] = useState<{
    field: "issuedAt" | "expiresAt";
    open: boolean;
  } | null>(null);

  // watch returns the current reactive value of certificates / experience
  const certificates: CertificateInput[] = watch("certificates") ?? [];
  const experience: ExperienceInput = watch("experience") ?? DEFAULT_EXPERIENCE;

  const addCertificate = () => {
    if (!certForm.name || !certForm.issuedAt) return;
    setValue("certificates", [
      ...certificates,
      {
        name: certForm.name,
        description: certForm.description,
        issuedAt: certForm.issuedAt,
        expiresAt: certForm.expiresAt,
      } satisfies CertificateInput,
    ]);
    setCertForm({});
  };

  const removeCertificate = (index: number) => {
    setValue(
      "certificates",
      certificates.filter((_, i) => i !== index),
    );
  };

  // ─── Experience helpers ──────────────────────────────────────────

  const [expDatePicker, setExpDatePicker] = useState<{
    field: "startDate" | "endDate";
    open: boolean;
  } | null>(null);

  const updateExperienceField = (
    field: keyof ExperienceInput,
    value: string,
  ) => {
    setValue("experience", { ...experience, [field]: value });
  };

  // ─── Date Pickers ────────────────────────────────────────────────

  const handleCertDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (selectedDate && certDatePicker) {
      setCertForm((prev) => ({
        ...prev,
        [certDatePicker.field]: selectedDate.toISOString().split("T")[0],
      }));
    }
    setCertDatePicker(null);
  };

  const handleExpDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (selectedDate && expDatePicker) {
      updateExperienceField(
        expDatePicker.field,
        selectedDate.toISOString().split("T")[0],
      );
    }
    setExpDatePicker(null);
  };

  // ─── Submit ──────────────────────────────────────────────────────

  const clearMessages = () => setMessage(null);

  const onSubmit = async (data: CreateDoctorInput) => {
    clearMessages();
    setIsSaving(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/org/doctor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            specialized: data.specialized || undefined,
            slotDurationMins: data.slotDurationMins,
            experience: data.experience,
            certificates: data.certificates ?? [],
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create doctor");
      }

      setMessage({ type: "success", text: "Doctor created successfully!" });
      setTimeout(() => router.back(), 1500);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "An unexpected error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = (
    formErrors: Partial<Record<keyof CreateDoctorInput, string>>,
  ) => {
    const first = Object.keys(formErrors)[0] as keyof CreateDoctorInput;
    if (first) setFocus(first as any);
  };

  // ─── Render Helpers ──────────────────────────────────────────────

  const renderMessage = () => {
    if (!message) return null;
    return (
      <View
        style={[
          styles.messageBanner,
          {
            backgroundColor:
              message.type === "error"
                ? `${colors.error}15`
                : `${colors.success}15`,
            borderLeftColor:
              message.type === "error" ? colors.error : colors.success,
          },
        ]}
      >
        <Ionicons
          name={message.type === "error" ? "alert-circle" : "checkmark-circle"}
          size={18}
          color={message.type === "error" ? colors.error : colors.success}
        />
        <Text
          style={[
            styles.messageText,
            {
              color: message.type === "error" ? colors.error : colors.success,
            },
          ]}
        >
          {message.text}
        </Text>
      </View>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <AppContainer header={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderMessage()}

          {/* ── Basic Info ─────────────────────────────────────── */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                BASIC INFORMATION
              </Text>

              <View style={styles.inputGroup}>
                <AppInput
                  label="Dr. Name"
                  ref={nameField.ref}
                  onChangeText={nameField.onChangeText}
                  onBlur={nameField.onBlur}
                  autoCapitalize="words"
                  error={errors.name}
                  left={<TextInput.Icon icon="account-outline" size={20} />}
                />
                {errors.name && (
                  <Text style={styles.fieldError}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <AppInput
                  label="Specialization"
                  ref={specializedField.ref}
                  onChangeText={specializedField.onChangeText}
                  onBlur={specializedField.onBlur}
                  autoCapitalize="words"
                  error={errors.specialized}
                  left={<TextInput.Icon icon="medical-bag" size={20} />}
                />
                {errors.specialized && (
                  <Text style={styles.fieldError}>{errors.specialized}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <AppInput
                  label="Description"
                  ref={descriptionField.ref}
                  onChangeText={descriptionField.onChangeText}
                  onBlur={descriptionField.onBlur}
                  multiline
                  numberOfLines={4}
                  error={errors.description}
                  left={<TextInput.Icon icon="text-box-outline" size={20} />}
                  style={{ height: 100, textAlignVertical: "top" }}
                />
                {errors.description && (
                  <Text style={styles.fieldError}>{errors.description}</Text>
                )}
              </View>

              {/* slotDurationMins — controlled via local string state */}
              <View style={styles.inputGroup}>
                <AppInput
                  label="Slot Duration (minutes)"
                  value={slotText}
                  onChangeText={handleSlotChange}
                  keyboardType="numeric"
                  error={errors.slotDurationMins}
                  left={
                    <TextInput.Icon icon="clock-time-four-outline" size={20} />
                  }
                />
                {errors.slotDurationMins && (
                  <Text style={styles.fieldError}>
                    {errors.slotDurationMins}
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* ── Experience ─────────────────────────────────────── */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                EXPERIENCE
              </Text>

              <View style={styles.inputGroup}>
                <AppInput
                  label="Organization"
                  value={experience.organization}
                  onChangeText={(text) =>
                    updateExperienceField("organization", text)
                  }
                  left={<TextInput.Icon icon="office-building" size={20} />}
                />
              </View>

              <View style={styles.inputGroup}>
                <AppInput
                  label="Description (optional)"
                  value={experience.description ?? ""}
                  onChangeText={(text) =>
                    updateExperienceField("description", text)
                  }
                  multiline
                  numberOfLines={2}
                  left={<TextInput.Icon icon="text-box-outline" size={20} />}
                  style={{ height: 60, textAlignVertical: "top" }}
                />
              </View>

              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() =>
                    setExpDatePicker({ field: "startDate", open: true })
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {experience.startDate || "Start Date"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() =>
                    setExpDatePicker({ field: "endDate", open: true })
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {experience.endDate || "End Date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {expDatePicker?.open && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  onChange={handleExpDateChange}
                />
              )}
            </Card.Content>
          </Card>

          {/* ── Certificates ───────────────────────────────────── */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                CERTIFICATES
              </Text>

              {certificates.map((cert, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.listItem,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.listItemContent}>
                    <Text
                      style={[styles.listItemTitle, { color: colors.text }]}
                    >
                      {cert.name}
                    </Text>
                    <Text
                      style={[
                        styles.listItemSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Issued: {cert.issuedAt}
                      {cert.expiresAt ? ` • Expires: ${cert.expiresAt}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeCertificate(idx)}>
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Sub-form for adding a certificate */}
              <View style={styles.subForm}>
                <AppInput
                  label="Certificate Name"
                  value={certForm.name ?? ""}
                  onChangeText={(text) =>
                    setCertForm((prev) => ({ ...prev, name: text }))
                  }
                  left={<TextInput.Icon icon="certificate" size={20} />}
                />

                <AppInput
                  label="Description (optional)"
                  value={certForm.description ?? ""}
                  onChangeText={(text) =>
                    setCertForm((prev) => ({ ...prev, description: text }))
                  }
                  multiline
                  numberOfLines={2}
                  left={<TextInput.Icon icon="text-box-outline" size={20} />}
                  style={{ height: 60, textAlignVertical: "top" }}
                />

                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() =>
                      setCertDatePicker({ field: "issuedAt", open: true })
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={[styles.dateText, { color: colors.text }]}>
                      {certForm.issuedAt || "Issued Date"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={() =>
                      setCertDatePicker({ field: "expiresAt", open: true })
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[styles.dateText, { color: colors.textSecondary }]}
                    >
                      {certForm.expiresAt || "Expires (optional)"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {certDatePicker?.open && (
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    onChange={handleCertDateChange}
                  />
                )}

                <AppButton
                  title="Add Certificate"
                  onPress={addCertificate}
                  disabled={!certForm.name || !certForm.issuedAt}
                  style={styles.addButton}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Submit */}
          <AppButton
            title={isSaving ? "Creating..." : "Create Doctor"}
            onPress={handleSubmit(onSubmit, onInvalid)}
            disabled={isSaving}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    keyboardView: { flex: 1 },
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
    headerTitle: { fontSize: 18, fontWeight: "700" },
    headerRight: { width: 40 },
    messageBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderLeftWidth: 4,
    },
    messageText: { fontSize: 14, fontWeight: "500", flex: 1 },
    card: {
      borderRadius: 20,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      backgroundColor: colors.surface,
      marginBottom: 20,
    },
    cardContent: { padding: 20 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 16,
      letterSpacing: 0.5,
    },
    inputGroup: { marginBottom: 16 },
    fieldError: {
      color: colors.error,
      fontSize: 12,
      marginLeft: 4,
      fontWeight: "500",
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },
    listItemContent: { flex: 1 },
    listItemTitle: { fontSize: 15, fontWeight: "600" },
    listItemSubtitle: { fontSize: 13, marginTop: 2 },
    subForm: {
      gap: 12,
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    dateRow: { flexDirection: "row", gap: 12 },
    dateButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateText: { fontSize: 14, fontWeight: "500" },
    addButton: { borderRadius: 12, marginTop: 4 },
    submitButton: { borderRadius: 16, marginTop: 8, marginBottom: 24 },
    submitButtonContent: { height: 52 },
  });
