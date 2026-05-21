import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { useConfig } from "../context/ConfigContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  onRated: () => void;
};

export default function RatingModal({ visible, onClose, shopId, shopName, onRated }: Props) {
  const { primary } = useConfig();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    if (visible) checkAlreadyRated();
  }, [visible, shopId]);

  const checkAlreadyRated = async () => {
    const key = `rated_${shopId}`;
    const done = await AsyncStorage.getItem(key);
    setAlreadyRated(!!done);
  };

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert("Note requise", "Sélectionne une note entre 1 et 5 étoiles"); return; }
    setSaving(true);

    // Générer un fingerprint unique par appareil+boutique
    const key = `rated_${shopId}`;
    let fingerprint = await AsyncStorage.getItem(`device_fp`);
    if (!fingerprint) {
      fingerprint = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await AsyncStorage.setItem(`device_fp`, fingerprint);
    }

    const { error } = await supabase.from("shop_ratings").insert({
      shop_id: shopId,
      rating,
      comment: comment.trim() || null,
      rater_fingerprint: `${fingerprint}_${shopId}`,
    });
    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        Alert.alert("Déjà noté", "Tu as déjà laissé un avis pour cette boutique.");
        await AsyncStorage.setItem(key, "true");
        setAlreadyRated(true);
      } else {
        Alert.alert("Erreur", error.message);
      }
    } else {
      await AsyncStorage.setItem(key, "true");
      setAlreadyRated(true);
      Alert.alert("Merci !", "Ta note a bien été enregistrée 🙏");
      setRating(0); setComment(""); onRated(); onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Noter la boutique</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={16} color="#555" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={[styles.shopName, { color: primary }]}>{shopName}</Text>
          {alreadyRated && (
            <View style={styles.alreadyRated}>
              <Text style={styles.alreadyRatedText}>✅ Tu as déjà noté cette boutique</Text>
            </View>
          )}
          <Text style={styles.label}>Ta note</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 0 ? "Appuie sur une étoile" : rating === 1 ? "Mauvais" : rating === 2 ? "Moyen" : rating === 3 ? "Bien" : rating === 4 ? "Très bien" : "Excellent !"}
          </Text>
          <Text style={styles.label}>Commentaire (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="Partage ton expérience..."
            placeholderTextColor="#bbb"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: primary }, (saving || rating === 0) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving || rating === 0}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Envoyer ma note</Text>}
          </TouchableOpacity>
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
  shopName: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  label: { fontSize: 13, fontWeight: "700", color: "#444" },
  stars: { flexDirection: "row", justifyContent: "center", gap: 8 },
  starBtn: { padding: 4 },
  star: { fontSize: 44, color: "#e5e5e5" },
  starActive: { color: "#f59e0b" },
  ratingLabel: { textAlign: "center", fontSize: 14, color: "#888", fontWeight: "600", marginTop: -8 },
  input: { borderWidth: 1.5, borderColor: "#eee", borderRadius: 14, padding: 14, fontSize: 14, color: "#1a1a1a", backgroundColor: "#fafafa", textAlignVertical: "top", minHeight: 80 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  alreadyRated: { backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, alignItems: "center" },
  alreadyRatedText: { color: "#16a34a", fontSize: 13, fontWeight: "600" },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

