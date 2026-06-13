const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = "panel_pub_unsigned";

export async function uploadImage(imageUri: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "product.jpg",
  } as any);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "panel-pub/products");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Échec de l'upload image");

  const data = await res.json();
  return data.secure_url as string;
}

/**
 * Optimise une URL Cloudinary pour l'affichage : format auto (webp/avif),
 * qualité auto, et largeur max (sans agrandir l'original).
 * Réduit fortement le poids des images sur mobile (données chères).
 * Passe `width` en pixels réels souhaités (densité d'écran incluse).
 * Renvoie l'URL inchangée si ce n'est pas une URL Cloudinary /upload/.
 */
export function optimizeImage(url: string | null | undefined, width: number): string | null {
  if (!url) return url ?? null;
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url; // pas une URL Cloudinary transformable
  const after = url.slice(i + marker.length);
  // Déjà transformée (commence par une instruction de transformation)
  if (/^[a-z]{1,3}_/.test(after)) return url;
  const transform = `f_auto,q_auto,c_limit,w_${Math.round(width)}`;
  return `${url.slice(0, i + marker.length)}${transform}/${after}`;
}
