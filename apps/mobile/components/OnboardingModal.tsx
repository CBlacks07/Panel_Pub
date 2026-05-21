import { useState, useRef } from "react";
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Dimensions, FlatList, Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConfig } from "../context/ConfigContext";

const { width } = Dimensions.get("window");

const STEPS = [
  {
    emoji: "🛍️",
    title: "Bienvenue sur Boutiki !",
    desc: "Crée ta boutique en ligne et reçois tes commandes directement sur WhatsApp. Simple, rapide, efficace.",
  },
  {
    emoji: "📸",
    title: "Ajoute tes articles",
    desc: "Prends une photo, mets un prix et publie. Ton article est en ligne en moins de 30 secondes.",
  },
  {
    emoji: "💬",
    title: "Commandes sur WhatsApp",
    desc: "Tes clients ajoutent des articles au panier et t'envoient un message WhatsApp automatique avec leur commande.",
  },
  {
    emoji: "🚀",
    title: "C'est parti !",
    desc: "Commence par renseigner ton numéro WhatsApp dans ton profil pour recevoir tes premières commandes.",
  },
];

type Props = { visible: boolean; onClose: () => void };

export default function OnboardingModal({ visible, onClose }: Props) {
  const { primary } = useConfig();
  const [step, setStep] = useState(0);
  const listRef = useRef<FlatList>(null);

  const next = () => {
    if (step < STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      listRef.current?.scrollToIndex({ index: nextStep, animated: true });
    } else {
      handleClose();
    }
  };

  const handleClose = async () => {
    await AsyncStorage.setItem("onboarding_done", "true");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.skipBtn} onPress={handleClose}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>

          <FlatList
            ref={listRef}
            data={STEPS}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>{item.desc}</Text>
              </View>
            )}
          />

          {/* Dots */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && { backgroundColor: primary, width: 20 }]} />
            ))}
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: primary }]} onPress={next}>
            <Text style={styles.btnText}>
              {step < STEPS.length - 1 ? "Suivant >" : "Commencer 🚀"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 360 },
  skipBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 8 },
  skipText: { fontSize: 13, color: "#aaa" },
  slide: { width: width - 48 - 56, alignItems: "center", paddingHorizontal: 8 },
  emoji: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", textAlign: "center", marginBottom: 12 },
  desc: { fontSize: 15, color: "#666", textAlign: "center", lineHeight: 22 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 28, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#e5e5e5" },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
