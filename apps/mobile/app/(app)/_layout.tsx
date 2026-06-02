import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useConfig } from "../../context/ConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({
  name, nameActive, label, focused, primary,
}: { name: any; nameActive: any; label: string; focused: boolean; primary: string }) {
  return (
    <View style={styles.tabItem}>
      {focused ? (
        <View style={[styles.activePill, { backgroundColor: primary + "18" }]}>
          <Ionicons name={nameActive} size={19} color={primary} />
          <Text style={[styles.activeLabel, { color: primary }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : (
        <View style={styles.inactiveWrap}>
          <Ionicons name={name} size={22} color="#9ca3af" />
        </View>
      )}
    </View>
  );
}

function AddTabIcon({ primary, bottomInset }: { primary: string; bottomInset: number }) {
  return (
    <View style={[styles.addWrap, { marginBottom: bottomInset > 0 ? 8 : 0 }]}>
      <View style={[styles.addBtn, { backgroundColor: primary }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    </View>
  );
}

export default function AppLayout() {
  const { primary } = useConfig();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
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
          tabBarIcon: () => <AddTabIcon primary={primary} bottomInset={insets.bottom} />,
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
  },
  inactiveWrap: {
    padding: 8,
  },
  addWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
