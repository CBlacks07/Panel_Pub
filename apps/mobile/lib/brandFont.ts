import React from "react";
import { Text, TextInput, StyleSheet, Platform } from "react-native";

/**
 * Applique la police de marque (Plus Jakarta Sans) à TOUT le texte de l'app,
 * en choisissant la bonne variante selon le fontWeight de chaque Text.
 *
 * Les écrans utilisent <Text> standard avec fontWeight ("700", "800"...) ;
 * sans ceci la police chargée n'est jamais appliquée (rendu en police système).
 * On patche le render de Text/TextInput une seule fois (idempotent).
 *
 * Les variantes doivent être chargées au préalable (Font.loadAsync dans _layout).
 */

const WEIGHT_TO_FAMILY: Record<string, string> = {
  "100": "PlusJakartaSans_400Regular",
  "200": "PlusJakartaSans_400Regular",
  "300": "PlusJakartaSans_400Regular",
  "400": "PlusJakartaSans_400Regular",
  normal: "PlusJakartaSans_400Regular",
  "500": "PlusJakartaSans_500Medium",
  "600": "PlusJakartaSans_600SemiBold",
  "700": "PlusJakartaSans_700Bold",
  bold: "PlusJakartaSans_700Bold",
  "800": "PlusJakartaSans_800ExtraBold",
  "900": "PlusJakartaSans_800ExtraBold",
};

/** Police de marque pour ce style, ou null s'il définit déjà sa police (ex. icônes Ionicons). */
function familyForStyle(style: unknown): string | null {
  const flat = (StyleSheet.flatten(style as any) || {}) as { fontWeight?: string | number; fontFamily?: string };
  if (flat.fontFamily) return null;
  const fw = flat.fontWeight != null ? String(flat.fontWeight) : "400";
  return WEIGHT_TO_FAMILY[fw] || "PlusJakartaSans_400Regular";
}

function patch(Component: any) {
  if (!Component || Component.__brandFontPatched) return;
  const original = Component.render;
  if (typeof original !== "function") return;

  if (Platform.OS === "web") {
    // Sur le web, render() renvoie déjà un élément DOM (<span>/<input>) dont
    // le style est un objet résolu : y injecter un tableau fait planter React DOM.
    // On modifie donc les props AVANT le rendu.
    Component.render = function (props: any, ...rest: any[]) {
      const style = props?.style;
      const family = familyForStyle(style);
      if (!family) return original.call(this, props, ...rest);
      const next = { ...props, style: [style, { fontFamily: family, fontWeight: undefined }] };
      return original.call(this, next, ...rest);
    };
    Component.__brandFontPatched = true;
    return;
  }

  Component.render = function (...args: any[]) {
    const element = original.apply(this, args);
    if (!element || !React.isValidElement(element)) return element;
    try {
      const style = (element.props as any).style;
      const family = familyForStyle(style);
      if (!family) return element;
      // fontWeight neutralisé : on a déjà choisi la bonne fonte, on évite
      // le faux-gras synthétique (Android) par-dessus.
      return React.cloneElement(element as any, {
        style: [style, { fontFamily: family, fontWeight: undefined }],
      });
    } catch {
      return element;
    }
  };
  Component.__brandFontPatched = true;
}

export function applyBrandFont() {
  patch(Text as any);
  patch(TextInput as any);
}
