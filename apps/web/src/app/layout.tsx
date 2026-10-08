import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ScrollReveal from "@/components/ScrollReveal";

// Police hébergée dans le projet (SIL OFL) : le build ne dépend plus de Google Fonts.
const jakarta = localFont({
  src: [
    { path: "./fonts/PlusJakartaSans_400Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/PlusJakartaSans_500Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/PlusJakartaSans_600SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/PlusJakartaSans_700Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/PlusJakartaSans_800ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Boutiki — Vendez via WhatsApp",
  description: "Créez votre boutique en ligne en 30 secondes. Partagez-la. Recevez vos commandes sur WhatsApp.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={jakarta.variable}>
      <body className={jakarta.className}>
        {children}
        <ScrollReveal />
      </body>
    </html>
  );
}
