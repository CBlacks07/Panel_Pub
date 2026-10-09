import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chip } from "./Chip";
import { useConfig } from "../../context/ConfigContext";
import { colors, radius } from "../../lib/theme";

type Props = {
  /** Valeurs "en dur" du type de commerce */
  builtIn: string[];
  /** Valeurs créées par le vendeur (propres à son compte) */
  custom: string[];
  /** Valeurs actuellement choisies (sert aussi à afficher une valeur retirée de la liste) */
  selected: string[];
  onToggle: (value: string) => void;
  /** Crée l'option côté serveur et retourne la valeur finale ; lève une Error lisible */
  onCreate: (name: string) => Promise<string>;
  onDeleteCustom: (value: string) => void;
  placeholder: string;
};

/**
 * Puces sélectionnables + création inline d'une option personnelle.
 * Appui long sur une option perso : suppression de la liste du vendeur.
 */
export function OptionPicker({ builtIn, custom, selected, onToggle, onCreate, onDeleteCustom, placeholder }: Props) {
  const { primary } = useConfig();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const customOnly = custom.filter((v) => !builtIn.includes(v));
  // valeur choisie mais absente des listes (ex. option perso supprimée depuis) : on la garde visible
  const orphans = selected.filter((v) => !builtIn.includes(v) && !customOnly.includes(v));

  const submit = async () => {
    if (!draft.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const value = await onCreate(draft);
      if (!selected.includes(value)) onToggle(value); // sélectionnée d'office
      setDraft(""); setAdding(false);
    } catch (e: any) {
      setError(e.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const askDelete = (value: string) => {
    const msg = `Retirer « ${value} » de tes options ? Les articles existants le gardent.`;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) onDeleteCustom(value);
      return;
    }
    Alert.alert("Supprimer l'option", msg, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => onDeleteCustom(value) },
    ]);
  };

  return (
    <View>
      <View style={styles.chips}>
        {builtIn.map((v) => (
          <Chip key={`b-${v}`} label={v} selected={selected.includes(v)} onPress={() => onToggle(v)} />
        ))}
        {customOnly.map((v) => (
          <Chip key={`c-${v}`} label={v} selected={selected.includes(v)} onPress={() => onToggle(v)} onLongPress={() => askDelete(v)} />
        ))}
        {orphans.map((v) => (
          <Chip key={`o-${v}`} label={v} selected onPress={() => onToggle(v)} />
        ))}
        {!adding && (
          <TouchableOpacity
            onPress={() => setAdding(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            style={[styles.addChip, { borderColor: primary }]}
          >
            <Ionicons name="add" size={16} color={primary} />
            <Text style={[styles.addText, { color: primary }]}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>

      {adding && (
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, !!error && { borderColor: colors.danger }]}
            value={draft}
            onChangeText={(t) => { setDraft(t); if (error) setError(""); }}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaint}
            maxLength={40}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <TouchableOpacity
            onPress={submit}
            disabled={busy || !draft.trim()}
            style={[styles.okBtn, { backgroundColor: primary, opacity: busy || !draft.trim() ? 0.5 : 1 }]}
            accessibilityLabel="Valider"
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setAdding(false); setDraft(""); setError(""); }}
            style={styles.cancelBtn}
            accessibilityLabel="Annuler"
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {customOnly.length > 0 && !adding && (
        <Text style={styles.hint}>Appui long sur une de tes options pour la supprimer.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  addChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1.5, borderStyle: "dashed", borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  addText: { fontSize: 13, fontWeight: "700" },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    color: colors.text, backgroundColor: colors.surfaceAlt,
  },
  okBtn: { width: 42, height: 42, borderRadius: radius.md, justifyContent: "center", alignItems: "center" },
  cancelBtn: {
    width: 42, height: 42, borderRadius: radius.md, justifyContent: "center", alignItems: "center",
    backgroundColor: colors.bgAlt,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
  hint: { color: colors.textMuted, fontSize: 11, marginTop: 8 },
});
