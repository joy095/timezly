import { AppContainer } from "@/components/ui";
import { appMode$ } from "@/stores/userClinicSwitch";
import useAppColors from "@/theme/useAppColors";
import { Octicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function ClinicMenuTab() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const currentMode = appMode$.activeMode.get();

  const toggleMode = () => {
    const next = currentMode === "user" ? "clinic" : "user";
    appMode$.activeMode.set(next);
  };
  return (
    <AppContainer>
      <Text>ClinicMenuTab</Text>

      <TouchableOpacity onPress={toggleMode} style={styles.switchWrap}>
        <Octicons name="arrow-switch" size={16} color={colors.textInverse} />
        <Text style={styles.switchText}>Switch to Client</Text>
      </TouchableOpacity>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    switchWrap: {
      position: "fixed", // React Native uses 'absolute', not 'fixed'
      flexDirection: "row", // Use 'row' or 'column' instead of display: 'flex'
      alignItems: "center",
      gap: 5, // gap works in newer RN versions (0.71+)
      top: "auto",
      marginTop: "auto",
      bottom: 0,
      alignSelf: "center", // Use alignSelf for centering in RN
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 12, // Add padding since gap might not work in older versions
      paddingVertical: 6,
    },
    switchText: {
      color: colors.textInverse,
    },
  });
