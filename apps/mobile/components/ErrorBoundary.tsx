import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; primary?: string },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    const primary = this.props.primary || "#34adea";
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.subtitle}>
            L&apos;application a rencontré un problème inattendu.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: primary }]}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.btnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "#fff", padding: 32, gap: 12,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#1a1a1a", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 22 },
  btn: {
    marginTop: 8, borderRadius: 14,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
