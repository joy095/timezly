import * as localImageSource from "@/assets/images/successmark.svg";
import { AppButton, AppContainer } from "@/components/ui";
import useAppColors from "@/theme/useAppColors";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

// const localImageSource = require("@/assets/images/successmark.png");

const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export default function SuccessScreen() {
  const colors = useAppColors();

  const styles = getStyles(colors);

  return (
    <AppContainer contentStyle={styles.containerCenter}>
      <View style={styles.row}>
        <Image
          style={styles.image}
          source={localImageSource}
          contentFit="contain"
          transition={1000}
        />

        <Text style={styles.title}>Success</Text>

        <View style={styles.textWrap}>
          <Text style={styles.subtitle}>
            Congratulations! Your password has been changed. Click continue to
            login
          </Text>
        </View>
      </View>

      <AppButton
        style={styles.button}
        title="Continue"
        onPress={() => router.replace("/login")}
      />
    </AppContainer>
  );
}

const getStyles = (colors: ReturnType<typeof useAppColors>) =>
  StyleSheet.create({
    containerCenter: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },

    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
    },

    row: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 20,
    },

    textWrap: {
      maxWidth: 300,
      marginBottom: 20,
    },

    subtitle: {
      marginTop: 6,
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
    },

    image: {
      width: 50,
      height: 50,
    },

    button: {
      width: "100%",
    },
  });
