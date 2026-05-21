# 🗺️ Roadmap de développement

## Phase 1: MVP (8 semaines)

### Semaine 1-2: Foundation & Setup

#### Tâches techniques
- [ ] Initialiser Next.js 14 project
- [ ] Configurer Tailwind CSS + shadcn/ui
- [ ] Connecter Supabase (PostgreSQL)
- [ ] Setup Prisma ORM
- [ ] Configurer NextAuth.js (email provider)
- [ ] Initialiser Cloudinary integration
- [ ] Configurer Git + GitHub repo
- [ ] Setup CI/CD (GitHub Actions)

#### Tâches design
- [ ] Design system (couleurs, typographie, spacing)
- [ ] Maquette Dashboard vendeur (Figma)
- [ ] Maquette Vitrine client (Figma)
- [ ] Component library plan

#### Estimé: 80 heures

---

### Semaine 3-4: Dashboard Vendeur v1

#### Authentification
- [ ] Page de registration vendeur
- [ ] Page de login
- [ ] Forgot password flow
- [ ] Email verification
- [ ] Session management

#### Dashboard principal
- [ ] Layout sidebar + main
- [ ] Vue d'ensemble (stats simples)
- [ ] Liste des articles (pagination)
- [ ] Bouton "+ Nouvel article"

#### Création d'article
- [ ] Formulaire de création
- [ ] Upload image (Cloudinary)
- [ ] Sélection catégorie
- [ ] Validation input (Zod)
- [ ] Sauvegarde en DB
- [ ] Succès/erreur messages

#### Estimé: 100 heures

---

### Semaine 5: Édition & Suppression

#### Gestion d'articles
- [ ] Page édition article
- [ ] Formulaire pré-rempli
- [ ] Modification image
- [ ] Bouton suppression + confirmation
- [ ] Soft delete (optionnel)

#### Variations (Tailles/Couleurs)
- [ ] Interface ajout variations
- [ ] Array dynamique (add/remove)
- [ ] Validation variations
- [ ] Sauvegarde DB (normalisée)

#### Estimé: 50 heures

---

### Semaine 6: Vitrine Client v1

#### Pages publiques
- [ ] Page `/shop/[shopId]` (layout principal)
- [ ] Affichage du shop (nom, logo optionnel)
- [ ] Grille produits (responsive grid)
- [ ] Filtre par catégorie
- [ ] Détail produit page

#### Détail produit
- [ ] Carousel images
- [ ] Affichage prix, titre, description
- [ ] Sélection variations (buttons)
- [ ] Input quantité
- [ ] Bouton "Ajouter au panier"

#### Estimé: 70 heures

---

### Semaine 7: Panier & WhatsApp

#### Panier
- [ ] State management (Zustand)
- [ ] Stockage localStorage
- [ ] Page résumé panier
- [ ] Récapitulatif articles
- [ ] Bouton supprimer item
- [ ] Calcul total

#### WhatsApp Integration
- [ ] Générateur de message
- [ ] Lien WhatsApp clickable
- [ ] Encoding URL + message
- [ ] Redirect vers WhatsApp
- [ ] Sharing panier (URL)

#### Estimé: 60 heures

---

### Semaine 8: Polish & Déploiement

#### Finitions
- [ ] Design responsive (mobile-first)
- [ ] Performance optimization
- [ ] SEO base (meta tags, sitemap)
- [ ] Compression images
- [ ] Lazy loading produits
- [ ] Loading states

#### Tests & QA
- [ ] Tests unitaires (80% coverage)
- [ ] Tests intégration (workflows clés)
- [ ] Tests manuels (tous devices)
- [ ] Bug fixes

#### Déploiement
- [ ] Vercel deployment (staging)
- [ ] Configuration domain
- [ ] SSL certificate
- [ ] Environment variables
- [ ] Production deployment
- [ ] Monitoring setup (Sentry)

#### Estimé: 90 heures

---

**Phase 1 Total: ~550 heures (~15 semaines pour 1 dev)**

---

## Phase 2: Monétisation (Semaines 9-11)

### Semaine 9: Système d'abonnement

#### Plans & Limites
- [ ] Modèle de données pour plans
- [ ] Logic vérification de limites (gratuit 10 articles)
- [ ] Dashboard limiteur UI (info limite articles)
- [ ] API endpoint pour vérifier plan

#### Pricing Page
- [ ] Page `/pricing`
- [ ] Affichage 3 plans (Free, Pro, Annual)
- [ ] Comparaison features
- [ ] CTA "Choose plan"

#### Estimé: 40 heures

---

### Semaine 10-11: Stripe Integration

#### Checkout
- [ ] Page d'upgrade `/upgrade`
- [ ] Sélection du plan
- [ ] Bouton "Subscribe" → Stripe
- [ ] Stripe session creation

#### Payment Processing
- [ ] Stripe webhooks (payment_intent.succeeded)
- [ ] Mise à jour user.plan en DB
- [ ] Confirmation email
- [ ] Dashboard accès activé

#### Account Management
- [ ] Page manage subscription
- [ ] Afficher plan actuel
- [ ] Bouton "Cancel subscription"
- [ ] Bouton "Upgrade plan"

#### Estimé: 70 heures

---

**Phase 2 Total: ~110 heures**

---

## Phase 3: Analytics (Semaines 12-14)

### Semaine 12: Event Tracking

