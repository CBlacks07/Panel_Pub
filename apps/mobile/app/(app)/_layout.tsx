import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useConfig } from "../../context/ConfigContext";

function TabIcon({
  name, nameActive, label, focused, primary,
}: { name: any; nameActive: any; label: string; focused: boolean; primary: string }) {
  return (
    <View style={styles.tabItem}>
      {focused ? (
        /* Onglet actif : pill colorée avec icône + label côte à côte */
        <View style={[styles.activePill, { backgroundColor: primary + "18" }]}>
          <Ionicons name={nameActive} size={18} color={primary} />
          <Text style={[styles.activeLabel, { color: primary }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : (
        /* Onglet inactif : juste l'icône */
        <View style={styles.inactiveWrap}>
          <Ionicons name={name} size={22} color="#9ca3af" />
        </View>
      )}
    </View>
  );
}

function AddTabIcon({ primary }: { primary: string }) {
  return (
    <View style={styles.addWrap}>
      <View style={[styles.addBtn, { backgroundColor: primary }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    </View>
  );
}

export default function AppLayout() {
  const { primary } = useConfig();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 24 : 14,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#fff",
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 14,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="storefront-outline" nameActive="storefront" label="Boutique" focused={focused} primary={primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          tabBarIcon: () => <AddTabIcon primary={primary} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" nameActive="person" label="Profil" focused={focused} primary={primary} />
          ),
        }}
      />
      <Tabs.Screen name="edit-product" options={{ href: null }} />
      <Tabs.Screen name="plans" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  // Onglet actif : pill horizontale icône + texte
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  // Onglet inactif : juste l'icône centrée
  inactiveWrap: {
    padding: 8,
  },

  // Bouton Ajouter central
  addWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
