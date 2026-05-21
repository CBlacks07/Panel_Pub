# 🚀 Guide de démarrage (Getting Started)

## Prérequis

- **Node.js 18+** (`node -v`)
- **npm 9+** (`npm -v`)
- **Git** (`git --version`)
- **Compte Supabase** (https://supabase.com) - GRATUIT
- **Compte Cloudinary** (https://cloudinary.com) - GRATUIT
- **Compte Vercel** (https://vercel.com) - GRATUIT

---

## Étape 1: Initialiser le projet Next.js

```bash
# Créer un nouveau projet Next.js
npx create-next-app@latest panel-pub \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir

cd panel-pub
```

### Structure de départ
```
panel-pub/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.local
```

---

## Étape 2: Installer les dépendances essentielles

```bash
npm install \
  prisma @prisma/client \
  next-auth \
  zod \
  zustand \
  cloudinary next-cloudinary \
  axios \
  sonner

# Dev dependencies
npm install -D \
  @types/node \
  typescript \
  eslint \
  prettier
```

### Vérifier installation
```bash
npm list | grep -E "prisma|next-auth|cloudinary"
```

---

## Étape 3: Setup Supabase (Database)

### 1. Créer un compte
1. Aller à https://supabase.com/auth/sign-up
2. Sign up avec email
3. Créer une nouvelle organisation
4. Créer un nouveau projet (region: Europe ou Afrique)

### 2. Récupérer les credentials
```bash
# Dashboard Supabase → Settings → API
# Copier:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

### 3. Créer le fichier `.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Database URL pour Prisma
DATABASE_URL=postgresql://postgres:PASSWORD@xxxxx.supabase.co:5432/postgres

# Auth (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Stripe (plus tard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

---

## Étape 4: Setup Prisma

### 1. Initialiser Prisma

```bash
npx prisma init
```

Cela crée:
- `prisma/schema.prisma` (schéma de la DB)
- `.env` (copier dans `.env.local`)

### 2. Configurer le schéma

Copier ce contenu dans `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password_hash String
  shop_name     String
  phone_whatsapp String
  logo_url      String?
  shop_color    String?   @default("#25D366")
  plan          String    @default("free")
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  products      Product[]
  subscription  Subscription?
}

model Product {
  id          String  @id @default(cuid())
  user_id     String
  user        User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  title       String
  price       Float
  description String
  category    String
  image_url   String
  stock       Int?
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  variations  ProductVariation[]
}

model ProductVariation {
  id          String @id @default(cuid())
  product_id  String
  product     Product @relation(fields: [product_id], references: [id], onDelete: Cascade)
  
  type        String  // "size", "color"
  value       String
  
  @@unique([product_id, type, value])
}

model Subscription {
  id          String @id @default(cuid())
  user_id     String @unique
  user        User   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  plan        String
  stripe_id   String?
  status      String
  expires_at  DateTime?
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

### 3. Créer les migrations

```bash
npx prisma migrate dev --name init
```

Cela va:
- Créer les tables en Supabase
- Générer le client Prisma

### 4. Ouvrir Prisma Studio (optionnel)

```bash
npx prisma studio
# Ouvre http://localhost:5555 pour voir les données
```

---

## Étape 5: Setup NextAuth.js

### 1. Créer le fichier auth config

`src/lib/auth.ts`:

```typescript
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user) return null;
        // TODO: Vérifier le hash du password (bcrypt)
        
        return { id: user.id, email: user.email, name: user.shop_name };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  }
};
```

### 2. Créer l'API route

`src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 3. Créer Prisma client

`src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Étape 6: Setup Cloudinary

### 1. Créer un compte

1. Aller à https://cloudinary.com/users/register/free
2. Sign up gratuit
3. Copier les credentials

### 2. Créer un composant upload

`src/components/ImageUpload.tsx`:

```typescript
'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';

