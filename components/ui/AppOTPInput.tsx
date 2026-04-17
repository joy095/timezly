import useAppColors from "@/theme/useAppColors";
import React, { useRef, useMemo, useCallback } from "react";
import { StyleSheet, TextInput, View, useWindowDimensions } from "react-native";

type Props = {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
};

export const AppOTPInput = ({
  length = 6,
  value,
  onChange,
  disabled,
}: Props) => {
  const colors = useAppColors();
  const { width } = useWindowDimensions();

  // Memoize styles — StyleSheet.create won't run every render
  const styles = useMemo(
    () => getStyles(colors, width, length),
    [colors, width, length],
  );

  const inputs = useRef<TextInput[]>([]);

  const otpArray = useMemo(
    () => value.split("").concat(Array(length).fill("")).slice(0, length),
    [value, length],
  );

  // Stable handler — won't cause AppOTPInput children to re-render needlessly
  const handleChange = useCallback(
    (text: string, index: number) => {
      if (index === 0 && text.length > 1) {
        const cleaned = text.replace(/\D/g, "").slice(0, length);
        onChange(cleaned);
        const lastIndex = cleaned.length - 1;
        if (lastIndex >= 0) inputs.current[lastIndex]?.focus();
        return;
      }

      if (!/^\d*$/.test(text)) return;

      const newOtp = otpArray.slice(); // copy current array
      newOtp[index] = text;
      onChange(newOtp.join("").trimEnd());

      if (text && index < length - 1) {
        inputs.current[index + 1]?.focus();
      }
    },
    [length, onChange, otpArray],
  );

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      if (e.nativeEvent.key === "Backspace" && !otpArray[index] && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    },
    [otpArray],
  );

  return (
    <View style={styles.container}>
      {otpArray.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            if (ref) inputs.current[index] = ref;
          }}
          style={styles.input}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={index === 0 ? length : 1} // allow paste on first box
          editable={!disabled}
        />
      ))}
    </View>
  );
};

const getStyles = (
  colors: ReturnType<typeof useAppColors>,
  screenWidth: number,
  length: number,
) => {
  // GAP CONTROL
  const minGap = 8;
  const maxGap = 16;

  const calculatedGap = screenWidth * 0.02; // 2% of width
  const gap = Math.min(maxGap, Math.max(minGap, calculatedGap));

  // total spacing = gaps + container padding
  const horizontalPadding = 20 * 2;
  const totalSpacing = (length - 1) * gap + horizontalPadding;

  // responsive box size
  const boxSize = Math.min(56, (screenWidth - totalSpacing) / length);

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: 20,
      gap, // now controlled
    },
    input: {
      width: boxSize * 0.9,
      height: boxSize * 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      textAlign: "center",
      fontSize: boxSize * 0.4,
      color: colors.text,
      backgroundColor: colors.background,
    },
  });
};
