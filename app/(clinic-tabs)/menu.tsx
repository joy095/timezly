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

  console.log("Current mode in ClinicMenuTab:", currentMode);

  const toggleMode = () => {
    appMode$.activeMode.set(currentMode === "clinic" ? "user" : "clinic");
  };

  //  "user" ? "clinic" : "user";

  return (
    <AppContainer>
      <Text>ClinicMenuTab</Text>

      <TouchableOpacity onPress={toggleMode} style={styles.switchWrap}>
        <Octicons name="arrow-switch" size={16} color={colors.textInverse} />
        <Text style={styles.switchText}>Switch to User</Text>
      </TouchableOpacity>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
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
