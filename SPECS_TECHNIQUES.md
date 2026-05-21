# 📐 Spécifications techniques détaillées

## 1. Frontend - Vendeur (Dashboard)

### Pages principales

#### `/dashboard`
- **Authentification**: Vérifier que l'utilisateur est connecté
- **Layout**: Sidebar + Main content
- **Sections**:
  - Vue d'ensemble (nombre d'articles, derniers ajouts)
  - Liste des articles (tableau avec image, titre, prix, statut)
  - Bouton "+ Nouvel article"

#### `/dashboard/articles/new`
- **Formulaire de création**:
  - Image upload (Cloudinary)
  - Titre (max 100 car)
  - Prix (numérique)
  - Description (max 500 car)
  - Catégorie (select dropdown)
  - Stock (optionnel)
  - Variations (taille/couleur - array dynamique)
  - Bouton "Créer" + "Annuler"

#### `/dashboard/articles/[id]/edit`
- **Même formulaire que new** mais pré-rempli
- **Bouton "Supprimer"** avec confirmation

#### `/dashboard/analytics` (v2)
- **Graphique**: Clics par jour (7 derniers jours)
- **Top 5 produits**: Les plus vus
- **Conversion rate**: Panier/vues
- **Export CSV**

#### `/dashboard/settings`
- **Numéro WhatsApp** (pour recevoir les commandes)
- **Nom du shop** (affiché sur la vitrine)
- **Logo/couleurs** (optionnel)
- **Plan actuel** + "Upgrade"

---

## 2. Frontend - Client (Vitrine)

### Pages publiques

#### `/shop/[shopId]`
- **Header**: Nom du shop, logo
- **Categories**: Horizontal scroll ou boutons
- **Produits**: Grille responsive (2 col mobile, 3+ desktop)
- **Chaque produit**:
  - Image
  - Titre
  - Prix
  - Petite description (2 lignes)
  - Bouton "Voir détails"

#### `/shop/[shopId]/product/[productId]`
- **Image**: Grande (carousel si plusieurs images)
- **Titre + Prix**
- **Description complète**
- **Variations** (taille, couleur):
  - Boutons sélectionnables
  - Affichage stock si disponible
- **Quantité** (input numérique)
- **Bouton "Ajouter au panier"** (style WhatsApp vert)

#### `/shop/[shopId]/cart`
- **Résumé panier**:
  - Chaque item: image, titre, prix, quantité, sous-total
  - Bouton "×" pour supprimer
- **Total HT + Taxes** (si applicable)
- **Bouton "Commander via WhatsApp"** (style pétant)
  - À la limite: "Continuer shopping" + "Valider"

---

## 3. Backend API Routes

### Routes d'authentification
```
POST   /api/auth/register          → Créer compte vendeur
POST   /api/auth/login             → Login
POST   /api/auth/logout            → Logout
GET    /api/auth/session           → Session actuelle
```

### Routes produits (protégées)
```
GET    /api/products               → Lister mes articles
POST   /api/products               → Créer un article
GET    /api/products/[id]          → Détail article
PATCH  /api/products/[id]          → Modifier article
DELETE /api/products/[id]          → Supprimer article
```

### Routes de la vitrine (publiques)
```
GET    /api/shop/[shopId]          → Infos du shop
GET    /api/shop/[shopId]/products → Lister articles (publique)
GET    /api/shop/[shopId]/product/[id] → Détail (publique)
```

### Routes WhatsApp
```
POST   /api/whatsapp/send-message  → Générer lien WhatsApp
GET    /api/whatsapp/webhooks      → Recevoir messages (optionnel)
```

### Routes de paiement (v2)
```
POST   /api/stripe/checkout        → Créer session Stripe
POST   /api/stripe/webhook         → Webhooks Stripe
GET    /api/subscriptions/status   → Statut abonnement
```

---

## 4. Base de données (Prisma Schema)

```prisma
// users.prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password_hash String
  shop_name     String
  phone_whatsapp String
  logo_url      String?
  shop_color    String?   @default("#25D366") // WhatsApp green
  plan          String    @default("free")    // free, pro, annual
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  products      Product[]
  subscription  Subscription?
  views         ProductView[]
}

model Product {
  id          String  @id @default(cuid())
  user_id     String
  user        User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  title       String
  price       Float
  description String
  category    String  // "T-shirts", "Pantalons", etc
  image_url   String  // Cloudinary URL
  stock       Int?
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  variations  ProductVariation[]
  views       ProductView[]
}

model ProductVariation {
  id          String @id @default(cuid())
  product_id  String
  product     Product @relation(fields: [product_id], references: [id], onDelete: Cascade)
  
  type        String  // "size", "color"
  value       String  // "M", "Noir"
  
  @@unique([product_id, type, value])
}

model Subscription {
  id          String @id @default(cuid())
  user_id     String @unique
  user        User   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  plan        String  // "free", "pro", "annual"
  stripe_id   String?
  status      String  // "active", "canceled", "expired"
  
  expires_at  DateTime?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}

model ProductView {
  id          String @id @default(cuid())
  product_id  String
  product     Product @relation(fields: [product_id], references: [id], onDelete: Cascade)
  
  user_id     String?
  user        User?   @relation(fields: [user_id], references: [id])
  
  user_ip     String?
  viewed_at   DateTime @default(now())
}

model Cart {
  id          String @id @default(cuid())
  user_id     String?
  session_id  String? // Pour les visiteurs non authentifiés
  
  items_json  String  // JSON: [{ productId, variations: {}, quantity, price }]
  total       Float
  
  created_at  DateTime @default(now())
  expires_at  DateTime // Auto-delete après 7 jours
}
```

