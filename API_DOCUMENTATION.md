# 📚 Documentation API

## Base URL

```
Development:  http://localhost:3000/api
Staging:      https://staging.panel-pub.com/api
Production:   https://panel-pub.com/api
```

## Authentication

Toutes les routes protégées nécessitent:
- **Header**: `Authorization: Bearer <JWT_TOKEN>`
- Ou **Cookie**: `next-auth.session-token`

Obtenir le token:
```bash
POST /auth/login
```

---

## 🔐 Routes d'authentification

### Register (Créer un compte)

```http
POST /auth/register
Content-Type: application/json

{
  "email": "vendor@example.com",
  "password": "SecurePass123!",
  "shop_name": "Ma Boutique",
  "phone_whatsapp": "+221701234567"
}
```

**Réponse (201 Created)**
```json
{
  "id": "cuid123",
  "email": "vendor@example.com",
  "shop_name": "Ma Boutique",
  "phone_whatsapp": "+221701234567",
  "plan": "free",
  "created_at": "2026-05-20T10:00:00Z"
}
```

**Erreurs**
```json
{
  "error": "Email already exists"  // 400
}
```

---

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "vendor@example.com",
  "password": "SecurePass123!"
}
```

**Réponse (200 OK)**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cuid123",
    "email": "vendor@example.com",
    "shop_name": "Ma Boutique",
    "plan": "free"
  }
}
```

---

### Logout

```http
POST /auth/logout
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK)**
```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current Session

```http
GET /auth/session
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK)**
```json
{
  "user": {
    "id": "cuid123",
    "email": "vendor@example.com",
    "shop_name": "Ma Boutique",
    "phone_whatsapp": "+221701234567",
    "plan": "pro",
    "logo_url": "https://...",
    "shop_color": "#25D366"
  }
}
```

---

## 📦 Routes produits (Vendeur)

### Lister mes articles

```http
GET /products?page=1&limit=20&category=T-shirts
Authorization: Bearer <TOKEN>
```

**Paramètres (query)**
| Paramètre | Type | Description |
|---|---|---|
| page | number | Numéro de page (default: 1) |
| limit | number | Articles par page (default: 20, max: 100) |
| category | string | Filtrer par catégorie (optionnel) |
| sort | string | "new", "old", "price_asc", "price_desc" |

**Réponse (200 OK)**
```json
{
  "items": [
    {
      "id": "prod123",
      "title": "Robe d'été Wax",
      "price": 25000,
      "description": "Robe 100% coton wax...",
      "category": "Robes",
      "image_url": "https://...",
      "stock": 10,
      "variations": [
        { "type": "size", "value": "S" },
        { "type": "size", "value": "M" },
        { "type": "color", "value": "Bleu" }
      ],
      "created_at": "2026-05-20T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 3
  }
}
```

---

### Créer un article

```http
POST /products
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "title": "Robe d'été Wax",
  "price": 25000,
  "description": "Robe 100% coton wax, taille régulière",
  "category": "Robes",
  "image_url": "https://cloudinary.com/...",
  "stock": 10,
  "variations": [
    { "type": "size", "value": "XS" },
    { "type": "size", "value": "S" },
    { "type": "size", "value": "M" },
    { "type": "color", "value": "Bleu" },
    { "type": "color", "value": "Noir" }
  ]
}
```

**Réponse (201 Created)**
```json
{
  "id": "prod123",
  "user_id": "user123",
  "title": "Robe d'été Wax",
  "price": 25000,
  "description": "...",
  "category": "Robes",
  "image_url": "https://...",
  "stock": 10,
  "variations": [...],
  "created_at": "2026-05-20T10:00:00Z"
}
```

**Erreurs**
```json
{
  "error": "Title is required"  // 400
}
```

---

### Obtenir un article

```http
GET /products/prod123
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK)**
```json
{
  "id": "prod123",
  "title": "Robe d'été Wax",
  "price": 25000,
  "description": "...",
  "category": "Robes",
  "image_url": "https://...",
  "stock": 10,
  "variations": [...]
}
```

---

### Modifier un article

```http
PATCH /products/prod123
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "title": "Robe d'été Wax (Nouvelle version)",
  "price": 27000,
  "stock": 8
}
```

**Réponse (200 OK)**
```json
{
  "id": "prod123",
  "title": "Robe d'été Wax (Nouvelle version)",
  "price": 27000,
  "stock": 8,
  "updated_at": "2026-05-20T11:00:00Z"
}
```

---

### Supprimer un article

```http
DELETE /products/prod123
Authorization: Bearer <TOKEN>
```

**Réponse (204 No Content)**
```
(Pas de body)
```

---

## 🛍️ Routes vitrine (Client)

### Infos du shop

```http
GET /shop/shop-slug
```

**Réponse (200 OK)**
```json
{
  "id": "shop123",
  "shop_name": "Ma Boutique Mode",
  "logo_url": "https://...",
  "shop_color": "#25D366",
  "phone_whatsapp": "+221701234567",
  "created_at": "2026-05-20T10:00:00Z"
}
```

---

### Lister articles (Public)

```http
GET /shop/shop-slug/products?category=T-shirts&page=1
```

**Réponse (200 OK)**
```json
{
  "items": [
    {
      "id": "prod123",
      "title": "T-shirt Blanc",
      "price": 10000,
      "image_url": "https://...",
      "category": "T-shirts",
      "short_description": "T-shirt 100% coton"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 3
  }
}
```

---

### Détail produit (Public)

```http
GET /shop/shop-slug/product/prod123
```

