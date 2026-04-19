import { AppContainer } from "@/components/ui";
import useAppColors from "@/theme/useAppColors";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function ClinicListingsTab() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <AppContainer>
      <Text>ClinicListingsTab</Text>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({});
