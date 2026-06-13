import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius } from "../lib/theme";

/**
 * État vide unifié : grand emoji (ou icône) dans une pastille, titre,
 * sous-titre, et action optionnelle. Remplace les variantes par écran.
 */
export function EmptyState({
  emoji, title, subtitle, accent = colors.textMuted, actionLabel, actionIcon, onAction,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  accent?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: accent + "15" }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={[styles.btn, { backgroundColor: accent }]} onPress={onAction} activeOpacity={0.85}>
          {actionIcon ? <Ionicons name={actionIcon} size={18} color="#fff" /> : null}
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 48, paddingHorizontal: 32, gap: spacing.md },
  iconWrap: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center" },
  emoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: "900", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  btn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderRadius: radius.md, paddingHorizontal: spacing.xxl, paddingVertical: 14, marginTop: spacing.sm,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
