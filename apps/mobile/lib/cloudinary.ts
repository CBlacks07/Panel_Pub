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
