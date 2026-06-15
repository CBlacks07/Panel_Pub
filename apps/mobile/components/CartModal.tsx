import {
  View, Text, Modal, TouchableOpacity, FlatList,
  StyleSheet, Image, Dimensions, Platform, TextInput, Alert, KeyboardAvoidingView,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCartStore } from "../store/cartStore";
import { buildWhatsAppMessage, openWhatsApp } from "../lib/whatsapp";
import { optimizeImage } from "../lib/cloudinary";
import { useConfig } from "../context/ConfigContext";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  whatsappPhone: string | null;
  itemLabel?: string;
};

export default function CartModal({ visible, onClose, shopId, shopName, whatsappPhone, itemLabel = "article" }: Props) {
  const { primary } = useConfig();
  const insets = useSafeAreaInsets();
  const cartStore = useCartStore();
  const items = cartStore.getItems(shopId);
  const removeItem = (id: string) => cartStore.removeItem(shopId, id);
  const clear = () => cartStore.clear(shopId);
  const total = () => cartStore.total(shopId);

  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [quartier, setQuartier] = useState("");
  const [phone, setPhone] = useState("");

  // Réinitialise le formulaire quand le panier se ferme
  useEffect(() => {
    if (!visible) setShowDeliveryForm(false);
  }, [visible]);

  const handleOrderPress = () => {
    if (!whatsappPhone) return;
    setShowDeliveryForm(true);
  };

  const handleConfirmOrder = async () => {
    if (!quartier.trim()) {
      Alert.alert("Champ manquant", "Indique ton quartier de livraison");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Champ manquant", "Indique un numéro à appeler");
      return;
    }
    const deliveryInfo = `\n📍 Quartier : ${quartier.trim()}\n📞 Numéro à appeler : ${phone.trim()}`;
    const message = buildWhatsAppMessage(items, shopName) + deliveryInfo;
    setShowDeliveryForm(false);
    setQuartier("");
    setPhone("");
    await openWhatsApp(whatsappPhone!, message);
  };

  return (
    <>
    <Modal visible={visible && !showDeliveryForm} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.handle} />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mon panier</Text>
          <View style={styles.headerRight}>
            {items.length > 0 && (
              <TouchableOpacity onPress={clear} style={styles.clearBtn} accessibilityRole="button" accessibilityLabel="Vider le panier">
                <Text style={styles.clearBtnText}>Vider</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Fermer">
              <Ionicons name="close" size={16} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        {items.length === 0 ? (
          /* Panier vide */
          <View style={styles.empty}>
            <Ionicons name="bag-outline" size={56} color="#e5e5e5" />
            <Text style={styles.emptyTitle}>Panier vide</Text>
            <Text style={styles.emptySubtitle}>Ajoute des {itemLabel}s pour commander</Text>
          </View>
        ) : (
          <>
            {/* Liste articles */}
            <FlatList
              data={items}
              keyExtractor={(item, i) => `${item.id}-${i}`}
              contentContainerStyle={styles.list}
              style={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  {item.image_url ? (
                    <Image source={{ uri: optimizeImage(item.image_url, 160) ?? item.image_url }} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, { backgroundColor: "#f3e8ff", justifyContent: "center", alignItems: "center" }]}>
                      <Ionicons name="bag-outline" size={22} color="#aaa" />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.itemVariants}>
                      {item.selectedSize && <View style={styles.varTag}><Text style={styles.varTagText}>{item.selectedSize}</Text></View>}
                      {item.selectedColor && <View style={styles.varTag}><Text style={styles.varTagText}>{item.selectedColor}</Text></View>}
                    </View>
                    <Text style={[styles.itemPrice, { color: primary }]}>
                      {(item.price * item.quantity).toLocaleString("fr-FR")} FCFA
                      {item.quantity > 1 && <Text style={styles.itemQty}> ×{item.quantity}</Text>}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn} accessibilityRole="button" accessibilityLabel={`Retirer ${item.title}`}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Footer fixe */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{total().toLocaleString("fr-FR")} FCFA</Text>
              </View>
              {whatsappPhone ? (
                <TouchableOpacity style={styles.orderBtn} onPress={handleOrderPress} activeOpacity={0.8}>
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  <Text style={styles.orderBtnText}>Commander via WhatsApp</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.noWhatsapp}>
                  <Text style={styles.noWhatsappText}>Le vendeur n'a pas encore renseigné son numéro WhatsApp.</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
      </View>
    </Modal>

      {/* Formulaire livraison — modale séparée (non imbriquée pour éviter
          l'empilement de deux écrans) */}
      <Modal visible={visible && showDeliveryForm} animationType="slide" transparent onRequestClose={() => setShowDeliveryForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={[styles.deliveryForm, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.handle} />
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryTitle}>Infos de livraison</Text>
              <TouchableOpacity onPress={() => setShowDeliveryForm(false)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Fermer">
                <Ionicons name="close" size={16} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.deliverySubtitle}>Ces informations seront transmises au vendeur avec ta commande.</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>📍 Quartier de livraison</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ex: Adidogomé, Bè, Tokoin..."
                placeholderTextColor="#bbb"
                value={quartier}
                onChangeText={setQuartier}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>📞 Numéro à appeler</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ex: +228 90 00 00 00"
                placeholderTextColor="#bbb"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: "#25D366" }]} onPress={handleConfirmOrder} activeOpacity={0.8}>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.confirmBtnText}>Confirmer la commande</Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  handle: {
    alignSelf: "center", width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#e5e7eb", marginTop: 10, marginBottom: 2,
  },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: "#fff5f5" },
  clearBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 13 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f3f3f3", justifyContent: "center", alignItems: "center" },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  emptySubtitle: { fontSize: 14, color: "#aaa", textAlign: "center" },

  listContainer: { flexShrink: 1, flexGrow: 0, maxHeight: 300 },
  list: { padding: 16, gap: 12, paddingBottom: 8 },

  cartItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fafafa", borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: "#f0f0f0",
  },
  itemImage: { width: 64, height: 64, borderRadius: 12 },
  itemInfo: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  itemVariants: { flexDirection: "row", gap: 6 },
  varTag: { backgroundColor: "#f0f0f0", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  varTagText: { fontSize: 11, color: "#555", fontWeight: "600" },
  itemPrice: { fontSize: 14, fontWeight: "800" },
  itemQty: { fontSize: 12, color: "#aaa", fontWeight: "400" },
  removeBtn: { padding: 8 },

  footer: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: "#f0f0f0",
    gap: 14, backgroundColor: "#fff",
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, color: "#888", fontWeight: "600" },
  totalAmount: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  orderBtn: {
    backgroundColor: "#25D366", borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  orderBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  noWhatsapp: { backgroundColor: "#fffbeb", borderRadius: 12, padding: 14 },
  noWhatsappText: { color: "#92400e", fontSize: 13, textAlign: "center" },

  // Formulaire livraison
  deliveryForm: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  deliveryHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  deliveryTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  deliverySubtitle: { fontSize: 13, color: "#888", lineHeight: 18, marginTop: -8 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#444" },
  fieldInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: "#1a1a1a", backgroundColor: "#fafafa",
  },
  confirmBtn: {
    borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    marginTop: 4,
  },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
