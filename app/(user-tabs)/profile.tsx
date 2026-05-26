import { AppButton, AppContainer } from "@/components/ui";
import useAppColors from "@/theme/useAppColors";
import { useRouter } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Card } from "react-native-paper";
import { authClient, signOut } from "@/lib/auth-client";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Octicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { authStore$ } from "@/stores/authStore";
import { observer } from "@legendapp/state/react";
import ImageUploader from "@/components/ImageUploader";
import { UploadResult } from "@/components/ImageEditor";
import { getAvatarUrl } from "@/utils";
import { appMode$ } from "@/stores/userClinicSwitch";
import { Image } from "expo-image";
import { BACKEND_URL } from "@/const";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mode Switcher Card ───
// Only shows modes that the user has created profiles for
const ModeSwitcherCard = ({
  currentMode,
  onToggle,
  colors,
  organization,
  styles,
  isSwitching,
  switchingTo,
  hasDoctorProfile,
  hasClinicProfile,
}: {
  currentMode: "user" | "clinic" | "doctor";
  onToggle: (mode: "user" | "clinic" | "doctor") => void;
  colors: any;
  organization: any;
  styles: any;
  isSwitching: boolean;
  switchingTo: "user" | "clinic" | "doctor" | null;
  hasDoctorProfile: boolean;
  hasClinicProfile: boolean;
}) => {
  // Build available modes dynamically based on created profiles
  const modes = useMemo(() => {
    const available = [
      {
        key: "user" as const,
        label: "Patient",
        icon: "person",
        color: colors.primary,
      },
    ];
    if (hasDoctorProfile) {
      available.push({
        key: "doctor" as const,
        label: "Doctor",
        icon: "medical",
        color: colors.secondary,
      });
    }
    if (hasClinicProfile) {
      available.push({
        key: "clinic" as const,
        label: "Clinic",
        icon: "business",
        color: colors.tertiary,
      });
    }
    return available;
  }, [hasDoctorProfile, hasClinicProfile, colors]);

  const activeModeIndex = modes.findIndex((m) => m.key === currentMode);
  const [translateX] = useState(
    new Animated.Value(
      activeModeIndex >= 0
        ? activeModeIndex * ((SCREEN_WIDTH - 72) / modes.length)
        : 0,
    ),
  );

  const handleModeChange = (
    mode: "user" | "clinic" | "doctor",
    index: number,
  ) => {
    if (isSwitching) return;
    Animated.spring(translateX, {
      toValue: index * ((SCREEN_WIDTH - 72) / modes.length),
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
    onToggle(mode);
  };

  // Don't render if only Patient mode is available (no other profiles created)
  if (modes.length <= 1) return null;

  return (
    <Card style={[styles.modeCard, { backgroundColor: colors.surface }]}>
      <Card.Content style={styles.modeCardContent}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={[styles.modeCardTitle, { color: colors.textSecondary }]}>
            SWITCH PROFILE
          </Text>
          {isSwitching && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: "auto",
              }}
            >
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  fontWeight: "500",
                }}
              >
                Switching...
              </Text>
            </View>
          )}
        </View>
        <View
          style={{
            flexDirection: "row",
            position: "relative",
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 4,
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 4,
              bottom: 4,
              left: 4,
              borderRadius: 12,
              borderWidth: 1,
              backgroundColor: isSwitching
                ? `${colors.primary}08`
                : `${colors.primary}15`,
              borderColor: isSwitching
                ? `${colors.primary}15`
                : `${colors.primary}30`,
              transform: [{ translateX }],
              width: (SCREEN_WIDTH - 72) / modes.length - 4,
            }}
          />
          {modes.map((mode, index) => {
            const isActive = currentMode === mode.key;
            const isLoadingThis = isSwitching && switchingTo === mode.key;
            const isAnyLoading = isSwitching;

            return (
              <Pressable
                key={mode.key}
                onPress={() =>
                  !isAnyLoading && handleModeChange(mode.key, index)
                }
                disabled={isActive || isAnyLoading}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  borderRadius: 12,
                  zIndex: 1,
                  opacity: isAnyLoading && !isLoadingThis ? 0.5 : 1,
                }}
              >
                {isLoadingThis ? (
                  <ActivityIndicator
                    size="small"
                    color={mode.color}
                    style={{ marginBottom: 2 }}
                  />
                ) : (
                  <Ionicons
                    name={mode.icon as any}
                    size={22}
                    color={isActive ? mode.color : colors.textMuted}
                  />
                )}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    marginTop: 4,
                    color: isActive ? mode.color : colors.textSecondary,
                    opacity: isAnyLoading && !isLoadingThis ? 0.5 : 1,
                  }}
                >
                  {isLoadingThis ? "Switching" : mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card.Content>
    </Card>
  );
};

