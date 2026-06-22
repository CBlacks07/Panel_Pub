import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { useConfig } from "../../context/ConfigContext";
import { colors, radius, sizing } from "../../lib/theme";

/**
 * Champ de saisie standard, avec libellé et anneau de focus bleu.
 */
export function Input({
  label, multiline, ...props
}: TextInputProps & { label?: string }) {
  const { primary } = useConfig();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.textFaint}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && { borderColor: primary, backgroundColor: "#fff", shadowColor: primary, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 1 },
          props.style as any,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: colors.text },
  input: {
    minHeight: sizing.input,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: colors.text, backgroundColor: colors.surfaceAlt,
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
});
