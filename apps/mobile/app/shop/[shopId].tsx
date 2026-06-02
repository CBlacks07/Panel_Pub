import { useEffect, useState, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Modal, ScrollView,
  Dimensions, StatusBar, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useCartStore, CartItem } from "../../store/cartStore";
import { buildWhatsAppMessage, openWhatsApp } from "../../lib/whatsapp";
import CartModal from "../../components/CartModal";
import RatingModal from "../../components/RatingModal";
import StarRating from "../../components/StarRating";
import { useConfig } from "../../context/ConfigContext";
import { getBusinessType } from "../../lib/businessTypes";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const MAX_WIDTH = Math.min(screenWidth, 680);
const CARD_SIZE = (MAX_WIDTH - 48) / 2;
const IMG_HEIGHT = CARD_SIZE * 1.15;

/* ── Image produit avec shimmer + fallback ─────── */
function ProductImage({ uri, size, fallbackEmoji }: { uri: string | null; size: number; fallbackEmoji: string }) {
  const [loading, setLoading] = useState(!!uri);
  const [error, setError] = useState(false);
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!uri) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  if (!uri || error) {
    return (
      <View style={[productImageStyles.placeholder, { width: size, height: IMG_HEIGHT }]}>
        <Text style={{ fontSize: size * 0.28 }}>{fallbackEmoji}</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: IMG_HEIGHT }}>
      {loading && (
        <Animated.View
          style={[productImageStyles.shimmer, { width: size, height: IMG_HEIGHT, opacity: shimmer }]}
        />
      )}
      <Image
        source={{ uri }}
        style={{ width: size, height: IMG_HEIGHT }}
        resizeMode="cover"
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
    </View>
  );
}

