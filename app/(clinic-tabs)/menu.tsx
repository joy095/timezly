import { UploadResult } from "@/components/ImageEditor";
import ImageUploader from "@/components/ImageUploader";
import { AppContainer } from "@/components/ui";
import { BACKEND_URL, IMAGE_URL } from "@/const";
import { authStore$ } from "@/stores/authStore";
import { appMode$ } from "@/stores/userClinicSwitch";
import useAppColors from "@/theme/useAppColors";
import { Octicons } from "@expo/vector-icons";
import { observer } from "@legendapp/state/react";
import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "react-native-paper";

export default observer(function ClinicMenuTab() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const currentMode = appMode$.activeMode.get();

  const toggleMode = () => {
    appMode$.activeMode.set(currentMode === "clinic" ? "user" : "clinic");
  };

  const handleUploadComplete = (result: UploadResult) => {1
    if (typeof result.cloudUrl !== "string") {
      console.error("cloudUrl is not a string:", result.cloudUrl);
      return;
    }
    authStore$.organization.logo.set(result.cloudUrl);
    console.log("Uploaded image url:", result.cloudUrl);
  };

  const rawSessionToken = authStore$.session.get();
  const sessionToken =
    typeof rawSessionToken === "string"
      ? rawSessionToken
      : ((rawSessionToken as any)?.data?.token ??
        (rawSessionToken as any)?.token ??
        null);

  if (!sessionToken) {
    throw new Error("Authentication sessionToken missing");
  }

  const orgName = authStore$.organization.name.get();
  const orgLogo = authStore$.organization.logo.get();

  const orgInitials = orgName
    ? orgName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const avatarUrl = orgLogo
    ? orgLogo.startsWith("https")
      ? orgLogo
      : `${IMAGE_URL}/${orgLogo}`
    : null;

  return (
    <AppContainer>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileCardContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.avatarText}>{orgInitials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <ImageUploader
                uploadUrl={`${BACKEND_URL}/api/org/image`}
                allowedCropModes={["square"]}
                onUploadComplete={handleUploadComplete}
                buttonTitle="Upload"
                token={sessionToken}
              />
            </View>
          </View>

          {/* User Info */}
          <Text style={styles.userName}>{orgName || "Organization"}</Text>
        </Card.Content>
      </Card>

      <TouchableOpacity onPress={toggleMode} style={styles.switchWrap}>
        <Octicons name="arrow-switch" size={16} color={colors.textInverse} />
        <Text style={styles.switchText}>Switch to User</Text>
      </TouchableOpacity>
    </AppContainer>
  );
});

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    profileCard: {
      borderRadius: 20,
      marginBottom: 20,
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      backgroundColor: colors.surface,
    },
    profileCardContent: {
      padding: 28,
      alignItems: "center",
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: colors.surface,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 4,
      borderColor: colors.surface,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: "700",
      color: colors.textInverse,
      // "#ffffff",
    },
    cameraBadge: {
      position: "relative",
      right: 0,
      left: 0,
      marginLeft: "auto",
      marginRight: "auto",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 2,
      cursor: "pointer",
    },
    userName: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },

    switchWrap: {
      position: "absolute",
      bottom: 80,
      alignSelf: "center",

      flexDirection: "row",
      alignItems: "center",
      gap: 8,

      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,

      zIndex: 1000, // ensures it's above everything
      elevation: 5, // Android shadow
    },
    switchText: {
      color: colors.textInverse,
    },
  });
