/**
 * Optimise une URL Cloudinary pour l'affichage web : format auto (webp/avif),
 * qualité auto, largeur max (sans agrandir). Réduit le poids des images.
 * Renvoie l'URL inchangée si ce n'est pas une URL Cloudinary /upload/.
 */
export function optimizeImage(url: string | null | undefined, width: number): string | undefined {
  if (!url) return url ?? undefined;
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  const after = url.slice(i + marker.length);
  if (/^[a-z]{1,3}_/.test(after)) return url; // déjà transformée
  const transform = `f_auto,q_auto,c_limit,w_${Math.round(width)}`;
  return `${url.slice(0, i + marker.length)}${transform}/${after}`;
}
