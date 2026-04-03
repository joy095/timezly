import { AppTheme } from "@/theme/types";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { TextInput, TextInputProps } from "react-native-paper";

type Props = Omit<TextInputProps, "error"> & {
  error?: string;
};

export function AppInput({ error, style, ...rest }: Props) {
  const { colors } = useTheme() as AppTheme;

  return (
    <TextInput
      {...rest}
      mode="outlined"
      error={!!error} // convert string → boolean
      style={[
        {
          height: 36,
          marginBottom: 8,
          backgroundColor: colors.surface,
          fontSize: 14,
        },
        style,
      ]}
      outlineColor={colors.outline}
      activeOutlineColor={colors.primary}
      textColor={colors.text}
      placeholderTextColor={colors.textMuted}
      theme={{
        colors: {
          error: colors.error,
        },
      }}
    />
  );
}
