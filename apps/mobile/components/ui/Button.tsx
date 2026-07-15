import { ReactNode } from "react";
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useConfig } from "../../context/ConfigContext";
import { brand, colors, radius, shadow, sizing } from "../../lib/theme";

type Variant = "primary" | "coral" | "soft" | "outline" | "ghost";

/**
 * Bouton standard de l'app.
 * Variantes : primary (bleu de marque), coral (CTA commerce — Direction B),
 * soft (fond bleu clair), outline, ghost.
 */
export function Button({
  label, onPress, variant = "primary", icon, loading, disabled, fullWidth = true, style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}) {
  const { primary } = useConfig();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary" ? primary :
    variant === "coral" ? brand.coral :
    variant === "soft" ? primary + "18" :
    "transparent";
  const fg =
    variant === "primary" || variant === "coral" ? "#fff" : primary;
  const border = variant === "outline" ? { borderWidth: 1.5, borderColor: primary } : null;
  const glow =
    variant === "primary" ? shadow.button :
    variant === "coral" ? {
      shadowColor: brand.coral, shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.34, shadowRadius: 26, elevation: 8,
    } : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled }}
      style={[
        styles.base,
        fullWidth && { alignSelf: "stretch" },
        { backgroundColor: bg },
        border,
        glow,
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: sizing.button, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 18,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 16, fontWeight: "700" },
});
