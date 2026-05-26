import { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/cloudinary";
import { useConfig } from "../../context/ConfigContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type Variation = { type: "size" | "color" | "custom"; value: string };

const { width: SW } = Dimensions.get("window");
const IMG_W = Math.min(SW, 680) - 32;
const IMG_H = IMG_W * 0.85;

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile, bizType } = useAuth();
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

  useEffect(() => { loadProduct(); }, [id]);

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
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const toggleVariation = (type: "size" | "color" | "custom", value: string) => {
    const exists = variations.find((v) => v.type === type && v.value === value);
    setVariations((prev) =>
      exists ? prev.filter((v) => !(v.type === type && v.value === value)) : [...prev, { type, value }]
    );
  };
  const isSelected = (type: "size" | "color" | "custom", value: string) =>
    variations.some((v) => v.type === type && v.value === value);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert("Champ manquant", "Le titre est obligatoire"); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { Alert.alert("Prix invalide", "Entre un prix valide"); return; }
    if (!category) { Alert.alert("Catégorie manquante", "Choisis une catégorie"); return; }

    // Cooldown plan gratuit
    const currentPlan = getPlanById(profile?.plan || "free");
    if (currentPlan.edit_cooldown_hours > 0) {
      const { data: productData } = await supabase.from("products").select("last_edited_at").eq("id", id).single();
      if (productData?.last_edited_at) {
        const elapsed = Date.now() - new Date(productData.last_edited_at).getTime();
        const cooldownMs = currentPlan.edit_cooldown_hours * 3600000;
        if (elapsed < cooldownMs) {
          const remaining = Math.ceil((cooldownMs - elapsed) / 3600000);
          const days = Math.floor(remaining / 24);
          const hours = remaining % 24;
          Alert.alert(
            "Modification trop récente",
            `Tu pourras modifier cet article dans ${days > 0 ? `${days}j ` : ""}${hours}h.\n\nPassez au plan Pro pour des modifications sans délai.`,
            [{ text: "OK" }, { text: "Voir les forfaits", onPress: () => router.push("/(app)/plans") }]
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
        title: title.trim(), price: Number(price),
        description: description.trim() || null, category, image_url,
        last_edited_at: new Date().toISOString(),
      }).eq("id", id);

      await supabase.from("product_variations").delete().eq("product_id", id);
      if (variations.length > 0) {
        await supabase.from("product_variations").insert(
          variations.map((v) => ({ product_id: id, type: v.type, value: v.value }))
        );
      }
      if (user?.id) {
        await supabase.from("product_edits").insert({ user_id: user.id, product_id: id });
      }

      Alert.alert("Article mis à jour ✅", "Les modifications ont été enregistrées.", [
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier l'article</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        enableOnAndroid
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PHOTO ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={18} color={primary} />
            <Text style={styles.sectionTitle}>Photo du produit</Text>
          </View>

          {displayImage ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: displayImage }} style={styles.imagePreview} resizeMode="cover" />
              <View style={styles.imageOverlayBtns}>
                <TouchableOpacity style={styles.imageOverlayBtn} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={16} color="#fff" />
                  <Text style={styles.imageOverlayBtnText}>Caméra</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageOverlayBtn} onPress={pickImage}>
                  <Ionicons name="images-outline" size={16} color="#fff" />
                  <Text style={styles.imageOverlayBtnText}>Galerie</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage} activeOpacity={0.8}>
              <View style={[styles.imagePlaceholderIcon, { backgroundColor: primary + "15" }]}>
                <Ionicons name="camera-outline" size={36} color={primary} />
              </View>
              <Text style={styles.imagePlaceholderTitle}>Ajouter une photo</Text>
              <Text style={styles.imagePlaceholderSub}>Une belle photo = plus de ventes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── INFORMATIONS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={18} color={primary} />
            <Text style={styles.sectionTitle}>Informations</Text>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Nom de l'article <Text style={{ color: "#ef4444" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
              placeholderTextColor="#c4c4c4"
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Prix (FCFA) <Text style={{ color: "#ef4444" }}>*</Text></Text>
            <View style={styles.priceWrap}>
              <TextInput
                style={[styles.input, styles.priceInput]}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor="#c4c4c4"
              />
              <View style={[styles.priceSuffix, { backgroundColor: primary + "15" }]}>
                <Text style={[styles.priceSuffixText, { color: primary }]}>FCFA</Text>
              </View>
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Description <Text style={styles.optional}>(optionnel)</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
              placeholderTextColor="#c4c4c4"
            />
            <Text style={styles.charCount}>{description.length}/300</Text>
          </View>
        </View>

        {/* ── CATÉGORIE ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={18} color={primary} />
            <Text style={styles.sectionTitle}>Catégorie <Text style={{ color: "#ef4444" }}>*</Text></Text>
          </View>
          <View style={styles.chips}>
            {bizType.categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && { backgroundColor: primary, borderColor: primary }]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && { color: "#fff", fontWeight: "700" }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── VARIATIONS ── */}
        {(bizType.variationTypes.sizes || bizType.variationTypes.colors || bizType.variationTypes.custom) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="options-outline" size={18} color={primary} />
              <Text style={styles.sectionTitle}>Options disponibles <Text style={styles.optional}>(optionnel)</Text></Text>
            </View>

            {bizType.variationTypes.sizes && (
              <View style={styles.varGroup}>
                <Text style={styles.varGroupLabel}>{bizType.variationTypes.sizes.label}</Text>
                <View style={styles.chips}>
                  {bizType.variationTypes.sizes.values.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.chip, isSelected("size", v) && { backgroundColor: primary, borderColor: primary }]}
                      onPress={() => toggleVariation("size", v)}
                    >
                      <Text style={[styles.chipText, isSelected("size", v) && { color: "#fff", fontWeight: "700" }]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {bizType.variationTypes.colors && (
              <View style={styles.varGroup}>
                <Text style={styles.varGroupLabel}>{bizType.variationTypes.colors.label}</Text>
                <View style={styles.chips}>
                  {bizType.variationTypes.colors.values.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.chip, isSelected("color", v) && { backgroundColor: primary, borderColor: primary }]}
                      onPress={() => toggleVariation("color", v)}
                    >
                      <Text style={[styles.chipText, isSelected("color", v) && { color: "#fff", fontWeight: "700" }]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {bizType.variationTypes.custom && (
              <View style={styles.varGroup}>
                <Text style={styles.varGroupLabel}>{bizType.variationTypes.custom.label}</Text>
                <View style={styles.chips}>
                  {bizType.variationTypes.custom.values.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.chip, isSelected("custom", v) && { backgroundColor: primary, borderColor: primary }]}
                      onPress={() => toggleVariation("custom", v)}
                    >
                      <Text style={[styles.chipText, isSelected("custom", v) && { color: "#fff", fontWeight: "700" }]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── BOUTON ENREGISTRER ── */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: primary }, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
            </>
          )}
        </TouchableOpacity>

      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },

  scroll: { padding: 16, paddingBottom: 40, gap: 12 },

  section: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },

  imageWrap: { position: "relative", borderRadius: 16, overflow: "hidden" },
  imagePreview: { width: "100%", height: IMG_H, borderRadius: 16 },
  imageOverlayBtns: {
    position: "absolute", bottom: 12, right: 12,
    flexDirection: "row", gap: 8,
  },
  imageOverlayBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  imageOverlayBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  imagePlaceholder: {
    width: "100%", height: IMG_H * 0.7,
    borderRadius: 16, borderWidth: 2, borderColor: "#e5e7eb", borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", gap: 10,
    backgroundColor: "#fafbfc",
  },
  imagePlaceholderIcon: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: "center", alignItems: "center",
  },
  imagePlaceholderTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  imagePlaceholderSub: { fontSize: 12, color: "#9ca3af" },

  fieldWrap: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 6 },
  optional: { fontSize: 12, fontWeight: "400", color: "#9ca3af" },
  input: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: "#1a1a1a", backgroundColor: "#fafafa",
  },
  priceWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceInput: { flex: 1 },
  priceSuffix: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13, justifyContent: "center" },
  priceSuffixText: { fontSize: 14, fontWeight: "800" },
  textarea: { height: 90, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 4 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9, backgroundColor: "#fff",
  },
  chipText: { fontSize: 13, color: "#374151", fontWeight: "500" },

  varGroup: { marginBottom: 14 },
  varGroupLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginBottom: 8 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 18, paddingVertical: 18,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
