import { useState } from "react";
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useConfig } from "../context/ConfigContext";
import { useAuth } from "../context/AuthContext";

type Props = { visible: boolean; onClose: () => void };

export default function ChangePasswordModal({ visible, onClose }: Props) {
  const { primary } = useConfig();
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"verify" | "change">("verify");

  const reset = () => {
    setCurrent(""); setNewPwd(""); setConfirm("");
    setStep("verify");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleVerify = async () => {
    if (!current) { Alert.alert("Champ manquant", "Entre ton mot de passe actuel"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: current,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Mot de passe incorrect", "Le mot de passe actuel ne correspond pas.");
    } else {
      setStep("change");
    }
  };

  const handleChange = async () => {
    if (!newPwd || !confirm) { Alert.alert("Champs manquants"); return; }
    if (newPwd.length < 6) { Alert.alert("Erreur", "6 caractères minimum"); return; }
    if (newPwd !== confirm) { Alert.alert("Erreur", "Les mots de passe ne correspondent pas"); return; }
    if (newPwd === current) { Alert.alert("Erreur", "Le nouveau mot de passe doit être différent de l'ancien"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setLoading(false);

    if (error) {
      Alert.alert("Erreur", error.message);
    } else {
      Alert.alert("Succès !", "Mot de passe modifié avec succès ✅");
      handleClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === "verify" ? "Vérification" : "Nouveau mot de passe"}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Indicateur d'étape */}
          <View style={styles.steps}>
            <View style={[styles.stepDot, { backgroundColor: primary }]}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <View style={[styles.stepLine, step === "change" && { backgroundColor: primary }]} />
            <View style={[styles.stepDot, step === "change" ? { backgroundColor: primary } : styles.stepDotInactive]}>
              <Text style={[styles.stepNum, step !== "change" && { color: "#aaa" }]}>2</Text>
            </View>
          </View>

          {step === "verify" ? (
            <>
              <Text style={styles.stepLabel}>Confirme ton identité</Text>
              <Text style={styles.stepDesc}>Entre ton mot de passe actuel pour continuer</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Mot de passe actuel</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  value={current}
                  onChangeText={setCurrent}
                  secureTextEntry
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: primary }, loading && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Vérifier</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.stepLabel}>Choisis un nouveau mot de passe</Text>
              <Text style={styles.stepDesc}>Au moins 6 caractères, différent de l'ancien</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6 caractères minimum"
                  placeholderTextColor="#bbb"
                  value={newPwd}
                  onChangeText={setNewPwd}
                  secureTextEntry
                  autoFocus
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Confirmer</Text>
                <TextInput
                  style={[styles.input, confirm.length > 0 && newPwd !== confirm && styles.inputError]}
                  placeholder="Répète le nouveau mot de passe"
                  placeholderTextColor="#bbb"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                />
                {confirm.length > 0 && newPwd !== confirm && (
                  <Text style={styles.errorText}>Les mots de passe ne correspondent pas</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: primary }, loading && styles.btnDisabled]}
                onPress={handleChange}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enregistrer</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep("verify")} style={styles.backBtn}>
                <Text style={styles.backBtnText}>{"<"} Retour</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  title: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f3f3f3", justifyContent: "center", alignItems: "center" },
  closeBtnText: { fontSize: 15, color: "#555", fontWeight: "700" },
  content: { padding: 24, gap: 16 },
  steps: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 8 },
  stepDot: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  stepDotInactive: { backgroundColor: "#e5e5e5" },
  stepNum: { color: "#fff", fontSize: 13, fontWeight: "800" },
  stepLine: { width: 48, height: 2, backgroundColor: "#e5e5e5" },
  stepLabel: { fontSize: 17, fontWeight: "800", color: "#1a1a1a", textAlign: "center" },
  stepDesc: { fontSize: 13, color: "#888", textAlign: "center" },
  inputWrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#444" },
  input: { borderWidth: 1.5, borderColor: "#eee", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1a1a1a", backgroundColor: "#fafafa" },
  inputError: { borderColor: "#ef4444" },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 2 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backBtn: { alignItems: "center", padding: 8 },
  backBtnText: { color: "#aaa", fontSize: 14 },
});