export function ImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [loading, setLoading] = useState(false);

  return (
    <CldUploadWidget
      uploadPreset="panel_pub_unsigned" // À créer dans Cloudinary
      onSuccess={(result: any) => {
        onUpload(result.info.secure_url);
        setLoading(false);
      }}
      onError={() => setLoading(false)}
    >
      {({ open }) => (
        <button
          onClick={() => {
            setLoading(true);
            open();
          }}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>
      )}
    </CldUploadWidget>
  );
}
```

---

## Étape 7: Pages essentielles

### Créer la structure

```bash
mkdir -p src/app/{(auth),dashboard,shop,api/products}
```

### Page d'accueil

`src/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">📱 Panel Pub</h1>
      <p className="mt-4 text-gray-600">Créer votre catalogue mobile en 5 min</p>
      
      <div className="mt-8 space-x-4">
        <a href="/login" className="px-6 py-3 bg-blue-500 text-white rounded">
          Connexion
        </a>
        <a href="/signup" className="px-6 py-3 bg-green-500 text-white rounded">
          Créer un compte
        </a>
      </div>
    </div>
  );
}
```

### Page de login

`src/app/(auth)/login/page.tsx`:

```typescript
'use client';

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/dashboard"
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-96 space-y-4">
        <h1 className="text-2xl font-bold">Connexion</h1>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
```

---

## Étape 8: Démarrer le serveur

```bash
# Démarrer le dev server
npm run dev

# Ou avec --turbopack (plus rapide)
npm run dev -- --turbopack
```

Ouvrir http://localhost:3000

---

## Étape 9: Déploiement sur Vercel

### 1. Créer un repo GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE_USERNAME/panel-pub.git
git push -u origin main
```

### 2. Déployer sur Vercel

```bash
npm i -g vercel
vercel

# Répondre aux questions:
# - Qui es-tu? GITHUB_ACCOUNT
# - Quel projet? panel-pub
# - Déceler les paramètres? Oui
```

### 3. Ajouter les variables d'environnement

Dans le dashboard Vercel:
- Settings → Environment Variables
- Copier toutes les variables de `.env.local`

---

## Étape 10: Tests locaux

### Tester l'authentification

```bash
# Créer un utilisateur de test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "shop_name": "Test Shop",
    "phone_whatsapp": "+221701234567"
  }'
```

### Tester la création de produit

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "T-shirt Blanc",
    "price": 15000,
    "description": "T-shirt 100% coton",
    "category": "T-shirts",
    "image_url": "https://...",
    "variations": [
      { "type": "size", "value": "M" },
      { "type": "size", "value": "L" }
    ]
  }'
```

---

## Checklist MVP

### Backend
- [ ] Authentification (signup, login, logout)
- [ ] Prisma schema validé
- [ ] API CRUD produits
- [ ] Upload images (Cloudinary)
- [ ] Gestion variations
- [ ] Génération message WhatsApp

### Frontend Vendeur
- [ ] Page dashboard
- [ ] Formulaire création article
- [ ] Liste articles
- [ ] Edit/delete article
- [ ] Settings (numéro WhatsApp)

### Frontend Client
- [ ] Page catalogue
- [ ] Détail produit
- [ ] Panier
- [ ] Lien WhatsApp

### DevOps
- [ ] Vercel deployment
- [ ] Environment variables
- [ ] Database backups
- [ ] Error tracking (Sentry)

---

## Commandes utiles

```bash
# Dev
npm run dev

# Build
npm run build
npm run start

# Database
npx prisma migrate dev
npx prisma studio

# Code quality
npm run lint
npm run format

# Tests (à ajouter)
npm run test

# Deploy
vercel deploy --prod
```

---

## Troubleshooting

### Erreur: "DATABASE_URL is not set"
```bash
# Vérifier .env.local
cat .env.local | grep DATABASE_URL

# Relancer le dev server
npm run dev
```

### Erreur: "Cannot find module 'prisma'"
```bash
npm install prisma @prisma/client
npx prisma generate
```

### Erreur: "NextAuth secret not found"
```bash
# Générer une nouvelle clé
openssl rand -base64 32

# Ajouter à .env.local
NEXTAUTH_SECRET=<LA_CLEP_GENEREE>
```

### Images Cloudinary ne s'affichent pas
```bash
# Vérifier les credentials
echo $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

# Vérifier upload preset (créer si nécessaire)
# Cloudinary Dashboard → Upload → Upload presets
```

---

## Prochaines étapes

1. ✅ **Complét ce guide** (vous êtes ici)
2. ⏭️ **Développer le MVP** (voir ROADMAP.md)
3. ⏭️ **Tester avec beta-users**
4. ⏭️ **Intégrer Stripe** (paiements)
5. ⏭️ **Marketing & growth**

---

## Ressources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Cloudinary](https://cloudinary.com/documentation)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Dernière mise à jour**: 20/05/2026
**Difficulté**: Intermédiaire (2-3 heures pour un dev)
