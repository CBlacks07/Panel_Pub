import { getPlanFeatures } from "../lib/planFeatures";

describe("getPlanFeatures", () => {
  it("plan gratuit : limite + cooldown dynamiques en tête", () => {
    const out = getPlanFeatures({
      article_limit: 10,
      edit_cooldown_hours: 72,
      features: ["Vitrine publique", "10 articles max", "Bouton WhatsApp"],
    });
    expect(out[0]).toBe("10 articles max");
    expect(out[1]).toBe("1 modif/article toutes les 72h");
    // L'ancienne ligne "10 articles max" du tableau est filtrée (pas de doublon)
    expect(out.filter((f) => f === "10 articles max")).toHaveLength(1);
    expect(out).toContain("Vitrine publique");
  });

  it("plan payant : modifications illimitées quand cooldown = 0", () => {
    const out = getPlanFeatures({
      article_limit: 100,
      edit_cooldown_hours: 0,
      features: ["Statistiques"],
    });
    expect(out[0]).toBe("100 articles max");
    expect(out[1]).toBe("Modifications illimitées");
  });

  it("article_limit >= 999 → illimité", () => {
    const out = getPlanFeatures({ article_limit: 999, edit_cooldown_hours: 0, features: [] });
    expect(out[0]).toBe("Articles illimités");
  });
});
