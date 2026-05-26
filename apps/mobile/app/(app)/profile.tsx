import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert, TextInput, ScrollView, Image, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { useConfig } from "../../context/ConfigContext";
import { uploadImage } from "../../lib/cloudinary";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import { BUSINESS_TYPES } from "../../lib/businessTypes";
import * as ExpoLocation from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import FadeSlide from "../../components/Animated/FadeSlide";
import CountUp from "../../components/Animated/CountUp";

const APP_URL = "https://panel-pub-web.vercel.app";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, bizType, refreshProfile, profile } = useAuth();
  const { primary, getPlanById } = useConfig();
  const [shopName, setShopName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [slogan, setSlogan] = useState("");
  const [description, setDescription] = useState("");
  const [shopLogoUrl, setShopLogoUrl] = useState("");
  const [city, setCity] = useState("");
  const [locating, setLocating] = useState(false);
  const [selectedBizType, setSelectedBizType] = useState(bizType.id);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [stats, setStats] = useState({ products: 0, rating: 0, ratingCount: 0 });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [bizCooldownHours, setBizCooldownHours] = useState(0);

  useEffect(() => {
    loadProfile();
    // Vérifier le cooldown restant pour le changement de catégorie
    const isFreePlan = getPlanById(profile?.plan || "free").id === "free";
    if (isFreePlan && user?.id) {
      AsyncStorage.getItem(`biz_type_changed_at_${user.id}`).then((str) => {
        if (str) {
          const elapsed = Date.now() - parseInt(str, 10);
          const cooldownMs = 24 * 60 * 60 * 1000;
          if (elapsed < cooldownMs) {
            setBizCooldownHours(Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000)));
          }
        }
      });
    }
  }, []);

  const loadProfile = async () => {
    const [{ data }, { count: productCount }, { data: ratingsData }] = await Promise.all([
      supabase.from("users").select("shop_name, phone_whatsapp, slogan, description, shop_logo_url, city, business_type").eq("id", user!.id).single(),
      supabase.from("products").select("id", { count: "exact" }).eq("user_id", user!.id),
      supabase.from("shop_ratings").select("rating").eq("shop_id", user!.id),
    ]);
    if (data) {
      setShopName(data.shop_name ?? "");
      setWhatsapp(data.phone_whatsapp ?? "");
      setSlogan(data.slogan ?? "");
      setDescription(data.description ?? "");
      setShopLogoUrl(data.shop_logo_url ?? "");
      setCity((data as any).city ?? "");
      if ((data as any).business_type) setSelectedBizType((data as any).business_type);
    }
    const avg = ratingsData && ratingsData.length > 0
      ? ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length
      : 0;
    setStats({ products: productCount || 0, rating: avg, ratingCount: ratingsData?.length || 0 });
  };

  const saveProfile = async () => {
    // Vérifier la limite WhatsApp (max 3 boutiques par numéro)
    if (whatsapp && whatsapp.trim().length > 0) {
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("phone_whatsapp", whatsapp.trim())
        .neq("id", user!.id);
      if ((count || 0) >= 3) {
        Alert.alert("Numéro déjà utilisé", "Ce numéro WhatsApp est déjà associé à 3 boutiques (maximum autorisé). Utilise un autre numéro.");
        return;
      }
    }

    // Cooldown changement de catégorie — plan gratuit : 1 fois toutes les 24h
    const bizTypeChanged = selectedBizType !== bizType.id;
    if (bizTypeChanged) {
      const isFreePlan = getPlanById(profile?.plan || "free").id === "free";
      if (isFreePlan) {
        const storageKey = `biz_type_changed_at_${user!.id}`;
        const lastChangeStr = await AsyncStorage.getItem(storageKey);
        if (lastChangeStr) {
          const elapsed = Date.now() - parseInt(lastChangeStr, 10);
          const cooldownMs = 24 * 60 * 60 * 1000;
          if (elapsed < cooldownMs) {
            const remaining = Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000));
            Alert.alert(
              "Limite atteinte",
              `Plan gratuit : tu peux changer de catégorie 1 fois par 24h.\nProchaine modification disponible dans ${remaining}h.`,
              [{ text: "OK" }]
            );
            return;
          }
        }
      }
    }

    setSaving(true);
    await supabase.from("users").update({
      shop_name: shopName,
      phone_whatsapp: whatsapp,
      slogan,
      description,
      shop_logo_url: shopLogoUrl,
      business_type: selectedBizType,
      city: city || null,
    }).eq("id", user!.id);

    // Enregistrer le timestamp du changement de catégorie
    if (bizTypeChanged) {
      await AsyncStorage.setItem(`biz_type_changed_at_${user!.id}`, Date.now().toString());
    }

    setSaving(false);
    setEditing(false);
    refreshProfile();
  };

  const handlePickLogo = async () => {
    // Logo boutique réservé au plan Pro et Annuel
    const p = getPlanById(profile?.plan || "free");
    if (p.id === "free") {
      Alert.alert(
        "🔒 Fonctionnalité Pro",
        "L'ajout d'un logo boutique est réservé aux plans Pro et Annuel.",
        [
          { text: "Fermer", style: "cancel" },
          { text: "Voir les forfaits", onPress: () => router.push("/(app)/plans") },
        ]
      );
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission refusée"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setUploadingLogo(true);
      try {
        const url = await uploadImage(result.assets[0].uri);
        setShopLogoUrl(url);
      } catch {
        Alert.alert("Erreur", "Échec de l'upload");
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const handleLocate = async () => {
    setLocating(true);
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorise l'accès à ta position pour localiser ta boutique.");
      setLocating(false);
      return;
    }
    const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
    const [address] = await ExpoLocation.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    const cityName = address?.city || address?.district || address?.subregion || "";
    setCity(cityName);
    // Sauvegarder les coordonnées directement
    await supabase.from("users").update({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      city: cityName,
    }).eq("id", user!.id);
    Alert.alert("Position enregistrée !", `Ville : ${cityName || "détectée"}`);
    setLocating(false);
  };

  const shareShopLink = async () => {
    const link = `${APP_URL}/shop/${user?.id}`;
    await Share.share({ message: `Découvrez ma boutique 🛍️\n${link}`, url: link });
  };

  const hasLogo = shopLogoUrl && shopLogoUrl.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Mon profil</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)} style={[styles.editToggle, { borderColor: primary }]}>
            <Text style={[styles.editToggleText, { color: primary }]}>{editing ? "Annuler" : "Modifier"}</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={24}>
          {/* Avatar / Logo */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={editing ? handlePickLogo : undefined} style={[styles.avatar, { backgroundColor: primary }]}>
              {uploadingLogo ? (
                <ActivityIndicator color="#fff" />
              ) : hasLogo ? (
                <Image source={{ uri: shopLogoUrl }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarText}>{shopName ? shopName[0].toUpperCase() : "?"}</Text>
              )}
              {editing && (
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.shopNameDisplay}>{shopName || "Ma Boutique"}</Text>
            <Text style={styles.bizTypeLabel}>{bizType.emoji} {bizType.label}</Text>
            <Text style={styles.emailDisplay}>{user?.email}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <CountUp value={stats.products} style={[styles.statValue, { color: primary }]} />
                <Text style={styles.statLabel}>Articles</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                {stats.ratingCount > 0 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <CountUp value={stats.rating} decimals={1} style={[styles.statValue, { color: primary }]} />
                    <Ionicons name="star" size={14} color="#f59e0b" />
                  </View>
                ) : (
                  <Text style={[styles.statValue, { color: primary }]}>—</Text>
                )}
                <CountUp value={stats.ratingCount} suffix=" avis" style={styles.statLabel} />
              </View>
            </View>
            {editing && (
              <TouchableOpacity onPress={handlePickLogo} style={[styles.changeLogoBtn, { borderColor: primary }]}>
                <Text style={[styles.changeLogoBtnText, { color: primary }]}>
                  {getPlanById(profile?.plan || "free").id === "free"
                    ? "🔒 Logo (Plan Pro)"
                    : uploadingLogo ? "Upload..." : hasLogo ? "Changer le logo" : "Ajouter un logo"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Type de business en mode édition */}
          {editing && (
            <View style={styles.bizSection}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={styles.bizSectionTitle}>Type de boutique</Text>
                {bizCooldownHours > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="time-outline" size={12} color="#f59e0b" />
                    <Text style={{ fontSize: 11, color: "#f59e0b", fontWeight: "600" }}>
                      Modifiable dans {bizCooldownHours}h
                    </Text>
                  </View>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {BUSINESS_TYPES.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => bizCooldownHours > 0 ? null : setSelectedBizType(b.id)}
                    style={[
                      styles.bizChip,
                      selectedBizType === b.id ? { backgroundColor: primary, borderColor: primary } : null,
                      (bizCooldownHours > 0 && b.id !== selectedBizType) ? { opacity: 0.4 } : null,
                    ]}
                  >
                    <Text style={styles.bizChipEmoji}>{b.emoji}</Text>
                    <Text style={[styles.bizChipLabel, selectedBizType === b.id && { color: "#fff" }]}>{b.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Infos éditables */}
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nom de la boutique</Text>
              {editing ? (
                <TextInput style={[styles.fieldInput, { borderBottomColor: primary }]} value={shopName} onChangeText={setShopName} />
              ) : (
                <Text style={styles.fieldValue}>{shopName || "—"}</Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Slogan (affiché sur ta vitrine)</Text>
              {editing ? (
                <TextInput style={[styles.fieldInput, { borderBottomColor: primary }]} value={slogan} onChangeText={setSlogan} placeholder="Ex: La mode africaine à son meilleur" maxLength={60} />
              ) : (
                <Text style={styles.fieldValue}>{slogan || "Non renseigné"}</Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description de la boutique</Text>
              {editing ? (
                <TextInput style={[styles.fieldInput, { minHeight: 60, borderBottomColor: primary }]} value={description} onChangeText={setDescription} placeholder="Décris ta boutique en quelques mots..." multiline maxLength={200} />
              ) : (
                <Text style={styles.fieldValue}>{description || "Non renseigné"}</Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ville / Localisation</Text>
              {editing ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TextInput
                    style={[styles.fieldInput, { borderBottomColor: primary, flex: 1 }]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Ex: Lomé, Abidjan, Dakar..."
                  />
                  <TouchableOpacity onPress={handleLocate} style={[styles.locateBtn, { borderColor: primary }]} disabled={locating}>
                    {locating
                      ? <ActivityIndicator size="small" color={primary} />
                      : <Ionicons name="locate" size={18} color={primary} />}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="location-outline" size={14} color="#aaa" />
                  <Text style={styles.fieldValue}>{city || "Non renseigné"}</Text>
                </View>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>WhatsApp (ex: +228XXXXXXXX)</Text>
              {editing ? (
                <TextInput style={[styles.fieldInput, { borderBottomColor: primary }]} value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="+228XXXXXXXX" />
              ) : (
                <Text style={styles.fieldValue}>{whatsapp || "Non renseigné"}</Text>
              )}
            </View>
          </View>

          {editing && (
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: primary }, saving && styles.saveBtnDisabled]} onPress={saveProfile} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.shareCard} onPress={shareShopLink}>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="share-social-outline" size={18} color={primary} />
                <Text style={styles.shareTitle}>Partage ta boutique</Text>
              </View>
              <Text style={styles.shareSubtitle}>Envoie le lien à tes clients</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={primary} />
          </TouchableOpacity>

          {/* Plan actuel + upgrade */}
          <TouchableOpacity
            style={[styles.planCard, { borderColor: profile?.plan === "free" || !profile?.plan ? "#fbbf24" : primary }]}
            onPress={() => router.push("/(app)/plans")}
          >
            <View style={styles.planCardTop}>
              <View>
                <Text style={styles.planCardLabel}>Mon forfait</Text>
                {(() => {
                  const p = getPlanById(profile?.plan || "free");
                  const isFree = p.id === "free";
                  return (<>
                    <Text style={[styles.planCardValue, { color: isFree ? "#d97706" : primary }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name={isFree ? "gift-outline" : p.is_popular ? "star" : "trophy"} size={16} color={isFree ? "#d97706" : primary} />
                        <Text style={[styles.planCardValue, { color: isFree ? "#d97706" : primary }]}>{p.name}</Text>
                      </View>
                    </Text>
                    <Text style={styles.planCardBilling}>
                      {p.price === 0 ? `Pour toujours · ${p.article_limit} articles max` : `${p.price.toLocaleString("fr-FR")} ${p.currency}/${p.billing}`}
                    </Text>
                  </>);
                })()}
              </View>
              <View style={styles.planCardRight}>
                {(profile?.plan === "free" || !profile?.plan) && (
                  <View style={styles.upgradePill}>
                    <Text style={styles.upgradePillText}>Passer au Pro</Text>
                  </View>
                )}
                <Text style={[styles.planCardCta, { color: primary }]}>{">"}</Text>
              </View>
            </View>
            {/* Barre d'utilisation */}
            {(() => {
              const p = getPlanById(profile?.plan || "free");
              const limit = p.article_limit;
              if (limit >= 999) return null; // illimité
              const pct = Math.min((stats.products / limit) * 100, 100);
              return (
                <View style={styles.planUsageWrap}>
                  <View style={styles.planUsageBar}>
                    <View style={[styles.planUsageFill, {
                      width: `${pct}%` as any,
                      backgroundColor: pct >= 80 ? "#dc2626" : pct >= 60 ? "#f59e0b" : primary,
                    }]} />
                  </View>
                  <Text style={styles.planUsageText}>{stats.products}/{limit} articles</Text>
                </View>
              );
            })()}
          </TouchableOpacity>

          <TouchableOpacity style={styles.pwdBtn} onPress={() => setPwdModalVisible(true)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="lock-closed-outline" size={18} color="#444" />
              <Text style={styles.pwdBtnText}>Changer le mot de passe</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert("Déconnexion", "Tu veux vraiment te déconnecter ?", [
            { text: "Annuler", style: "cancel" },
            { text: "Déconnecter", style: "destructive", onPress: signOut },
          ])}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="log-out-outline" size={18} color="#dc2626" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </View>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>

      <ChangePasswordModal
        visible={pwdModalVisible}
        onClose={() => setPwdModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fb" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  title: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  editToggle: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  editToggleText: { fontWeight: "700", fontSize: 13 },
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  avatarSection: { alignItems: "center", paddingVertical: 12, gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 4, overflow: "hidden" },
  avatarImg: { width: 80, height: 80 },
  avatarText: { fontSize: 36, fontWeight: "800", color: "#fff" },
  avatarEditBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10, paddingHorizontal: 4, paddingVertical: 2 },
  avatarEditBadgeText: { fontSize: 12 },
  changeLogoBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, marginTop: 4 },
  changeLogoBtnText: { fontSize: 13, fontWeight: "700" },
  shopNameDisplay: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  bizTypeLabel: { fontSize: 12, color: "#888", fontWeight: "500" },
  bizSection: { backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bizSectionTitle: { fontSize: 11, color: "#aaa", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  bizChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: "#eee", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fafafa" },
  bizChipEmoji: { fontSize: 16 },
  bizChipLabel: { fontSize: 12, fontWeight: "600", color: "#555" },
  emailDisplay: { fontSize: 13, color: "#999" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 20, marginTop: 8, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10 },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#aaa", fontWeight: "500" },
  statDivider: { width: 1, height: 30, backgroundColor: "#f0f0f0" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  field: { padding: 14 },
  fieldLabel: { fontSize: 11, color: "#aaa", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  fieldValue: { fontSize: 15, color: "#1a1a1a", fontWeight: "500" },
  fieldInput: { fontSize: 15, color: "#1a1a1a", borderBottomWidth: 1.5, paddingBottom: 4 },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginHorizontal: 14 },
  saveBtn: { borderRadius: 14, padding: 15, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  shareCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f7f9fb", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0" },
  shareTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 2 },
  shareSubtitle: { fontSize: 12, color: "#888" },
  shareArrow: { fontSize: 20, fontWeight: "700" },
  planCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1.5, gap: 12 },
  planCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  planCardRight: { alignItems: "flex-end", gap: 6 },
  planCardLabel: { fontSize: 11, color: "#aaa", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  planCardValue: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  planCardBilling: { fontSize: 12, color: "#888", marginTop: 2 },
  planCardCta: { fontSize: 18, fontWeight: "700" },
  upgradePill: { backgroundColor: "#fef3c7", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  upgradePillText: { fontSize: 11, color: "#d97706", fontWeight: "700" },
  planUsageWrap: { gap: 4 },
  planUsageBar: { height: 6, backgroundColor: "#f0f0f0", borderRadius: 3, overflow: "hidden" },
  planUsageFill: { height: 6, borderRadius: 3 },
  planUsageText: { fontSize: 11, color: "#888", textAlign: "right" },
  locateBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  pwdBtn: { backgroundColor: "#fff", borderRadius: 16, padding: 15, alignItems: "center", borderWidth: 1, borderColor: "#e5e5e5" },
  pwdBtnText: { color: "#444", fontWeight: "600", fontSize: 15 },
  logoutBtn: { backgroundColor: "#fff", borderRadius: 16, padding: 15, alignItems: "center", borderWidth: 1, borderColor: "#fee2e2" },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
});