---

## 5. Intégration WhatsApp

### Workflow
1. **Client clique "Commander via WhatsApp"**
2. **Backend génère message pré-rempli**:
   ```
   Bonjour ! Je souhaite commander :
   - Robe d'été Wax (M, Noir) x1 : 25 000 CFA
   - T-shirt blanc (L) x2 : 10 000 CFA
   
   TOTAL : 45 000 CFA
   
   Mon panier : https://panel-pub.com/shop/abc123/checkout/xyz789
   ```
3. **Redirection vers**: `https://wa.me/+221701234567?text=<MESSAGE_ENCODED>`
4. **Client envoie le message** au vendeur

### Pour recevoir les commandes (v2):
- Utiliser **Twilio** ou **Nozbe** API
- Webhooks pour recevoir messages
- Notif au vendeur: "Nouvelle commande reçue"

---

## 6. Système d'abonnement

### Limites par plan

| Fonctionnalité | Gratuit | Pro | Annuel |
|---|---|---|---|
| Articles max | 10 | Illimité | Illimité |
| Catégories | 3 | Illimités | Illimités |
| Variations | Non | Oui | Oui |
| Analytics | Non | Oui | Oui |
| Personnalisation | Non | Oui (logo, couleur) | Oui |
| Support | Non | Email | Prioritaire |
| **Prix/mois** | 0$ | 5-15$ | ~4.17$ (50$/an) |

### Logique d'application (backend)
```javascript
// checkPlan.ts
async function canAddProduct(userId) {
  const user = await db.user.findUnique({ where: { id: userId } });
  const productCount = await db.product.count({ where: { user_id: userId } });
  
  const limits = {
    free: 10,
    pro: Infinity,
    annual: Infinity
  };
  
  return productCount < limits[user.plan];
}
```

---

## 7. Infrastructure & DevOps

### Environnements

**Development** (`localhost:3000`)
- DB: Supabase dev
- Auth: NextAuth (email)
- Files: Cloudinary (dev account)

**Staging** (`staging.panel-pub.com`)
- DB: Supabase staging
- Auth: NextAuth (Google + Email)
- Files: Cloudinary (production account, dossier "staging")

**Production** (`panel-pub.com`)
- DB: Supabase prod (backup quotidien)
- Auth: NextAuth (Google + WhatsApp + Email)
- Files: Cloudinary (production)
- CDN: Cloudflare

### CI/CD Pipeline (GitHub Actions)

```yaml
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm run lint
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm run test
  
  build:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm run build
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## 8. Performance & Optimisation

### Cibles
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Optimisations
- Next.js Image Optimization (image automatiques WebP)
- Code splitting automatique
- Caching: 1 jour pour images, 5 min pour API
- Compression gzip
- Lazy loading des produits (pagination)

---

## 9. Sécurité

### Authentification
- NextAuth.js (JWT + sessions)
- HTTPS partout
- CSRF protection

### API
- Rate limiting: 100 req/min par IP
- Validation des inputs (Zod)
- SQL injection prevention (Prisma ORM)
- XSS prevention (sanitization)

### Données
- Chiffrement des mots de passe (bcrypt)
- Stockage sécurisé des clés Stripe
- RGPD: Export + suppression de données

---

## 10. Testing

### Unit Tests
```bash
npm run test:unit
```
- Validation des formules de prix
- Logique de panier
- Vérification des limites de plan

### Integration Tests
```bash
npm run test:integration
```
- Création de produit → Apparition sur vitrine
- Ajout panier → Message WhatsApp
- Upgrade plan → Limite augmentée

### E2E Tests
```bash
npm run test:e2e
```
- Workflow vendeur complet
- Workflow client complet
- Payment flow (Stripe)

---

## 11. Monitoring & Logs

### Services
- **Error tracking**: Sentry
- **Analytics**: Posthog (usage vendeur/client)
- **Logs**: Vercel logs + Supabase
- **Uptime**: UptimeRobot

### Alertes
- Erreur 500: Slack webhook
- Baisse de disponibilité: Email
- Pic de traffic: Notification

---

## 12. Dépendances clés

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "tailwindcss": "^3.3.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "next-auth": "^4.24.0",
  "stripe": "^14.0.0",
  "zod": "^3.22.0",
  "zustand": "^4.4.0",
  "cloudinary": "^1.33.0",
  "axios": "^1.6.0"
}
```

---

**Mise à jour**: 20/05/2026
