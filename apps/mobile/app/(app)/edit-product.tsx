import { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/cloudinary";
import { useConfig } from "../../context/ConfigContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = ["T-shirts", "Pantalons", "Robes", "Chaussures", "Accessoires", "Sacs", "Autres"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Vert", "Jaune", "Rose"];

type Variation = { type: "size" | "color"; value: string };

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { primary, getPlanById } = useConfig();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, product_variations(type, value)")
      .eq("id", id)
      .single();

    if (data) {
      setTitle(data.title);
      setPrice(String(data.price));
      setDescription(data.description ?? "");
      setCategory(data.category);
      setExistingImageUrl(data.image_url);
      setVariations(data.product_variations.map((v: any) => ({ type: v.type, value: v.value })));
    }
    setLoading(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const toggleVariation = (type: "size" | "color", value: string) => {
    const exists = variations.find((v) => v.type === type && v.value === value);
    if (exists) {
      setVariations((prev) => prev.filter((v) => !(v.type === type && v.value === value)));
    } else {
      setVariations((prev) => [...prev, { type, value }]);
    }
  };

  const isSelected = (type: "size" | "color", value: string) =>
    variations.some((v) => v.type === type && v.value === value);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert("Erreur", "Le titre est obligatoire"); return; }
    if (!price || isNaN(Number(price))) { Alert.alert("Erreur", "Le prix est invalide"); return; }
    if (!category) { Alert.alert("Erreur", "Choisis une catégorie"); return; }

    // Vérifier le cooldown par article
    const currentPlan = getPlanById(profile?.plan || "free");
    if (currentPlan.edit_cooldown_hours > 0) {
      const { data: productData } = await supabase
        .from("products")
        .select("last_edited_at")
        .eq("id", id)
        .single();

      if (productData?.last_edited_at) {
        const lastEdit = new Date(productData.last_edited_at);
        const cooldownMs = currentPlan.edit_cooldown_hours * 60 * 60 * 1000;
        const elapsed = Date.now() - lastEdit.getTime();

        if (elapsed < cooldownMs) {
          const remaining = Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000));
          const days = Math.floor(remaining / 24);
          const hours = remaining % 24;
          const timeStr = days > 0
            ? `${days}j ${hours}h`
            : `${hours}h`;

          Alert.alert(
            "⏳ Modification trop récente",
            `Cet article a été modifié récemment.\n\nTu pourras le modifier dans ${timeStr}.\n\nPassez au plan Pro pour des modifications sans délai.`,
            [
              { text: "OK", style: "cancel" },
              { text: "Voir les forfaits", onPress: () => router.push("/(app)/plans") },
            ]
          );
          return;
        }
      }
    }

    setSaving(true);
    try {
      let image_url = existingImageUrl;
      if (imageUri) image_url = await uploadImage(imageUri);

      await supabase.from("products").update({
        title: title.trim(),
        price: Number(price),
        description: description.trim() || null,
        category,
        image_url,
        last_edited_at: new Date().toISOString(),
      }).eq("id", id);

      await supabase.from("product_variations").delete().eq("product_id", id);
      if (variations.length > 0) {
        await supabase.from("product_variations").insert(
          variations.map((v) => ({ product_id: id, type: v.type, value: v.value }))
        );
      }

      // Enregistrer la modification pour le compteur journalier
      if (user?.id) {
        await supabase.from("product_edits").insert({ user_id: user.id, product_id: id });
      }

      Alert.alert("Succès !", "Article mis à jour ✅", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </SafeAreaView>
    );
  }

  const displayImage = imageUri ?? existingImageUrl;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="chevron-back" size={18} color={primary} />
              <Text style={[styles.backBtnText, { color: primary }]}>Retour</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Modifier l'article</Text>
        </View>

        {/* Photo */}
        <TouchableOpacity style={styles.imageSection} onPress={pickImage}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={36} color="#bbb" />
              <Text style={styles.imagePlaceholderText}>Changer la photo</Text>
            </View>
          )}
          <Text style={[styles.changePhotoText, { color: primary }]}>Appuie pour changer</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Titre *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={80} />

        <Text style={styles.label}>Prix (FCFA) *</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={300}
        />

        <Text style={styles.label}>Catégorie *</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && { backgroundColor: primary, borderColor: primary }]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tailles disponibles</Text>
        <View style={styles.chips}>
          {SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.chip, isSelected("size", size) && { backgroundColor: primary, borderColor: primary }]}
              onPress={() => toggleVariation("size", size)}
            >
              <Text style={[styles.chipText, isSelected("size", size) && styles.chipTextSelected]}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Couleurs disponibles</Text>
        <View style={styles.chips}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.chip, isSelected("color", color) && { backgroundColor: primary, borderColor: primary }]}
              onPress={() => toggleVariation("color", color)}
            >
              <Text style={[styles.chipText, isSelected("color", color) && styles.chipTextSelected]}>{color}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: primary }, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 20, paddingBottom: 110 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 15, color: "#9333ea", fontWeight: "600" },
  pageTitle: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  imageSection: { alignItems: "center", marginBottom: 24 },
  imagePreview: { width: 160, height: 160, borderRadius: 16, marginBottom: 8 },
  imagePlaceholder: {
    width: 160, height: 160, borderRadius: 16, borderWidth: 2,
    borderColor: "#e5e5e5", borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  imagePlaceholderIcon: { fontSize: 36, marginBottom: 6 },
  imagePlaceholderText: { color: "#999", fontSize: 13 },
  changePhotoText: { color: "#9333ea", fontSize: 13, fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 12,
    padding: 14, fontSize: 15, marginBottom: 16, backgroundColor: "#fafafa",
  },
  textarea: { height: 90, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "#fff", minWidth: 48, alignItems: "center",
  },
  chipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  chipTextSelected: { color: "#fff", fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#9333ea", borderRadius: 14,
    padding: 18, alignItems: "center", marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
