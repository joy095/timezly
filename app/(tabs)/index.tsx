import { AppButton, AppContainer } from "@/components/ui";
import useAppColors from "@/theme/useAppColors";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { ActivityIndicator, Card, Divider } from "react-native-paper";
import { authClient } from "@/lib/auth-client";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

export default function HomeTab() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { data: session, isPending } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.replace("/login");
                },
                onError: (ctx) => {
                  Alert.alert("Error", ctx.error.message);
                  setIsLoggingOut(false);
                },
              },
            });
          } catch (error) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

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
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyCardContent}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="person-outline"
                  size={48}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.emptyTitle}>Not Signed In</Text>
              <Text style={styles.emptySubtitle}>
                Please sign in to view your profile
              </Text>
              <AppButton
                title="Sign In"
                onPress={() => router.push("/login")}
                style={styles.signInButton}
              />
            </Card.Content>
          </Card>
        </View>
      </AppContainer>
    );
  }

  const { user } = session;
  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || "?";

  const menuItems = [
    {
      icon: "person-outline" as const,
      iconSet: "Ionicons" as const,
      label: "Personal Information",
      color: colors.primary,
      onPress: () => {},
    },
    {
      icon: "shield-outline" as const,
      iconSet: "Ionicons" as const,
      label: "Security & Privacy",
      color: colors.success || "#10b981",
      onPress: () => {},
    },
    {
      icon: "notifications-none" as const,
      iconSet: "MaterialIcons" as const,
      label: "Notifications",
      color: colors.warning || "#f59e0b",
      onPress: () => {},
    },
    {
      icon: "settings-outline" as const,
      iconSet: "Ionicons" as const,
      label: "Settings",
      color: colors.textSecondary,
      onPress: () => {},
    },
  ];

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
      default:
        return <Ionicons name={icon as any} size={size} color={color} />;
    }
  };

  return (
    <AppContainer contentStyle={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileCardContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {user.image ? (
                <Image source={{ uri: user.image }} style={styles.avatar} />
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
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: colors.success },
                  ]}
                />
              </View>
            </View>

            {/* User Info */}
            <Text style={styles.userName}>{user.name || "User"}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user.email}
            </Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  Active
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Status
                </Text>
              </View>
              <Divider style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  Member
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Since
                </Text>
              </View>
              <Divider style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  Pro
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Plan
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Menu Section */}
        <Card style={styles.menuCard}>
          <Card.Content style={styles.menuCardContent}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              ACCOUNT
            </Text>
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    index !== menuItems.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: `${item.color}15` },
                    ]}
                  >
                    {renderIcon(item.icon, item.iconSet, 20, item.color)}
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Logout Section */}
        <Card style={[styles.logoutCard, { borderColor: colors.error }]}>
          <Card.Content style={styles.logoutCardContent}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={isLoggingOut}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.logoutIconContainer,
                  { backgroundColor: `${colors.error}15` },
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
                  style={styles.logoutArrow}
                />
              )}
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Version */}
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
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
      paddingHorizontal: 20,
    },
    emptyCard: {
      width: "100%",
      borderRadius: 20,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      backgroundColor: colors.surface,
    },
    emptyCardContent: {
      padding: 40,
      alignItems: "center",
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    signInButton: {
      borderRadius: 12,
      width: "100%",
    },
    profileCard: {
      borderRadius: 20,
      marginBottom: 20,
      elevation: 4,
      shadowColor: "#000",
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
      color: "#ffffff",
    },
    statusBadge: {
      position: "absolute",
      bottom: 4,
      right: 4,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 2,
    },
    statusDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    userName: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      marginBottom: 20,
    },
    statsContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border || "#e5e7eb",
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: "500",
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.border || "#e5e7eb",
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
      padding: 20,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    menuContainer: {
      gap: 0,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
    },
    menuItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border || "#f3f4f6",
    },
    menuIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    menuLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
    },
    logoutCard: {
      borderRadius: 16,
      borderWidth: 1,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      backgroundColor: colors.surface,
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
      marginRight: 16,
    },
    logoutText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
    },
    logoutArrow: {
      opacity: 0.6,
    },
    versionText: {
      textAlign: "center",
      marginTop: 24,
      fontSize: 12,
      fontWeight: "500",
    },
  });
