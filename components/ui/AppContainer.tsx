import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useAppColors from "@/theme/useAppColors";

type AppContainerProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  header?: boolean;
};

export const AppContainer = ({
  children,
  scroll = false,
  style,
  contentStyle,
  header = false,
}: AppContainerProps) => {
  const colors = useAppColors();

  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.scroll, contentStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={header ? ["left", "right", "bottom"] : undefined}
      style={[
        styles.safe,
        { backgroundColor: colors.background },
        header && styles.noTopPadding,
        style,
      ]}
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  noTopPadding: {
    paddingTop: 0,
  },
  content: {
    flex: 1,
    padding: 8,
  },
  scroll: {
    flexGrow: 1,
    padding: 8,
  },
});
