import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
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
    // Utiliser total_articles_created (compteur cumulé, même après suppression)
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
    if (status !== "granted") {
      Alert.alert("Permission refusée", "On a besoin d'accéder à ta galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "On a besoin d'accéder à ta caméra.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const toggleVariation = (type: "size" | "color" | "custom", value: string) => {
    const exists = variations.find((v) => v.type === type && v.value === value);
    if (exists) {
      setVariations((prev) => prev.filter((v) => !(v.type === type && v.value === value)));
    } else {
      setVariations((prev) => [...prev, { type, value }]);
    }
  };

  const isSelected = (type: "size" | "color" | "custom", value: string) =>
    variations.some((v) => v.type === type && v.value === value);

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert("Erreur", "Le titre est obligatoire"); return; }
    if (!price || isNaN(Number(price))) { Alert.alert("Erreur", "Le prix est invalide"); return; }
    if (!category) { Alert.alert("Erreur", "Choisis une catégorie"); return; }

    setLoading(true);
    try {
      let image_url: string | null = null;
      if (imageUri) image_url = await uploadImage(imageUri);

      const { data: product, error } = await supabase
        .from("products")
        .insert({
          user_id: user!.id,
          title: title.trim(),
          price: Number(price),
          description: description.trim() || null,
          category,
          image_url,
        })
        .select()
        .single();

      if (error) throw error;

      if (variations.length > 0) {
        await supabase.from("product_variations").insert(
          variations.map((v) => ({ product_id: product.id, type: v.type, value: v.value }))
        );
      }

      Alert.alert("Succès !", "Article ajouté à ta boutique 🎉", [
        { text: "OK", onPress: () => router.replace("/(app)/dashboard") },
      ]);
    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (limitReached) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.limitWrap}>
          <Ionicons name="lock-closed" size={64} color="#1a1a1a" />
          <Text style={styles.limitTitle}>Limite atteinte</Text>
          <Text style={styles.limitText}>
            {(() => {
              const p = getPlanById(profile?.plan || "free");
              return `Le plan ${p.name} est limité à ${p.article_limit} articles créés.\nTu as créé ${productCount} article${productCount > 1 ? "s" : ""} au total.\n\nLes articles supprimés comptent toujours.`;
            })()}
          </Text>
          <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: primary }]} onPress={() => router.back()}>
            <Text style={styles.upgradeBtnText}>Passer au plan Pro pour continuer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Retour au dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" enableOnAndroid extraScrollHeight={24}>
        <Text style={styles.pageTitle}>{bizType.ui.addBtn}</Text>

        {/* Photo */}
        <View style={styles.imageSection}>
          {imageUri ? (
            <TouchableOpacity onPress={pickImage}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            </TouchableOpacity>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#bbb" />
              <Text style={styles.imagePlaceholderText}>Ajoute une photo</Text>
            </View>
          )}
          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageBtn} onPress={takePhoto}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="camera-outline" size={16} color="#444" />
                <Text style={styles.imageBtnText}>Caméra</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="images-outline" size={16} color="#444" />
                <Text style={styles.imageBtnText}>Galerie</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.label}>Titre *</Text>
        <TextInput
          style={styles.input}
          placeholder={bizType.ui.titlePlaceholder}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />

        {/* Prix */}
        <Text style={styles.label}>Prix (FCFA) *</Text>
        <TextInput
          style={styles.input}
          placeholder={bizType.ui.pricePlaceholder}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={bizType.ui.descPlaceholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={300}
        />

        {/* Catégorie */}
        <Text style={styles.label}>Catégorie *</Text>
        <View style={styles.chips}>
          {bizType.categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && { backgroundColor: primary, borderColor: primary }]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tailles / Pointures / Longueurs */}
        {bizType.variationTypes.sizes && (
          <>
            <Text style={styles.label}>{bizType.variationTypes.sizes.label}</Text>
            <View style={styles.chips}>
              {bizType.variationTypes.sizes.values.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, isSelected("size", v) && { backgroundColor: primary, borderColor: primary }]}
                  onPress={() => toggleVariation("size", v)}
                >
                  <Text style={[styles.chipText, isSelected("size", v) && styles.chipTextSelected]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Couleurs / Variantes */}
        {bizType.variationTypes.colors && (
          <>
            <Text style={styles.label}>{bizType.variationTypes.colors.label}</Text>
            <View style={styles.chips}>
              {bizType.variationTypes.colors.values.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, isSelected("color", v) && { backgroundColor: primary, borderColor: primary }]}
                  onPress={() => toggleVariation("color", v)}
                >
                  <Text style={[styles.chipText, isSelected("color", v) && styles.chipTextSelected]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Option personnalisée (matière, portion...) */}
        {bizType.variationTypes.custom && (
          <>
            <Text style={styles.label}>{bizType.variationTypes.custom.label}</Text>
            <View style={styles.chips}>
              {bizType.variationTypes.custom.values.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, isSelected("custom", v) && { backgroundColor: primary, borderColor: primary }]}
                  onPress={() => toggleVariation("custom", v)}
                >
                  <Text style={[styles.chipText, isSelected("custom", v) && styles.chipTextSelected]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Bouton */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: primary }, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Publier</Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20, paddingBottom: 110 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#1a1a1a", marginBottom: 24 },

  imageSection: { alignItems: "center", marginBottom: 24 },
  imagePreview: { width: 180, height: 180, borderRadius: 16, marginBottom: 12 },
  imagePlaceholder: {
    width: 180, height: 180, borderRadius: 16, borderWidth: 2,
    borderColor: "#e5e5e5", borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  imagePlaceholderIcon: { fontSize: 40, marginBottom: 8 },
  imagePlaceholderText: { color: "#999", fontSize: 14 },
  imageButtons: { flexDirection: "row", gap: 12 },
  imageBtn: {
    borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  imageBtnText: { fontSize: 14, color: "#444" },

  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 12,
    padding: 14, fontSize: 15, marginBottom: 16,
    backgroundColor: "#fff", color: "#1a1a1a",
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

  submitBtn: {
    backgroundColor: "#9333ea", borderRadius: 14,
    padding: 18, alignItems: "center", marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  limitWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
  limitIcon: { fontSize: 64 },
  limitTitle: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  limitText: { fontSize: 15, color: "#666", textAlign: "center", lineHeight: 22 },
  upgradeBtn: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  upgradeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  backLink: { padding: 8 },
  backLinkText: { color: "#aaa", fontSize: 14 },
});
