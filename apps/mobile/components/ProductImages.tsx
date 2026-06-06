import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert, Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width: SW } = Dimensions.get("window");
const IMG_W = Math.min(SW, 680) - 32;
const IMG_H = IMG_W * 0.85;

/**
 * Galerie d'images produit, partagée entre add-product et edit-product.
 * Gère une liste ordonnée d'URI (locales ou distantes). La première = couverture.
 * - maxImages = 1 (plan gratuit) : une seule grande photo, comportement classique.
 * - maxImages > 1 (premium) : bande de vignettes + ajout / suppression / définir couverture.
 * L'upload réel est géré par l'écran parent au moment de la sauvegarde.
 */
export function ProductImages({
  images, onChange, maxImages, primary,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  maxImages: number;
  primary: string;
}) {
  const router = useRouter();
  const canAdd = images.length < maxImages;
  const single = maxImages <= 1;

  const addUris = (uris: string[]) => {
    const room = maxImages - images.length;
    if (room <= 0) return;
    onChange([...images, ...uris.slice(0, room)]);
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission refusée", "On a besoin d'accéder à ta galerie."); return; }
    const remaining = maxImages - images.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: !single,
      selectionLimit: Math.max(remaining, 1),
      quality: 0.8,
      ...(single ? { allowsEditing: true, aspect: [1, 1] as [number, number] } : {}),
    });
    if (!result.canceled) {
      if (single) onChange([result.assets[0].uri]);
      else addUris(result.assets.map((a) => a.uri));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission refusée", "On a besoin d'accéder à ta caméra."); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: single, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) {
      if (single) onChange([result.assets[0].uri]);
      else addUris(result.assets.map((a) => a.uri));
    }
  };

  const removeAt = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(images.filter((_, idx) => idx !== i));
  };

  const makeCover = (i: number) => {
    if (i === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = [...images];
    const [it] = next.splice(i, 1);
    next.unshift(it);
    onChange(next);
  };

  /* ── Mode plan gratuit : une seule grande photo ── */
  if (single) {
    const cover = images[0] ?? null;
    return (
      <View>
        {cover ? (
          <View style={s.coverWrap}>
            <Image source={{ uri: cover }} style={s.coverImg} resizeMode="cover" />
            <View style={s.coverBtns}>
              <TouchableOpacity style={s.coverBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={16} color="#fff" />
                <Text style={s.coverBtnText}>Caméra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.coverBtn} onPress={pickImages}>
                <Ionicons name="images-outline" size={16} color="#fff" />
                <Text style={s.coverBtnText}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.placeholder} onPress={pickImages} activeOpacity={0.8}>
            <View style={[s.placeholderIcon, { backgroundColor: primary + "15" }]}>
              <Ionicons name="camera-outline" size={36} color={primary} />
            </View>
            <Text style={s.placeholderTitle}>Ajouter une photo</Text>
            <Text style={s.placeholderSub}>Une belle photo = plus de ventes</Text>
          </TouchableOpacity>
        )}

        {/* Incitation upgrade */}
        <TouchableOpacity style={s.upsell} onPress={() => router.push("/(app)/plans")} activeOpacity={0.8}>
          <Ionicons name="images" size={14} color={primary} />
          <Text style={[s.upsellText, { color: primary }]}>
            Passe au Pro pour ajouter jusqu'à 6 photos par article
          </Text>
          <Ionicons name="chevron-forward" size={14} color={primary} />
        </TouchableOpacity>
      </View>
    );
  }

  /* ── Mode premium : galerie de vignettes ── */
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.strip}>
        {images.map((uri, i) => (
          <View key={`${uri}-${i}`} style={s.thumbWrap}>
            <Image source={{ uri }} style={s.thumb} resizeMode="cover" />

            {/* Badge couverture / bouton définir couverture */}
            {i === 0 ? (
              <View style={[s.coverBadge, { backgroundColor: primary }]}>
                <Ionicons name="star" size={10} color="#fff" />
                <Text style={s.coverBadgeText}>Couverture</Text>
              </View>
            ) : (
              <TouchableOpacity style={s.setCoverBtn} onPress={() => makeCover(i)}>
                <Ionicons name="star-outline" size={12} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Supprimer */}
            <TouchableOpacity style={s.removeBtn} onPress={() => removeAt(i)}>
              <Ionicons name="close" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Tuile d'ajout */}
        {canAdd && (
          <TouchableOpacity style={[s.addTile, { borderColor: primary + "55" }]} onPress={pickImages} activeOpacity={0.7}>
            <Ionicons name="add" size={28} color={primary} />
            <Text style={[s.addTileText, { color: primary }]}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Compteur + caméra */}
      <View style={s.footerRow}>
        <Text style={s.counter}>{images.length}/{maxImages} photos</Text>
        {canAdd && (
          <TouchableOpacity style={s.cameraLink} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={15} color="#6b7280" />
            <Text style={s.cameraLinkText}>Prendre une photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {images.length === 0 && (
        <Text style={s.hint}>La première photo sera la couverture affichée dans ta boutique.</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // Single (gratuit)
  coverWrap: { position: "relative", borderRadius: 16, overflow: "hidden" },
  coverImg: { width: "100%", height: IMG_H, borderRadius: 16 },
  coverBtns: { position: "absolute", bottom: 12, right: 12, flexDirection: "row", gap: 8 },
  coverBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  coverBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  placeholder: {
    width: "100%", height: IMG_H * 0.7,
    borderRadius: 16, borderWidth: 2, borderColor: "#e5e7eb", borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#fafbfc",
  },
  placeholderIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  placeholderTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  placeholderSub: { fontSize: 12, color: "#9ca3af" },
  upsell: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12,
    backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: "#eef2f7",
  },
  upsellText: { flex: 1, fontSize: 12, fontWeight: "700" },

  // Premium gallery
  strip: { gap: 10, paddingVertical: 2 },
  thumbWrap: { width: 104, height: 104, borderRadius: 14, overflow: "hidden", position: "relative", backgroundColor: "#f3f4f6" },
  thumb: { width: 104, height: 104 },
  coverBadge: {
    position: "absolute", bottom: 6, left: 6,
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3,
  },
  coverBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  setCoverBtn: {
    position: "absolute", bottom: 6, left: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center",
  },
  removeBtn: {
    position: "absolute", top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center",
  },
  addTile: {
    width: 104, height: 104, borderRadius: 14,
    borderWidth: 2, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", gap: 4, backgroundColor: "#fafbfc",
  },
  addTileText: { fontSize: 12, fontWeight: "700" },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  counter: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  cameraLink: { flexDirection: "row", alignItems: "center", gap: 5 },
  cameraLinkText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  hint: { fontSize: 11, color: "#9ca3af", marginTop: 8, lineHeight: 16 },
});
