# Boutiki — Guide développeur

SaaS de catalogues mobile pour commerçants africains francophones. Vitrine
publique + commande via WhatsApp. Monorepo : app mobile (Expo) + web (Next.js)
+ base Supabase.

## Structure

```
apps/mobile        App Expo (SDK 54, expo-router) — vendeurs + vitrine publique
apps/web           Site Next.js 15 (marketplace, boutiques, dashboard, admin)
supabase/migrations  Migrations SQL (appliquées manuellement, voir plus bas)
packages/*         Code partagé éventuel (workspace npm)
```

Backend : Supabase (Postgres + Auth + RLS). Images : Cloudinary (upload non
signé, preset `panel_pub_unsigned`). Déploiement : EAS Update (mobile, OTA) et
Vercel (web).

## Prérequis & variables d'environnement

- Node 20+
- Mobile (`apps/mobile`, fichier `.env` / variables EAS) :
  - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`
- Web (`apps/web`) :
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - secrets admin côté serveur (sans préfixe `NEXT_PUBLIC_`)

## Installation

Mobile (lockfile autonome) :

```bash
cd apps/mobile && npm install
```

Web (workspace npm — installer depuis la racine) :

```bash
npm install --workspace=apps/web   # depuis la racine du repo
```

> Note : `npm install` lancé directement dans `apps/web` peut échouer
> (`Cannot read properties of null (reading 'location')`) car c'est un
> workspace. Passer par la racine.

## Scripts

Mobile (`apps/mobile`) :

| Commande | Rôle |
|----------|------|
| `npm start` | Démarre Expo |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Tests Jest (jest-expo) |
| `npm run test:watch` | Tests en watch |

Web (`apps/web`) :

| Commande | Rôle |
|----------|------|
| `npm run dev` | Démarre Next.js |
| `npm run build` | Build de production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint Next |

## Tests

Mobile : Jest + `jest-expo` (`apps/mobile/__tests__`). Couvre la logique pure
(optimisation d'images, distances, features de plan). Les modules important
`react-native` sont gérés par le preset `jest-expo`.

```bash
cd apps/mobile && npm test
```

Web : Vitest **pas encore en place** (bloqué par un bug npm de résolution de
workspace lors de l'install des devDeps). À ajouter une fois l'arbre npm
assaini. La logique `optimizeImage` du web est identique à celle du mobile,
déjà couverte par les tests mobile.

## Base de données / migrations

Les migrations vivent dans `supabase/migrations/` et sont **appliquées
manuellement** dans le SQL editor Supabase (le projet n'est pas lié à la CLI
en local). Ordre = numéro de fichier.

- `001_init` — schéma de base (users, products, variations, views)
- `002` — RLS complète, tables (plans, app_config, shop_ratings,
  product_edits), compteurs et triggers
- `003` — hash du mot de passe admin
- `004` — galerie multi-images (`products.images`, `plans.image_limit`)
- `005` — enforcement serveur des limites (limite d'articles + cooldown
  d'édition via triggers) — clôt SEC-04/05

**Important** : appliquer une migration *avant* de déployer le code qui en
dépend (ex. `004` ajoute `products.images` que les pages boutique lisent).

## Déploiement

- Mobile : `cd apps/mobile && npx eas update --channel production --message "..."`
  (OTA, runtime 1.0.0). L'app vérifie et applique les updates au démarrage.
- Web : déploiement Vercel automatique au push sur `main` (si connecté).

## CI

`.github/workflows/ci.yml` lance sur push `main` et sur PR :
- Mobile : `npm ci` + typecheck + tests
- Web : `npm ci` + typecheck + lint

## Dette technique connue (à traiter)

- Tests web (Vitest) à installer une fois le bug npm workspace résolu.
- Pagination des listes (marketplace/boutique/dashboard) — le marketplace
  charge tout puis trie côté client ; à terme, vue SQL agrégée + `.range()`.
- Réduire les `any` restants (~17) en générant les types Supabase depuis le
  schéma (`supabase gen types`, nécessite le lien CLI au projet).
