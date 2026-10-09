import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type OptionKind = "category" | "size" | "color" | "custom";

type Store = Record<OptionKind, string[]>;
const EMPTY: Store = { category: [], size: [], color: [], custom: [] };

/**
 * Catégories / options créées par le vendeur (propres à son compte).
 * Les valeurs "en dur" du type de commerce restent dans bizType.
 */
export function useCustomOptions(userId?: string) {
  const [options, setOptions] = useState<Store>(EMPTY);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_custom_options")
      .select("kind, value")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const next: Store = { category: [], size: [], color: [], custom: [] };
        (data ?? []).forEach((r: any) => { if (next[r.kind as OptionKind]) next[r.kind as OptionKind].push(r.value); });
        setOptions(next);
      });
  }, [userId]);

  /** Crée l'option. Retourne la valeur nettoyée, ou lève une erreur lisible. */
  const add = useCallback(async (kind: OptionKind, raw: string): Promise<string> => {
    const value = raw.trim().replace(/\s+/g, " ");
    if (!value) throw new Error("Saisis un nom.");
    if (value.length > 40) throw new Error("40 caractères maximum.");
    if (!userId) throw new Error("Non connecté.");

    const { error } = await supabase.from("user_custom_options").insert({ user_id: userId, kind, value });
    if (error) {
      if (error.code === "23505") return value; // existe déjà : on réutilise
      if (error.message.includes("LIMIT_CUSTOM_OPTIONS")) throw new Error("Limite atteinte (50 par type).");
      throw new Error("Impossible d'enregistrer. Réessaie.");
    }
    setOptions((prev) => ({ ...prev, [kind]: prev[kind].includes(value) ? prev[kind] : [...prev[kind], value] }));
    return value;
  }, [userId]);

  const remove = useCallback(async (kind: OptionKind, value: string) => {
    if (!userId) return;
    await supabase.from("user_custom_options").delete()
      .eq("user_id", userId).eq("kind", kind).eq("value", value);
    setOptions((prev) => ({ ...prev, [kind]: prev[kind].filter((v) => v !== value) }));
  }, [userId]);

  return { options, add, remove };
}
