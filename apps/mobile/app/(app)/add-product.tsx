import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/cloudinary";
import { getImageLimit } from "../../lib/plans";
import { ProductImages } from "../../components/ProductImages";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type Variation = { type: "size" | "color" | "custom"; value: string };

export default function AddProductScreen() {
  const router = useRouter();
  const { user, profile, bizType } = useAuth();
  const { primary, getPlanById } = useConfig();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [productCount, setProductCount] = useState(0);

  const maxImages = getImageLimit(getPlanById(profile?.plan || "free"));

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
      // Upload de toutes les photos (la 1re = couverture)
      const uploaded = await Promise.all(images.map((uri) => uploadImage(uri)));
      const image_url = uploaded[0] ?? null;

      const { data: product, error } = await supabase.from("products").insert({
        user_id: user!.id,
        title: title.trim(),
        price: Number(price),
        description: description.trim() || null,
        category, image_url, images: uploaded,
      }).select().single();

      if (error) throw error;

      if (variations.length > 0) {
        await supabase.from("product_variations").insert(
          variations.map((v) => ({ product_id: product.id, type: v.type, value: v.value }))
        );
      }

      toast("Article publié — visible dans ta boutique");
      router.replace("/(app)/dashboard");
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
      <ScreenHeader title={bizType.ui.addBtn} onBack={() => router.back()} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        enableOnAndroid
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PHOTOS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={18} color={primary} />
            <Text style={styles.sectionTitle}>
              {maxImages > 1 ? "Photos du produit" : "Photo du produit"}
            </Text>
          </View>

          <ProductImages images={images} onChange={setImages} maxImages={maxImages} primary={primary} />
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
              <Chip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(cat)} />
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
                    <Chip key={v} label={v} selected={isSelected("size", v)} onPress={() => toggleVariation("size", v)} />
                  ))}
                </View>
              </View>
            )}

            {bizType.variationTypes.colors && (
              <View style={styles.varGroup}>
                <Text style={styles.varGroupLabel}>{bizType.variationTypes.colors.label}</Text>
                <View style={styles.chips}>
                  {bizType.variationTypes.colors.values.map((v) => (
                    <Chip key={v} label={v} selected={isSelected("color", v)} onPress={() => toggleVariation("color", v)} />
                  ))}
                </View>
              </View>
            )}

            {bizType.variationTypes.custom && (
              <View style={styles.varGroup}>
                <Text style={styles.varGroupLabel}>{bizType.variationTypes.custom.label}</Text>
                <View style={styles.chips}>
                  {bizType.variationTypes.custom.values.map((v) => (
                    <Chip key={v} label={v} selected={isSelected("custom", v)} onPress={() => toggleVariation("custom", v)} />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── BOUTON PUBLIER ── */}
        <Button label="Publier l'article" icon="cloud-upload-outline" loading={loading} onPress={handleSubmit} />

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