// ─── Animated Menu Item ───
const MenuItem = ({
  item,
  index,
  totalItems,
  colors,
  onPress,
  styles,
}: {
  item: any;
  index: number;
  totalItems: number;
  colors: any;
  onPress: () => void;
  styles: any;
}) => {
  const scaleAnim = useState(new Animated.Value(1))[0];
  const bgAnim = useState(new Animated.Value(0))[0];

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bgAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", `${colors.primary}08`],
  });

  const renderIcon = (
    icon: string,
    iconSet: string,
    size: number,
    color: string,
  ) => {
    switch (iconSet) {
      case "MaterialIcons":
        return <MaterialIcons name={icon as any} size={size} color={color} />;
      case "MaterialCommunityIcons":
        return (
          <MaterialCommunityIcons
            name={icon as any}
            size={size}
            color={color}
          />
        );
      case "FontAwesome5":
        return <FontAwesome5 name={icon as any} size={size} color={color} />;
      default:
        return <Ionicons name={icon as any} size={size} color={color} />;
    }
  };

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }], borderRadius: 12 }}
    >
      <Animated.View style={{ backgroundColor: bgColor, borderRadius: 12 }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={[
            styles.menuItem,
            index !== totalItems - 1 && {
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
            },
          ]}
        >
          <View
            style={[
              styles.menuIconContainer,
              { backgroundColor: `${item.color}12` },
            ]}
          >
            {renderIcon(item.icon, item.iconSet, 20, item.color)}
          </View>
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            {item.label}
          </Text>
          {item.badge && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export default observer(function UserProfileTab() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const handleUploadComplete = useCallback((result: UploadResult) => {
    if (typeof result.cloudUrl !== "string") {
      console.error("cloudUrl is not a string:", result.cloudUrl);
      return;
    }
    authStore$.user.image.set(result.cloudUrl);
  }, []);

  const isPending = authStore$.isPending.get();
  const session = authStore$.session.get();
  const organization = authStore$.organization.get();

  // Check if user has created doctor profile and clinic profile
  // These should be set by your create-doctor and create-org flows
  const hasDoctorProfile = authStore$.doctor.get() ?? null;
  const hasClinicProfile = !!organization;

  const rawCurrentMode = appMode$.activeMode.get();
  const currentMode =
    rawCurrentMode === "user" ||
    rawCurrentMode === "clinic" ||
    rawCurrentMode === "doctor"
      ? rawCurrentMode
      : "user";

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Loading state for mode switching
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [switchingToMode, setSwitchingToMode] = useState<
    "user" | "clinic" | "doctor" | null
  >(null);

  const showLogoutConfirmation = () => setIsLogoutModalVisible(true);
  const hideLogoutConfirmation = () => setIsLogoutModalVisible(false);

  const handleLogout = async () => {
    hideLogoutConfirmation();
    setIsLoggingOut(true);
    const { error } = await signOut();
    if (error) {
      Alert.alert("Error", "Failed to sign out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const handleModeToggle = useCallback(
    async (mode: "user" | "clinic" | "doctor") => {
      if (mode === currentMode || isSwitchingMode) return;

      setIsSwitchingMode(true);
      setSwitchingToMode(mode);

      let payload;
      if (mode === "clinic") {
        payload = {
          organizationId: organization.id,
          organizationSlug: organization.slug,
        };
      } else if (mode === "doctor") {
        payload = { organizationId: organization?.id || null };
      } else {
        payload = { organizationId: null };
      }

      const { error } = await authClient.organization.setActive(payload);

      setIsSwitchingMode(false);
      setSwitchingToMode(null);

      if (error) {
        console.error(error);
        Alert.alert("Error", "Failed to switch profile. Please try again.");
        return;
      }
      appMode$.activeMode.set(mode);
    },
    [currentMode, organization, isSwitchingMode],
  );

  const handleCopyEmail = useCallback(() => {
    const user = authStore$.user.get();
    if (user.email) {
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    }
  }, []);

  if (isPending) {
    return (
      <AppContainer contentStyle={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </AppContainer>
    );
  }

  if (!session) {
    return (
      <AppContainer contentStyle={styles.container}>
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: `${colors.primary}12` },
            ]}
          >
            <Ionicons name="person-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Not Signed In
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Please sign in to view your profile
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

  const user = authStore$.user.get();
  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "?";

  const avatarUrl = getAvatarUrl(user.image);
  const rawToken = authStore$.token.get();
  const token =
    typeof rawToken === "string"
      ? rawToken
      : ((rawToken as any)?.data?.token ?? (rawToken as any)?.token ?? null);

  const menuItems = [
    {
      icon: "person-outline" as const,
      iconSet: "Ionicons" as const,
      label: "Edit Profile",
      color: colors.primary,
      onPress: () => router.push("/(user-tabs)/edit-profile"),
    },
    {
      icon: "calendar-outline" as const,
      iconSet: "Ionicons" as const,
      label: "My Appointments",
      color: colors.info,
      badge: "2",
      onPress: () => {},
    },
    {
      icon: "shield-checkmark-outline" as const,
      iconSet: "Ionicons" as const,
      label: "Security & Privacy",
      color: colors.success,
      onPress: () => {},
    },
    {
      icon: "notifications-outline" as const,
      iconSet: "Ionicons" as const,
      label: "Notifications",
      color: colors.warning,
      badge: "3",
      onPress: () => {},
    },
    {
      icon: "settings-outline" as const,
      iconSet: "Ionicons" as const,
      label: "Settings",
      color: colors.textSecondary,
      onPress: () => {},
    },
    {
      icon: "help-circle-outline" as const,
      iconSet: "Ionicons" as const,
      label: "Help & Support",
      color: colors.info,
      onPress: () => {},
    },
  ];

  // Determine if we should show the mode switcher (only if user has doctor or clinic profile)
  const showModeSwitcher = hasDoctorProfile || hasClinicProfile;
  // Determine if we should show create cards
  const showCreateDoctor = !hasDoctorProfile;
  const showCreateClinic = !hasClinicProfile;

  return (
    <AppContainer contentStyle={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <Card style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.profileCardContent}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image
                  source={avatarUrl}
                  style={[styles.avatar, { borderColor: colors.surface }]}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </View>
              )}
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.surface },
                ]}
              >
                <ImageUploader
                  uploadUrl={`${BACKEND_URL}/api/user/image`}
                  allowedCropModes={["square"]}
                  onUploadComplete={handleUploadComplete}
                  buttonTitle=""
                  token={token}
                />
              </View>
            </View>

            <Text style={[styles.userName, { color: colors.text }]}>
              {user.name || "User"}
            </Text>
            <Pressable onPress={handleCopyEmail} style={styles.emailContainer}>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {user.email}
              </Text>
              <Ionicons
                name="copy-outline"
                size={14}
                color={colors.textMuted}
                style={styles.copyIcon}
              />
            </Pressable>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  12
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Visits
                </Text>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  3
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Doctors
                </Text>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  5
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Reviews
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Mode Switcher — only shown if user has doctor or clinic profile */}
        {showModeSwitcher && (
          <ModeSwitcherCard
            currentMode={currentMode}
            onToggle={handleModeToggle}
            colors={colors}
            organization={organization}
            styles={styles}
            isSwitching={isSwitchingMode}
            switchingTo={switchingToMode}
            hasDoctorProfile={hasDoctorProfile}
            hasClinicProfile={hasClinicProfile}
          />
        )}

        {/* Create Doctor Account Card — hidden after doctor profile created */}
        {showCreateDoctor && (
          <Card
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() =>
              !isSwitchingMode && router.navigate("/(doctor)/create-doctor")
            }
          >
            <Card.Content style={styles.actionCardContent}>
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${colors.secondary}12` },
                ]}
              >
                <FontAwesome5
                  name="user-md"
                  size={28}
                  color={colors.secondary}
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>
                  Create Doctor profile
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  Create your doctor profile to manage patients and appointments
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Card.Content>
          </Card>
        )}

        {/* Create Online Clinic Card — hidden after clinic created */}
        {showCreateClinic && (
          <Card
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() =>
              !isSwitchingMode && router.navigate("/(org)/create-org")
            }
          >
            <Card.Content style={styles.actionCardContent}>
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${colors.tertiary}12` },
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={28}
                  color={colors.tertiary}
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>
                  Start Online Clinic
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  Launch your clinic and reach more patients online
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Card.Content>
          </Card>
        )}

        {/* Menu Section */}
        <Card style={[styles.menuCard, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.menuCardContent}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              ACCOUNT SETTINGS
            </Text>
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <MenuItem
                  key={item.label}
                  item={item}
                  index={index}
                  totalItems={menuItems.length}
                  colors={colors}
                  onPress={item.onPress}
                  styles={styles}
                />
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Logout Section */}
        <Card
          style={[
            styles.logoutCard,
            {
              backgroundColor: colors.surface,
              borderColor: `${colors.error}30`,
            },
          ]}
        >
          <Card.Content style={styles.logoutCardContent}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={showLogoutConfirmation}
              disabled={isLoggingOut || isSwitchingMode}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.logoutIconContainer,
                  { backgroundColor: `${colors.error}12` },
                ]}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color={colors.error}
                  />
                )}
              </View>
              <Text style={[styles.logoutText, { color: colors.error }]}>
                {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </Text>
              {!isLoggingOut && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.error}
                  style={{ opacity: 0.6 }}
                />
              )}
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Version */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          Version 1.0.0 · Build 2024.05.12
        </Text>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={hideLogoutConfirmation}
        statusBarTranslucent
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={hideLogoutConfirmation}
          />
          <View
            style={[styles.modalContainer, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.modalIconContainer,
                { backgroundColor: `${colors.error}12` },
              ]}
            >
              <Ionicons name="log-out-outline" size={28} color={colors.error} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sign Out
            </Text>
            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              Are you sure you want to sign out of your account?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={hideLogoutConfirmation}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: colors.error },
                ]}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Copied Toast */}
      {showCopiedToast && (
        <View style={styles.toastContainer}>
          <View style={[styles.toast, { backgroundColor: colors.textInverse }]}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
            <Text style={[styles.toastText, { color: colors.text }]}>
              Email copied
            </Text>
          </View>
        </View>
      )}
    </AppContainer>
  );
});

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 32,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
      paddingVertical: 60,
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    emptySubtitle: {
      fontSize: 15,
      textAlign: "center",
      marginBottom: 28,
      lineHeight: 22,
    },
    signInButton: {
      borderRadius: 14,
      width: "100%",
      maxWidth: 280,
    },
    profileCard: {
      borderRadius: 24,
      marginBottom: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
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
      color: colors.onPrimary,
    },
    cameraBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      borderRadius: 16,
      padding: 3,
    },
    cameraButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    userName: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    emailContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: `${colors.primary}08`,
      marginBottom: 20,
    },
    userEmail: {
      fontSize: 13,
      fontWeight: "500",
    },
    copyIcon: {
      marginLeft: 6,
    },
    statsContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    statDivider: {
      width: 1,
      height: 30,
    },
    modeCard: {
      borderRadius: 20,
      marginBottom: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    modeCardContent: {
      padding: 20,
    },
    modeCardTitle: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    modeSwitcherContainer: {
      flexDirection: "row",
      position: "relative",
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 4,
    },
    modeActivePill: {
      position: "absolute",
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    modeOption: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: 12,
      zIndex: 1,
    },
    modeOptionDisabled: {
      opacity: 0.5,
    },
    modeOptionLabel: {
      fontSize: 11,
      fontWeight: "600",
      marginTop: 4,
    },
    comingSoonBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: colors.warning,
      borderRadius: 8,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    comingSoonText: {
      fontSize: 8,
      fontWeight: "700",
      color: colors.onSecondary,
    },
    actionCard: {
      borderRadius: 20,
      marginBottom: 12,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    actionCardContent: {
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    actionIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    actionTextContainer: {
      flex: 1,
      justifyContent: "center",
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    actionSubtitle: {
      fontSize: 13,
      lineHeight: 18,
    },
    menuCard: {
      borderRadius: 20,
      marginBottom: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    menuCardContent: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    menuContainer: {
      gap: 0,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    menuIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    menuLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      letterSpacing: -0.2,
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 6,
      marginRight: 8,
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    logoutCard: {
      borderRadius: 20,
      borderWidth: 1,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    logoutCardContent: {
      padding: 16,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoutIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    logoutText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
    },
    versionText: {
      textAlign: "center",
      marginTop: 24,
      fontSize: 12,
      fontWeight: "500",
      letterSpacing: 0.3,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    modalContainer: {
      width: "100%",
      maxWidth: 320,
      borderRadius: 24,
      padding: 28,
      alignItems: "center",
      elevation: 5,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    modalIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    modalMessage: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 22,
    },
    modalButtonContainer: {
      flexDirection: "row",
      width: "100%",
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButton: {
      borderWidth: 1.5,
    },
    confirmButton: {
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    toastContainer: {
      position: "absolute",
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 9999,
    },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    toastText: {
      fontSize: 14,
      fontWeight: "600",
    },
  });
