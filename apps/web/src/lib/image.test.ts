import { describe, it, expect } from "vitest";
import { optimizeImage } from "./image";

describe("optimizeImage (web)", () => {
  const base = "https://res.cloudinary.com/demo/image/upload/v123/panel-pub/products/abc.jpg";

  it("retourne undefined pour null/undefined", () => {
    expect(optimizeImage(null, 400)).toBeUndefined();
    expect(optimizeImage(undefined, 400)).toBeUndefined();
  });

  it("insère la transformation après /upload/", () => {
    expect(optimizeImage(base, 400)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_400/v123/panel-pub/products/abc.jpg"
    );
  });

  it("arrondit la largeur", () => {
    expect(optimizeImage(base, 399.6)).toContain("w_400");
  });

  it("laisse inchangée une URL non Cloudinary", () => {
    const url = "https://example.com/photo.jpg";
    expect(optimizeImage(url, 400)).toBe(url);
  });

  it("ne double pas une transformation déjà présente", () => {
    const already = "https://res.cloudinary.com/demo/image/upload/w_200/v1/a.jpg";
    expect(optimizeImage(already, 800)).toBe(already);
  });
});
