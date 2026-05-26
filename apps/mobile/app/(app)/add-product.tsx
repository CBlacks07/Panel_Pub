import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, Dimensions, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/cloudinary";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type Variation = { type: "size" | "color" | "custom"; value: string };

const { width: SW } = Dimensions.get("window");
const IMG_W = Math.min(SW, 680) - 32;
const IMG_H = IMG_W * 0.85;

export default function AddProductScreen() {
  const router = useRouter();
  const { user, profile, bizType } = useAuth();
  const { primary, getPlanById } = useConfig();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("users").select("total_articles_created").eq("id", user.id).single()
      .then(({ data }) => {
        const currentPlan = getPlanById(profile?.plan || "free");
        const limit = currentPlan.article_limit;
        const total = data?.total_articles_created || 0;
        setProductCount(total);
        setLimitReached(total >= limit);
      });
  }, [user?.id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission refusée", "On a besoin d'accéder à ta galerie."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission refusée", "On a besoin d'accéder à ta caméra."); return; }
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

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert("Champ manquant", "Le titre est obligatoire"); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { Alert.alert("Prix invalide", "Entre un prix valide"); return; }
    if (!category) { Alert.alert("Catégorie manquante", "Choisis une catégorie pour ton article"); return; }

    setLoading(true);
    try {
      let image_url: string | null = null;
      if (imageUri) image_url = await uploadImage(imageUri);

      const { data: product, error } = await supabase.from("products").insert({
        user_id: user!.id,
        title: title.trim(),
        price: Number(price),
        description: description.trim() || null,
        category, image_url,
      }).select().single();

      if (error) throw error;

      if (variations.length > 0) {
        await supabase.from("product_variations").insert(
          variations.map((v) => ({ product_id: product.id, type: v.type, value: v.value }))
        );
      }

      Alert.alert("Article publié ! 🎉", "Ton article est maintenant visible dans ta boutique.", [
        { text: "Voir ma boutique", onPress: () => router.replace("/(app)/dashboard") },
      ]);
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (limitReached) {
    const plan = getPlanById(profile?.plan || "free");
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.limitScreen}>
          <View style={[styles.limitIconWrap, { backgroundColor: primary + "15" }]}>
            <Ionicons name="lock-closed" size={40} color={primary} />
          </View>
          <Text style={styles.limitTitle}>Limite atteinte</Text>
          <Text style={styles.limitText}>
            Le plan <Text style={{ fontWeight: "700" }}>{plan.name}</Text> est limité à{" "}
            <Text style={{ fontWeight: "700" }}>{plan.article_limit} articles</Text> créés au total.{"\n"}
            Tu en as créé {productCount}. Les articles supprimés comptent quand même.
          </Text>
          <TouchableOpacity style={[styles.upgradeCta, { backgroundColor: primary }]} onPress={() => router.push("/(app)/plans")}>
            <Ionicons name="rocket-outline" size={18} color="#fff" />
            <Text style={styles.upgradeCtaText}>Passer au plan Pro</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Retour au dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{bizType.ui.addBtn}</Text>
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

          {imageUri ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={[styles.changeImgBtn, { backgroundColor: primary }]} onPress={pickImage}>
                <Ionicons name="pencil" size={14} color="#fff" />
                <Text style={styles.changeImgBtnText}>Changer</Text>
              </TouchableOpacity>
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

          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.imageActionBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={16} color="#555" />
              <Text style={styles.imageActionText}>Prendre une photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageActionBtn} onPress={pickImage}>
              <Ionicons name="images-outline" size={16} color="#555" />
              <Text style={styles.imageActionText}>Depuis la galerie</Text>
            </TouchableOpacity>
          </View>
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
              placeholder={bizType.ui.titlePlaceholder}
              placeholderTextColor="#c4c4c4"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Prix (FCFA) <Text style={{ color: "#ef4444" }}>*</Text></Text>
            <View style={styles.priceWrap}>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder={bizType.ui.pricePlaceholder}
                placeholderTextColor="#c4c4c4"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
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
              placeholder={bizType.ui.descPlaceholder}
              placeholderTextColor="#c4c4c4"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
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

        {/* ── BOUTON PUBLIER ── */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: primary }, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Publier l'article</Text>
            </>
          )}
        </TouchableOpacity>

      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },

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
    backgroundColor: "#fff", borderRadius: 20,
    padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },

  // Image
  imageWrap: { position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  imagePreview: { width: "100%", height: IMG_H, borderRadius: 16 },
  changeImgBtn: {
    position: "absolute", bottom: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  changeImgBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  imagePlaceholder: {
    width: "100%", height: IMG_H * 0.7,
    borderRadius: 16, borderWidth: 2, borderColor: "#e5e7eb", borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 12,
    backgroundColor: "#fafbfc",
  },
  imagePlaceholderIcon: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: "center", alignItems: "center",
  },
  imagePlaceholderTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  imagePlaceholderSub: { fontSize: 12, color: "#9ca3af" },
  imageActions: { flexDirection: "row", gap: 10 },
  imageActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingVertical: 10, backgroundColor: "#fafafa",
  },
  imageActionText: { fontSize: 13, fontWeight: "600", color: "#555" },

  // Form
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
  priceSuffix: {
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13,
    justifyContent: "center", alignItems: "center",
  },
  priceSuffixText: { fontSize: 14, fontWeight: "800" },
  textarea: { height: 90, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 4 },

  // Chips
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: "#fff",
  },
  chipText: { fontSize: 13, color: "#374151", fontWeight: "500" },

  // Variations
  varGroup: { marginBottom: 14 },
  varGroupLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginBottom: 8 },

  // Submit
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 18, paddingVertical: 18,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },

  // Limite
  limitScreen: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
  limitIconWrap: { width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center" },
  limitTitle: { fontSize: 22, fontWeight: "900", color: "#1a1a1a" },
  limitText: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 22 },
  upgradeCta: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14,
  },
  upgradeCtaText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  backLink: { padding: 8 },
  backLinkText: { color: "#9ca3af", fontSize: 14 },
});