**Réponse (200 OK)**
```json
{
  "id": "prod123",
  "title": "T-shirt Blanc",
  "price": 10000,
  "description": "T-shirt 100% coton, fabrication locale",
  "image_url": "https://...",
  "category": "T-shirts",
  "stock": 20,
  "variations": [
    { "type": "size", "value": "S" },
    { "type": "size", "value": "M" },
    { "type": "size", "value": "L" },
    { "type": "color", "value": "Blanc" },
    { "type": "color", "value": "Noir" }
  ]
}
```

---

## 💬 Routes WhatsApp

### Générer un message

```http
POST /whatsapp/generate-message
Content-Type: application/json

{
  "shop_phone": "+221701234567",
  "items": [
    {
      "product_id": "prod123",
      "product_title": "T-shirt Blanc",
      "price": 10000,
      "quantity": 2,
      "variations": {
        "size": "M",
        "color": "Blanc"
      }
    },
    {
      "product_id": "prod124",
      "product_title": "Pantalon Noir",
      "price": 25000,
      "quantity": 1,
      "variations": {
        "size": "32"
      }
    }
  ]
}
```

**Réponse (200 OK)**
```json
{
  "message": "Bonjour ! Je souhaite commander :\n- T-shirt Blanc (M, Blanc) x2 : 20 000 CFA\n- Pantalon Noir (32) x1 : 25 000 CFA\n\nTOTAL : 45 000 CFA\n\nMon panier : https://panel-pub.com/cart/abc123",
  "whatsapp_link": "https://wa.me/221701234567?text=Bonjour%21%20Je%20souhaite%20commander%20...",
  "cart_url": "https://panel-pub.com/cart/abc123"
}
```

---

## 💳 Routes d'abonnement

### Vérifier le plan

```http
GET /subscription/status
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK)**
```json
{
  "plan": "pro",
  "status": "active",
  "expires_at": "2026-06-20T10:00:00Z",
  "article_limit": null,
  "article_count": 15,
  "next_billing_date": "2026-06-20T10:00:00Z"
}
```

---

### Créer une session de paiement Stripe

```http
POST /stripe/checkout
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "plan": "pro",  // "pro" ou "annual"
  "billing_cycle": "monthly"  // "monthly" ou "annual"
}
```

**Réponse (201 Created)**
```json
{
  "session_id": "cs_test_123",
  "url": "https://checkout.stripe.com/pay/cs_test_123",
  "expires_at": "2026-05-20T12:00:00Z"
}
```

---

### Webhook Stripe (POST)

```http
POST /stripe/webhook
Content-Type: application/json

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_123",
      "amount": 1000,
      "currency": "usd",
      "metadata": {
        "user_id": "user123",
        "plan": "pro"
      }
    }
  }
}
```

**Réponse (200 OK)**
```json
{
  "received": true
}
```

---

## 📊 Routes Analytics

### Statistiques produit

```http
GET /products/prod123/stats?period=7d
Authorization: Bearer <TOKEN>
```

**Paramètres**
- `period`: "1d", "7d", "30d", "90d"

**Réponse (200 OK)**
```json
{
  "product_id": "prod123",
  "views": 245,
  "views_today": 12,
  "clicks_to_cart": 45,
  "conversion_rate": 0.18,
  "graph": [
    { "date": "2026-05-20", "views": 45, "clicks": 8 },
    { "date": "2026-05-19", "views": 38, "clicks": 6 }
  ]
}
```

---

### Dashboard vendeur

```http
GET /analytics/dashboard?period=7d
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK)**
```json
{
  "total_views": 1245,
  "total_carts": 156,
  "conversion_rate": 0.125,
  "top_products": [
    {
      "id": "prod123",
      "title": "Robe d'été",
      "views": 245,
      "carts": 32
    }
  ],
  "daily_stats": [
    { "date": "2026-05-20", "views": 245, "carts": 32 }
  ]
}
```

---

## 🐛 Codes d'erreur

| Code | Signification |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (token missing/invalid) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (déjà existe) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

**Format erreur standard**
```json
{
  "error": "Description de l'erreur",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 🔒 Rate Limiting

- **Authentifiés**: 100 req/min par API key
- **Publics**: 20 req/min par IP
- **Webhooks**: Pas de limite

**Réponse (429)**
```json
{
  "error": "Too many requests",
  "retry_after": 60
}
```

---

## 📋 Validation des inputs

### Email
- Format: RFC 5322
- Max: 255 chars
- Unique dans la DB

### Password
- Min: 8 chars
- Doit contenir: 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial

### Price
- Type: Float
- Min: 0
- Max: 999,999,999

### Variations
- Peut avoir plusieurs "size", plusieurs "color"
- Value: Max 50 chars
- Pas de doublons

---

## 🧪 Exemples cURL

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@example.com",
    "password": "SecurePass123!",
    "shop_name": "My Shop",
    "phone_whatsapp": "+221701234567"
  }'
```

### Créer un produit

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "T-shirt",
    "price": 15000,
    "description": "T-shirt 100% coton",
    "category": "T-shirts",
    "image_url": "https://cloudinary.com/...",
    "stock": 20,
    "variations": [
      { "type": "size", "value": "M" },
      { "type": "size", "value": "L" },
      { "type": "color", "value": "Noir" }
    ]
  }'
```

### Lister ses produits

```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Collections Postman

Télécharger la collection Postman: [panel-pub.postman_collection.json](./postman/collection.json)

Ou importer depuis le lien:
```
https://www.postman.com/collections/panel-pub
```

---

**Dernière mise à jour**: 20/05/2026
**Version API**: v1.0.0
