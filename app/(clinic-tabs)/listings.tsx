import { AppContainer } from "@/components/ui";
import { authStore$ } from "@/stores/authStore";
import useAppColors from "@/theme/useAppColors";
import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { Card } from "react-native-paper";

export default function ClinicListingsTab() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const orgName = authStore$.organization.name.get();

  return (
    <AppContainer>
      <Text>ClinicListingsTab</Text>
      <Card>
        <Card.Content>
          <Image />
        </Card.Content>
      </Card>
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({});
