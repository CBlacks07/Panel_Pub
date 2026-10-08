#!/usr/bin/env node
/**
 * Données de démo Boutiki : 12 boutiques fictives avec produits, notes et vues.
 *
 *   node supabase/seed/demo-shops.mjs seed    [--dry-run] [--no-images] [--allow-production]
 *   node supabase/seed/demo-shops.mjs clean   [--dry-run] [--allow-production]
 *
 * Variables d'environnement (volontairement distinctes de .env.local) :
 *   SEED_SUPABASE_URL          URL du projet Supabase de TEST
 *   SEED_SERVICE_ROLE_KEY      clé service_role de ce projet
 *
 * Sécurité :
 *  - Le script REFUSE de tourner si l'URL est celle de apps/web/.env.local
 *    (probablement la base en ligne), sauf avec --allow-production.
 *  - Tous les comptes ont un email en @boutiki-demo.test : `clean` les supprime
 *    (les boutiques, produits, notes et vues partent en cascade).
 *  - Les mots de passe sont générés au hasard et écrits uniquement dans
 *    supabase/seed/.demo-credentials.json (ignoré par git), jamais affichés.
 *  - Les numéros WhatsApp sont fictifs et invalides (+228 00 00 00 xx).
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEMO_DOMAIN = "boutiki-demo.test";
const args = new Set(process.argv.slice(2));
const command = process.argv[2];
const DRY = args.has("--dry-run");
const WITH_IMAGES = !args.has("--no-images");

// ── Catalogue de démo ───────────────────────────────────────────────────────
// [titre, prix FCFA, catégorie, description courte, promo (ancien prix) | null]
const SHOPS = [
  { slug: "awa-fashion", name: "Awa Fashion", type: "mode", city: "Lomé", lat: 6.1725, lng: 1.2314, plan: "pro",
    slogan: "Le wax qui vous ressemble", description: "Robes, ensembles et pièces en pagne wax, cousus main à Lomé.",
    products: [
      ["Robe wax bleue", 8500, "Robes", "Robe évasée en wax, doublée.", 11000],
      ["Ensemble wax 2 pièces", 15000, "Ensembles", "Haut et jupe assortis.", null],
      ["Chemise bogolan", 9000, "T-shirts", "Coton tissé à la main.", null],
      ["Jupe portefeuille", 6500, "Jupes", "Wax coloré, taille réglable.", null],
      ["Veste kita", 18000, "Vestes", "Coupe moderne, tissu kita.", 22000],
    ] },
  { slug: "style-by-kofi", name: "Style by Kofi", type: "mode", city: "Abidjan", lat: 5.3599, lng: -4.0083, plan: "annual",
    slogan: "Élégance au masculin", description: "Costumes, chemises et accessoires pour homme.",
    products: [
      ["Chemise lin blanche", 12000, "T-shirts", "Lin léger, coupe droite.", null],
      ["Pantalon chino beige", 14000, "Pantalons", "Coton stretch.", null],
      ["Veste été", 25000, "Vestes", "Non doublée, idéale pour la chaleur.", 30000],
      ["Ensemble bazin", 35000, "Ensembles", "Bazin riche, broderie main.", null],
    ] },
  { slug: "sneaker-lome", name: "Sneaker Lomé", type: "chaussures", city: "Lomé", lat: 6.1319, lng: 1.2228, plan: "pro",
    slogan: "Les bonnes paires, au bon prix", description: "Baskets et sandales, neuves et authentiques.",
    products: [
      ["Sneakers blanches", 12000, "Sneakers", "Cuir synthétique, semelle confort.", null],
      ["Sandales cuir", 7000, "Sandales", "Cuir véritable, fabrication locale.", null],
      ["Mocassins noirs", 16000, "Mocassins", "Pour le bureau et les sorties.", 19000],
      ["Baskets running", 22000, "Chaussures de sport", "Amorti renforcé.", null],
      ["Talons carrés", 11000, "Talons", "Talon 6 cm, très stable.", null],
    ] },
  { slug: "naida-cosmetiques", name: "NAIDA Cosmétiques", type: "beaute", city: "Lomé", lat: 6.1856, lng: 1.2090, plan: "pro",
    slogan: "Prenez soin de vous", description: "Soins visage, corps et cheveux. Produits sélectionnés.",
    products: [
      ["Gel de visage", 25500, "Cosmétiques", "Hydratant, tous types de peau.", null],
      ["Beurre de karité pur", 4500, "Cosmétiques", "Non raffiné, 250 g.", null],
      ["Huile capillaire", 6000, "Soins capillaires", "Ricin et coco, pousse et brillance.", null],
      ["Parfum fleuri 50 ml", 18000, "Parfums", "Notes de jasmin et vanille.", 22000],
    ] },
  { slug: "perruques-dakar", name: "Perruques de Dakar", type: "beaute", city: "Dakar", lat: 14.7167, lng: -17.4677, plan: "pro",
    slogan: "Le naturel, sans effort", description: "Perruques lace, tissages et tresses prêtes à poser.",
    products: [
      ["Lace frontale 16 pouces", 85000, "Perruques", "Cheveux naturels, densité 150 %.", 98000],
      ["Tissage brésilien 18 pouces", 60000, "Extensions", "Lot de 3 paquets.", null],
      ["Tresses box braids", 25000, "Tresses", "Pré-tressées, légères.", null],
      ["Bonnet satin", 2500, "Autres", "Protège les cheveux la nuit.", null],
    ] },
  { slug: "maroquinerie-adjoa", name: "Maroquinerie Adjoa", type: "sacs", city: "Accra", lat: 5.6037, lng: -0.1870, plan: "free",
    slogan: "Le cuir, version artisan", description: "Sacs et pochettes en cuir, faits main.",
    products: [
      ["Sac à main cuir", 15000, "Sacs à main", "Fermeture magnétique, deux poches.", null],
      ["Sac à dos urbain", 22000, "Sacs à dos", "Compartiment ordinateur 15 pouces.", null],
      ["Portefeuille homme", 8000, "Portefeuilles", "Cuir pleine fleur.", null],
    ] },
  { slug: "cote-d-or", name: "Côte D'Or", type: "bijoux", city: "Lomé", lat: 6.1500, lng: 1.2400, plan: "pro",
    slogan: "L'éclat qui se transmet", description: "Bagues, colliers et bracelets plaqués or.",
    products: [
      ["Bague de fiançailles", 150000, "Bagues", "Plaqué or 18 carats, zircons.", 230000],
      ["Collier perles", 18000, "Colliers", "Perles d'eau douce.", null],
      ["Bracelet jonc doré", 9000, "Bracelets", "Ajustable, hypoallergénique.", null],
      ["Boucles d'oreilles créoles", 7500, "Boucles d'oreilles", "Diamètre 3 cm.", null],
    ] },
  { slug: "tech-colombe", name: "Tech Colombe", type: "electronique", city: "Lomé", lat: 6.1290, lng: 1.2150, plan: "annual",
    slogan: "Le high-tech, garanti", description: "Téléphones, accessoires et objets connectés avec garantie.",
    products: [
      ["Smartphone 128 Go noir", 80000, "Téléphones", "Neuf, scellé, garantie 6 mois.", null],
      ["Écouteurs sans fil", 15000, "Écouteurs", "Réduction de bruit, 20 h d'autonomie.", 19000],
      ["Chargeur rapide 30 W", 6500, "Chargeurs", "Câble USB-C inclus.", null],
      ["Montre connectée", 28000, "Montres connectées", "Suivi sport et sommeil.", null],
      ["Coque antichoc", 3500, "Coques", "Compatible plusieurs modèles.", null],
      ["Disque dur 1 To", 55000, "Accessoires", "USB 3.0, format poche.", 65000],
    ] },
  { slug: "drey-sweet", name: "Drey'Sweet", type: "alimentation", city: "Lomé", lat: 6.1750, lng: 1.2000, plan: "free",
    slogan: "Fait maison, livré chaud", description: "Pâtisseries et plats locaux sur commande.",
    products: [
      ["Pack pastels (12)", 7000, "Snacks", "Pastels croustillants, sauce piquante.", null],
      ["Gâteau d'anniversaire", 20000, "Gâteaux", "Sur commande, 24 h à l'avance.", null],
      ["Riz au gras familial", 9000, "Plats cuisinés", "Pour 4 personnes.", null],
    ] },
  { slug: "epicerie-fine-cotonou", name: "Épicerie Fine Cotonou", type: "alimentation", city: "Cotonou", lat: 6.3703, lng: 2.3912, plan: "pro",
    slogan: "Les saveurs du pays", description: "Épices, jus locaux et produits du terroir.",
    products: [
      ["Jus de bissap 1 L", 1500, "Boissons", "Sans conservateur.", null],
      ["Piment en poudre 200 g", 1200, "Épicerie", "Récolte locale.", null],
      ["Huile de palme 1 L", 2500, "Produits locaux", "Artisanale.", null],
      ["Gari premium 2 kg", 2000, "Produits locaux", "Fin et croquant.", null],
    ] },
  { slug: "decor-et-maison", name: "Déco & Maison", type: "autre", city: "Abidjan", lat: 5.3364, lng: -4.0267, plan: "free",
    slogan: "Une maison qui vous ressemble", description: "Petite décoration et linge de maison.",
    products: [
      ["Coussin wax", 6500, "Catégorie 1", "Housse déhoussable 45 x 45.", null],
      ["Panier tressé", 8000, "Catégorie 2", "Osier, anses renforcées.", null],
      ["Set de table (4)", 9500, "Catégorie 1", "Coton, lavable.", null],
    ] },
  { slug: "montres-et-lunettes", name: "Montres & Lunettes", type: "bijoux", city: "Dakar", lat: 14.6937, lng: -17.4441, plan: "pro",
    slogan: "Le détail qui change tout", description: "Montres, lunettes et écharpes soigneusement choisies.",
    products: [
      ["Montre bracelet cuir", 32000, "Montres", "Cadran minimaliste.", 40000],
      ["Lunettes de soleil", 9000, "Lunettes", "Protection UV400.", null],
      ["Écharpe en soie", 12000, "Écharpes", "Motifs africains.", null],
      ["Montre sport", 25000, "Montres", "Étanche 50 m.", null],
    ] },
];

const COMMENTS = [
  "Très bon accueil et produit conforme à la photo.",
  "Livraison rapide, je recommande.",
  "Qualité correcte pour le prix.",
  "Vendeur sérieux, réponse rapide sur WhatsApp.",
  "Super boutique, je reviendrai.",
  null, null,
];

const VARIATIONS = {
  mode: [["size", ["S", "M", "L", "XL"]], ["color", ["Noir", "Bleu", "Beige"]]],
  chaussures: [["size", ["39", "40", "41", "42", "43"]]],
  beaute: [["color", ["Naturel", "Noir", "Brun"]]],
  sacs: [["color", ["Noir", "Marron"]]],
  bijoux: [["color", ["Or", "Argent"]]],
  electronique: [["color", ["Noir", "Blanc"]]],
  alimentation: [],
  autre: [],
};

// ── Utilitaires ─────────────────────────────────────────────────────────────
const emailFor = (slug) => `${slug}@${DEMO_DOMAIN}`;
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const img = (seed, w = 800, h = 800) => (WITH_IMAGES ? `https://picsum.photos/seed/${seed}/${w}/${h}` : null);

function fail(msg) { console.error(`Erreur : ${msg}`); process.exit(1); }

function envLocalUrl() {
  const p = join(HERE, "..", "..", "apps", "web", ".env.local");
  if (!existsSync(p)) return null;
  const m = readFileSync(p, "utf8").match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m);
  return m ? m[1].trim() : null;
}

function connect() {
  const url = process.env.SEED_SUPABASE_URL;
  const key = process.env.SEED_SERVICE_ROLE_KEY;
  if (!url || !key) fail("définis SEED_SUPABASE_URL et SEED_SERVICE_ROLE_KEY (projet de test).");
  const prod = envLocalUrl();
  if (prod && new URL(prod).host === new URL(url).host && !args.has("--allow-production")) {
    fail(
      "cette URL est celle de apps/web/.env.local (probablement la base en ligne).\n" +
      "Utilise un projet de test, ou ajoute --allow-production si tu l'assumes."
    );
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function findDemoUsers(db) {
  const found = [];
  for (let page = 1; page < 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(error.message);
    found.push(...data.users.filter((u) => u.email?.endsWith(`@${DEMO_DOMAIN}`)));
    if (data.users.length < 200) break;
  }
  return found;
}

// ── Commandes ───────────────────────────────────────────────────────────────
async function seed() {
  const plan = SHOPS.map((s) => `  ${s.name.padEnd(24)} ${s.type.padEnd(13)} ${s.city.padEnd(8)} ${String(s.products.length).padStart(2)} articles  plan ${s.plan}`);
  console.log(`${SHOPS.length} boutiques de démo :\n${plan.join("\n")}`);
  if (DRY) { console.log("\n--dry-run : aucune écriture."); return; }

  const db = connect();
  const existing = new Set((await findDemoUsers(db)).map((u) => u.email));
  const credentials = [];
  let created = 0;

  for (const [i, shop] of SHOPS.entries()) {
    const email = emailFor(shop.slug);
    if (existing.has(email)) { console.log(`- ${shop.name} : déjà présent, ignoré`); continue; }

    const password = randomBytes(12).toString("base64url");
    const { data, error } = await db.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { shop_name: shop.name },
    });
    if (error) { console.error(`- ${shop.name} : ${error.message}`); continue; }
    const id = data.user.id;
    credentials.push({ shop: shop.name, email, password });

    // Le trigger handle_new_user a créé la ligne public.users : on la complète.
    const { error: upErr } = await db.from("users").update({
      shop_name: shop.name, slogan: shop.slogan, description: shop.description,
      business_type: shop.type, city: shop.city, latitude: shop.lat, longitude: shop.lng,
      phone_whatsapp: `+2280000${String(i + 1).padStart(4, "0")}`, plan: shop.plan,
      shop_logo_url: img(`${shop.slug}-logo`, 300, 300), shop_cover_url: img(`${shop.slug}-cover`, 1200, 500),
    }).eq("id", id);
    if (upErr) { console.error(`- ${shop.name} : profil : ${upErr.message}`); continue; }

    const rows = shop.products.map(([title, price, category, description, compare], n) => ({
      user_id: id, title, price, category, description, compare_at_price: compare,
      image_url: img(`${shop.slug}-${n}`), images: WITH_IMAGES ? [img(`${shop.slug}-${n}`)] : [],
    }));
    const { data: products, error: pErr } = await db.from("products").insert(rows).select("id");
    if (pErr) { console.error(`- ${shop.name} : produits : ${pErr.message}`); continue; }

    const variations = [];
    for (const p of products) for (const [type, values] of VARIATIONS[shop.type] ?? []) for (const value of values) variations.push({ product_id: p.id, type, value, stock: rand(0, 12) });
    if (variations.length) await db.from("product_variations").insert(variations);

    const ratings = Array.from({ length: rand(0, 8) }, () => ({ shop_id: id, rating: rand(3, 5), comment: pick(COMMENTS) }));
    if (ratings.length) await db.from("shop_ratings").insert(ratings);

    const views = products.flatMap((p) => Array.from({ length: rand(2, 40) }, () => ({ product_id: p.id })));
    if (views.length) await db.from("product_views").insert(views);

    created++;
    console.log(`+ ${shop.name} : ${products.length} articles, ${ratings.length} avis`);
  }

  if (credentials.length) {
    const file = join(HERE, ".demo-credentials.json");
    const previous = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
    writeFileSync(file, JSON.stringify([...previous, ...credentials], null, 2));
    console.log(`\nIdentifiants écrits dans supabase/seed/.demo-credentials.json (ignoré par git).`);
  }
  console.log(`${created} boutique(s) créée(s).`);
}

async function clean() {
  if (DRY) { console.log(`--dry-run : supprimerait les comptes en @${DEMO_DOMAIN}.`); return; }
  const db = connect();
  const users = await findDemoUsers(db);
  for (const u of users) {
    const { error } = await db.auth.admin.deleteUser(u.id);
    console.log(error ? `- ${u.email} : ${error.message}` : `- ${u.email} supprimé`);
  }
  console.log(`${users.length} compte(s) de démo traité(s).`);
}

if (command === "seed") await seed();
else if (command === "clean") await clean();
else fail("commande attendue : seed | clean");
