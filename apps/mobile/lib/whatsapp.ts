import { Linking } from "react-native";
import { CartItem } from "../store/cartStore";

export function buildWhatsAppMessage(items: CartItem[], shopName: string): string {
  const lines = items.map(
    (item) =>
      `• ${item.title}${item.selectedSize ? ` — Taille: ${item.selectedSize}` : ""}${item.selectedColor ? ` — Couleur: ${item.selectedColor}` : ""} x${item.quantity} = ${(item.price * item.quantity).toLocaleString("fr-FR")} FCFA`
  );
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return [
    `Bonjour ${shopName} ! 👋`,
    `Je souhaite commander :`,
    "",
    ...lines,
    "",
    `Total : ${total.toLocaleString("fr-FR")} FCFA`,
  ].join("\n");
}

export async function openWhatsApp(phone: string, message: string): Promise<void> {
  const encoded = encodeURIComponent(message);
  const clean = phone.replace(/\D/g, "");
  const url = `https://wa.me/${clean}?text=${encoded}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    await Linking.openURL(`https://web.whatsapp.com/send?phone=${clean}&text=${encoded}`);
  }
}