#### Setup
- [ ] Intégration Posthog
- [ ] Events tracking (création article, click panier, etc)
- [ ] User identification
- [ ] Session recording (optionnel)

#### Backend
- [ ] Endpoint tracking produit views
- [ ] Enregistrement IP utilisateur
- [ ] Stockage views en DB
- [ ] API aggregation stats

#### Estimé: 50 heures

---

### Semaine 13-14: Analytics Dashboard

#### Dashboards Vendeur
- [ ] Page `/dashboard/analytics`
- [ ] Graphique clics/jour (7 derniers jours)
- [ ] Top 5 produits
- [ ] Total vues
- [ ] Conversion rate (panier/vues)

#### Exports
- [ ] Export CSV (7, 30, 90 jours)
- [ ] PDF report generation
- [ ] Scheduled email reports (optionnel)

#### Estimé: 80 heures

---

**Phase 3 Total: ~130 heures**

---

## Phase 4: Améliorations & Évolution (Semaine 15+)

### Priorisation

#### Haute priorité (P1)
- [ ] Multi-langue (FR/EN/AR)
- [ ] Support technique (chat live)
- [ ] Onboarding flow (tutorial)
- [ ] Notifications email (stock bas, nouveau panier)
- [ ] Export produits (CSV)

#### Moyenne priorité (P2)
- [ ] API publique (partners)
- [ ] Custom domains (mon-shop.com)
- [ ] Advanced analytics (funnel, cohorts)
- [ ] Bulk import articles (Excel)
- [ ] App mobile (React Native)

#### Basse priorité (P3)
- [ ] Paiements directs (Stripe, Wave)
- [ ] Intégration TikTok Shop
- [ ] Affiliate program
- [ ] Marketplace (vendre templates)
- [ ] Multi-vendor (grouping similar shops)

### Estimations futures
- Multi-langue: 80 heures
- Live chat: 100 heures
- Mobile app: 300+ heures
- Paiements: 150 heures

---

## Timeline visuelle

```
Week:    1-2      3-4       5        6        7        8
Phase 1: [Setup] [Dashboard] [Edit] [Client] [Cart] [Deploy]
         
Week:    9        10-11    12        13-14
Phase 2: [Plans] [Stripe] [Tracking] [Analytics]

Month 4-6:
Phase 3: [Multi-lang, Mobile, Payments, Integrations]
```

---

## Jalons critiques

### MVP Launch (Semaine 8)
- ✅ Dashboard vendeur fonctionnel
- ✅ Vitrine client beau
- ✅ WhatsApp working
- ✅ Déployé en production

### Objectifs:
- 50 beta-testeurs
- 10+ articles publiés par testeur
- 80%+ user satisfaction

### Monétisation Launch (Semaine 11)
- ✅ Plans d'abonnement actifs
- ✅ Paiements Stripe working
- ✅ Pricing page optimisée

### Objectifs:
- 2-3 conversions Day 1
- 10% conversion rate

### Public Beta (Semaine 15)
- ✅ Analytics complètes
- ✅ Performance optimisée
- ✅ Support email

### Objectifs:
- 500 vendeurs signup
- 50+ actifs
- 100+ articles en ligne

---

## Équipe & Ressources

### MVP (8 semaines)
- **1x Full-stack dev** (Next.js + DB)
- **1x Part-time designer** (UI/UX)
- **Total**: ~1.5 FTE

### Avec Phase 2-3 (14 semaines)
- **1x Full-stack dev** (continued)
- **1x Backend dev** (si scaling)
- **1x DevOps** (infrastructure, monitoring)
- **1x Product manager**

### Outils & Services
- **Hosting**: Vercel (free tier)
- **Database**: Supabase (free tier + paid)
- **Images**: Cloudinary (free tier)
- **Email**: Sendgrid / Resend
- **Analytics**: Posthog (free tier)
- **Monitoring**: Sentry (free tier)
- **Version control**: GitHub

### Budget estimé pour MVP
- Outils SaaS: ~50-100$/mois
- Domain + SSL: ~15$/année
- Cloudinary paid (après free): ~100$/année
- Supabase paid (après free): ~500-1000$/mois

---

## Métriques de succès

### Phase 1 (MVP)
- [ ] Zero critical bugs
- [ ] LCP < 2.5s
- [ ] 95% test coverage critiques
- [ ] 50 beta-testeurs inscrits

### Phase 2 (Monétisation)
- [ ] 2-5% conversion rate
- [ ] 10+ subscriptions PRO
- [ ] Churn rate < 10%

### Phase 3 (Analytics)
- [ ] 80% satisfaction vendeurs
- [ ] 1000 articles en ligne
- [ ] 100+ vendeurs actifs

### Phase 4 (Scale)
- [ ] 5000 vendeurs
- [ ] 1M+ articles
- [ ] 50K$ MRR
- [ ] 95% uptime

---

## Risques & Mitigation

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Churn élevé vendeurs | 🔴 Haute | Moyen | Onboarding + support |
| Performance DB | 🔴 Haute | Moyen | Caching + indexing |
| Fraud (skus duplicates) | 🟡 Moyen | Faible | Validation backend |
| Compliance RGPD | 🟡 Moyen | Faible | Audit + legal review |
| Concurrence | 🟡 Moyen | Haute | Pricing + support |

---

**Dernière mise à jour**: 20/05/2026