const productImageStyles = StyleSheet.create({
  placeholder: { justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  shimmer: { position: "absolute", backgroundColor: "#e8e8e8", zIndex: 1 },
});

type Variation = { type: string; value: string };
type Product = {
  id: string;
  title: string;
  price: number;
  description: string | null;
  category: string;
  image_url: string | null;
  product_variations: Variation[];
};
type Shop = { shop_name: string; phone_whatsapp: string | null; slogan: string | null; description: string | null; shop_logo_url: string | null; suspended?: boolean; business_type?: string | null };

export default function ShopScreen() {
  const { shopId } = useLocalSearchParams<{ shopId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { primary } = useConfig();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [shopRating, setShopRating] = useState({ avg: 0, count: 0 });

  const cartAnim = useRef(new Animated.Value(0)).current;
  const whatsappPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(whatsappPulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(whatsappPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);
  const cartStore = useCartStore();
  const items = cartStore.getItems(shopId as string);
  const addItem = (item: CartItem) => cartStore.addItem(shopId as string, item);
  const total = () => cartStore.total(shopId as string);
  const clearCart = () => cartStore.clear(shopId as string);

  useEffect(() => {
    loadShop();
  }, [shopId]);

  useEffect(() => {
    Animated.spring(cartAnim, {
      toValue: items.length > 0 ? 1 : 0, // items est déjà scopé par shopId
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [items.length]);

  const loadShop = async () => {
    const [{ data: shopData }, { data: productsData }, { data: ratingsData }] = await Promise.all([
      supabase.from("users").select("shop_name, phone_whatsapp, slogan, description, shop_logo_url, suspended, business_type").eq("id", shopId).single(),
      supabase.from("products")
        .select("id, title, price, description, category, image_url, product_variations(type, value)")
        .eq("user_id", shopId)
        .order("created_at", { ascending: false }),
      supabase.from("shop_ratings").select("rating").eq("shop_id", shopId),
    ]);

    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length;
      setShopRating({ avg, count: ratingsData.length });
    }

    if (shopData) setShop(shopData);
    if (productsData) {
      setProducts(productsData);
      setFiltered(productsData);
      setCategories(["Tout", ...Array.from(new Set(productsData.map((p) => p.category)))]);
    }
    setLoading(false);
  };

  const filterByCategory = (cat: string) => {
    setActiveCategory(cat);
    setFiltered(cat === "Tout" ? products : products.filter((p) => p.category === cat));
  };

  const openProduct = (product: Product) => {
    setSelected(product);
    setSelectedSize(null);
    setSelectedColor(null);
    // Tracker la vue
    supabase.from("product_views").insert({ product_id: product.id }).then(() => {});
  };

  const handleAddToCart = () => {
    if (!selected) return;
    const sizes = selected.product_variations.filter((v) => v.type === "size");
    const colors = selected.product_variations.filter((v) => v.type === "color");
    if (sizes.length > 0 && !selectedSize) return;
    if (colors.length > 0 && !selectedColor) return;

    addItem({
      id: selected.id,
      title: selected.title,
      price: selected.price,
      image_url: selected.image_url,
      selectedSize,
      selectedColor,
      quantity: 1,
    });
    setSelected(null);
  };

  const handleWhatsApp = async () => {
    if (!shop?.phone_whatsapp) return;
    await openWhatsApp(shop.phone_whatsapp, buildWhatsAppMessage(items, shop.shop_name));
  };

  const cartTranslateY = cartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🔍</Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 }}>Boutique introuvable</Text>
        <Text style={{ fontSize: 14, color: "#888", textAlign: "center", paddingHorizontal: 40 }}>
          Cette boutique n'existe pas ou a été supprimée.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/marketplace")} style={{ marginTop: 24, backgroundColor: primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Voir toutes les boutiques</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (shop.suspended) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>⛔</Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 }}>Boutique suspendue</Text>
        <Text style={{ fontSize: 14, color: "#888", textAlign: "center", paddingHorizontal: 40 }}>
          Cette boutique a été temporairement suspendue.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/marketplace")} style={{ marginTop: 24, backgroundColor: primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Voir d'autres boutiques</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const shopBizType = getBusinessType(shop.business_type || "mode");
  const hasLogo = !!(shop.shop_logo_url && shop.shop_logo_url.trim().length > 0);

  return (
    <View style={styles.outerContainer}>
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={primary} />

      {/* ── HEADER avec bandeau gradient ── */}
      <View style={[styles.shopHeader, { backgroundColor: primary }]}>
        {/* Décoration fond */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />

        {/* Boutons flottants */}
        <TouchableOpacity onPress={() => router.canGoBack() && router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setCartVisible(true)}>
          <Ionicons name="bag-handle-outline" size={22} color="#fff" />
          {items.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{items.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Logo + infos */}
        <View style={styles.shopHeaderCenter}>
          <View style={[styles.shopAvatar, { borderColor: primary + "60" }]}>
            <View style={[styles.shopAvatarInner, { backgroundColor: hasLogo ? "#fff" : primary + "cc" }]}>
              {hasLogo ? (
                <Image source={{ uri: shop.shop_logo_url! }} style={styles.shopAvatarImg} resizeMode="cover" />
              ) : (
                <Text style={styles.shopAvatarText}>{shop.shop_name[0].toUpperCase()}</Text>
              )}
            </View>
          </View>
          <Text style={styles.shopName}>{shop.shop_name}</Text>
          {shop.slogan ? (
            <Text style={styles.shopSlogan}>"{shop.slogan}"</Text>
          ) : null}
          {shopRating.count > 0 && (
            <StarRating rating={shopRating.avg} count={shopRating.count} size="sm" />
          )}
          <View style={styles.shopMetaRow}>
            <View style={styles.shopMetaChip}>
              <Text style={styles.shopMetaChipText}>{shopBizType.emoji} {shopBizType.label}</Text>
            </View>
            <View style={styles.shopMetaChip}>
              <Text style={styles.shopMetaChipText}>{products.length} {shopBizType.ui.itemLabel}{products.length > 1 ? "s" : ""}</Text>
            </View>
            <TouchableOpacity style={[styles.shopMetaChip, styles.rateChip]} onPress={() => setRatingVisible(true)}>
              <Ionicons name="star-outline" size={11} color="#f59e0b" />
              <Text style={[styles.shopMetaChipText, { color: "#f59e0b" }]}>Noter</Text>
            </TouchableOpacity>
          </View>
          {shop.description ? (
            <Text style={styles.shopDescription} numberOfLines={2}>{shop.description}</Text>
          ) : null}
        </View>
      </View>

      {/* ── FILTRES CATÉGORIES ── */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.categoriesBar}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryPill, activeCategory === cat && { backgroundColor: primary, borderColor: primary }]}
            onPress={() => filterByCategory(cat)}
          >
            <Text style={[styles.categoryPillText, activeCategory === cat && { color: "#fff" }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── GRILLE PRODUITS ── */}
      {products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{shopBizType.emoji}</Text>
          <Text style={styles.emptyTitle}>{shopBizType.ui.emptyTitle}</Text>
          <Text style={styles.emptyText}>{shopBizType.ui.emptySubtitle}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{shopBizType.emoji}</Text>
          <Text style={styles.emptyText}>Aucun {shopBizType.ui.itemLabel} dans cette catégorie</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[styles.grid, { paddingBottom: 120 + insets.bottom }]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openProduct(item)} activeOpacity={0.9}>
              {/* Image */}
              <View style={styles.cardImageWrap}>
                <ProductImage uri={item.image_url} size={CARD_SIZE} fallbackEmoji={shopBizType.emoji} />
                {/* Badge prix */}
                <View style={[styles.priceBadge, { backgroundColor: primary }]}>
                  <Text style={styles.priceBadgeText}>{item.price.toLocaleString("fr-FR")} F</Text>
                </View>
              </View>
              {/* Infos */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.cardCategory, { color: primary + "99" }]}>{item.category}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── BARRE PANIER FLOTTANTE ── */}
      <Animated.View style={[styles.cartBar, { bottom: insets.bottom + 16, transform: [{ translateY: cartTranslateY }] }]}>
        <TouchableOpacity style={styles.cartBarInner} onPress={() => setCartVisible(true)}>
          <View style={styles.cartBarLeft}>
            <Text style={styles.cartBarCount}>{items.length} article{items.length > 1 ? "s" : ""}</Text>
            <Text style={styles.cartBarTotal}>{total().toLocaleString("fr-FR")} FCFA</Text>
          </View>
          <Animated.View style={[styles.whatsappBtn, { transform: [{ scale: whatsappPulse }] }]}>
            <Ionicons name="logo-whatsapp" size={16} color="#fff" />
            <Text style={styles.whatsappBtnText}>Commander</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <CartModal visible={cartVisible} onClose={() => setCartVisible(false)} shopId={shopId as string} shopName={shop.shop_name} whatsappPhone={shop.phone_whatsapp} itemLabel={shopBizType.ui.itemLabel} />
      <RatingModal visible={ratingVisible} onClose={() => setRatingVisible(false)} shopId={shopId as string} shopName={shop.shop_name} onRated={() => loadShop()} />

      {/* ── MODAL PRODUIT ── */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={[styles.modal, { paddingTop: insets.top }]}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {/* Image — contain pour afficher entière sans recadrage */}
              <View style={styles.modalImageWrap}>
                <View style={styles.modalImageContainer}>
                  {selected.image_url ? (
                    <Image
                      source={{ uri: selected.image_url }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <Text style={{ fontSize: 80 }}>{shopBizType.emoji}</Text>
                    </View>
                  )}
                </View>
                {/* Bouton fermer */}
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={18} color="#1a1a1a" />
                </TouchableOpacity>
              </View>

              {/* Contenu */}
              <View style={styles.modalContent}>
                {/* Prix + catégorie */}
                <View style={styles.modalPriceRow}>
                  <Text style={[styles.modalPriceText, { color: primary }]}>
                    {selected.price.toLocaleString("fr-FR")} FCFA
                  </Text>
                  <View style={[styles.modalCatBadge, { backgroundColor: primary + "15" }]}>
                    <Text style={[styles.modalCatText, { color: primary }]}>{selected.category}</Text>
                  </View>
                </View>
                <Text style={styles.modalTitle}>{selected.title}</Text>

                {selected.description ? (
                  <Text style={styles.modalDescription}>{selected.description}</Text>
                ) : null}

                {/* Tailles */}
                {selected.product_variations.filter((v) => v.type === "size").length > 0 && (
                  <View style={styles.varSection}>
                    <Text style={styles.varLabel}>Taille</Text>
                    <View style={styles.varChips}>
                      {selected.product_variations.filter((v) => v.type === "size").map((v) => (
                        <TouchableOpacity
                          key={v.value}
                          style={[styles.varChip, selectedSize === v.value && { backgroundColor: primary, borderColor: primary }]}
                          onPress={() => setSelectedSize(v.value)}
                        >
                          <Text style={[styles.varChipText, selectedSize === v.value && { color: "#fff" }]}>{v.value}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Couleurs */}
                {selected.product_variations.filter((v) => v.type === "color").length > 0 && (
                  <View style={styles.varSection}>
                    <Text style={styles.varLabel}>Couleur</Text>
                    <View style={styles.varChips}>
                      {selected.product_variations.filter((v) => v.type === "color").map((v) => (
                        <TouchableOpacity
                          key={v.value}
                          style={[styles.varChip, selectedColor === v.value && { backgroundColor: primary, borderColor: primary }]}
                          onPress={() => setSelectedColor(v.value)}
                        >
                          <Text style={[styles.varChipText, selectedColor === v.value && { color: "#fff" }]}>{v.value}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity style={[styles.addToCartBtn, { backgroundColor: primary, shadowColor: primary }]} onPress={handleAddToCart}>
                  <Ionicons name="bag-add-outline" size={20} color="#fff" />
                  <Text style={styles.addToCartBtnText}>
                    {shopBizType.id === "alimentation" ? "Ajouter à ma commande" : "Ajouter au panier"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#f0f2f5", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#f0f2f5", width: "100%", maxWidth: 680 },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },

  // Header
  shopHeader: {
    paddingBottom: 20, paddingHorizontal: 16,
    alignItems: "center", overflow: "hidden", position: "relative",
  },
  headerCircle1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)", top: -60, right: -40,
  },
  headerCircle2: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)", top: -20, left: -30,
  },
  backBtn: {
    position: "absolute", top: 12, left: 12, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center",
  },
  cartBtn: {
    position: "absolute", top: 12, right: 12, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center",
  },
  cartBadge: {
    position: "absolute", top: 0, right: 0, borderRadius: 8,
    backgroundColor: "#ef4444",
    minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 3,
  },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  shopHeaderCenter: { alignItems: "center", gap: 6, paddingTop: 44, width: "100%" },
  shopAvatar: {
    width: 88, height: 88, borderRadius: 28, overflow: "hidden",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  shopAvatarInner: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  shopAvatarImg: { width: 88, height: 88 },
  shopAvatarText: { fontSize: 36, fontWeight: "900", color: "#fff" },
  shopName: { fontSize: 20, fontWeight: "900", color: "#fff", textAlign: "center" },
  shopSlogan: { fontSize: 13, fontStyle: "italic", color: "rgba(255,255,255,0.85)", textAlign: "center" },
  shopDescription: { fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 18, paddingHorizontal: 24 },
  shopMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  shopMetaChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  rateChip: { backgroundColor: "rgba(245,158,11,0.2)" },
  shopMetaChipText: { fontSize: 11, color: "#fff", fontWeight: "600" },

  // Catégories
  categoriesBar: { maxHeight: 52, backgroundColor: "#fff" },
  categoriesContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  categoryPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#fff",
  },
  categoryPillText: { fontSize: 13, color: "#555", fontWeight: "600" },

  // Grille produits
  grid: { padding: 12, gap: 12 },
  row: { gap: 12 },

  card: {
    width: CARD_SIZE, borderRadius: 18, overflow: "hidden", backgroundColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  cardImageWrap: { position: "relative" },
  cardImagePlaceholder: { justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  priceBadge: {
    position: "absolute", bottom: 8, right: 8,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  priceBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", lineHeight: 18, marginBottom: 3 },
  cardCategory: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },

  // Vide
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a", marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 14, color: "#aaa", textAlign: "center" },

  // Barre panier
  cartBar: {
    position: "absolute", left: 16, right: 16,
    backgroundColor: "#1a1a1a", borderRadius: 22,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 14,
    overflow: "hidden",
  },
  cartBarInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingLeft: 20, paddingRight: 8, paddingVertical: 12,
  },
  cartBarLeft: { gap: 2 },
  cartBarCount: { fontSize: 11, color: "#aaa", fontWeight: "500" },
  cartBarTotal: { fontSize: 17, fontWeight: "900", color: "#fff" },
  whatsappBtn: {
    backgroundColor: "#25D366", borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  whatsappBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Modal produit
  modal: { flex: 1, backgroundColor: "#fff" },
  modalImageWrap: { position: "relative", backgroundColor: "#f5f6fa" },
  modalImageContainer: {
    width: "100%",
    aspectRatio: 1, // Carré — pas de recadrage
    backgroundColor: "#f5f6fa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: "100%", height: "100%" },
  modalImagePlaceholder: { justifyContent: "center", alignItems: "center" },
  modalCloseBtn: {
    position: "absolute", top: 14, right: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 4,
  },
  modalContent: { padding: 20, gap: 12 },
  modalPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  modalPriceText: { fontSize: 22, fontWeight: "900" },
  modalCatBadge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  modalCatText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#1a1a1a", lineHeight: 28 },
  modalDescription: { fontSize: 14, color: "#666", lineHeight: 22 },
  varSection: { gap: 10 },
  varLabel: { fontSize: 13, fontWeight: "700", color: "#333" },
  varChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  varChip: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#fff", minWidth: 48, alignItems: "center",
  },
  varChipText: { fontSize: 13, color: "#555", fontWeight: "600" },
  addToCartBtn: {
    borderRadius: 18, paddingVertical: 16, alignItems: "center", marginTop: 8,
    flexDirection: "row", justifyContent: "center", gap: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  addToCartBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
