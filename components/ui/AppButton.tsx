import useAppColors from "@/theme/useAppColors";
import React from "react";
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from "react-native";
import { Button } from "react-native-paper";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  mode?: "contained" | "outlined" | "text";
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export const AppButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  mode = "contained",
  style,
  contentStyle,
  labelStyle,
}: AppButtonProps) => {
  const colors = useAppColors();

  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      contentStyle={[styles.content, contentStyle]}
      style={[
        styles.button,
        mode === "contained" && {
          backgroundColor:
            disabled && !loading ? colors.border : colors.primary,
        },
        style,
      ]}
      labelStyle={[
        styles.label,
        {
          color: mode === "contained" ? "#fff" : colors.primary,
        },
        labelStyle,
      ]}
    >
      {title}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    marginTop: 10,
  },
  content: {
    // paddingVertical: 6,
  },
  label: {
    fontWeight: "bold",
  },
});
