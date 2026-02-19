# Food Data Pipeline

Application web de **collecte, enrichissement et consultation** de données produits alimentaires, alimentée par l’API [Open Food Facts](https://world.openfoodfacts.org/). Le projet met en place un pipeline ETL (Extract, Transform, Load) avec stockage MongoDB pour les données brutes et enrichies, puis export vers SQLite pour la requêtage et l’affichage.

---

## Table des matières

- [Instructions d’installation](#instructions-dinstallation)
- [Architecture](#architecture)
- [Choix techniques](#choix-techniques)

---

## Instructions d’installation

### Prérequis

- **Node.js** 20+ (LTS recommandé)
- **npm** (ou yarn / pnpm / bun)
- **MongoDB** (local ou Atlas) pour la collecte et l’enrichissement

### Étapes

1. **Cloner le dépôt et entrer dans le projet**

   ```bash
   cd Food_data_pipeline
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configurer les variables d’environnement**

   Créer un fichier `.env` à la racine du projet :

   ```env
   MONGO_URI=mongodb://localhost:27017/food-data-pipeline
   ```

   Pour MongoDB Atlas, utiliser une URI du type :

   ```env
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/food-data-pipeline
   ```

4. **Créer le répertoire de la base SQLite (optionnel)**

   La base SQLite est créée au premier enrichissement. Pour éviter les erreurs si le dossier n’existe pas :

   ```bash
   mkdir -p database
   ```

   Sous Windows (PowerShell) :

   ```powershell
   New-Item -ItemType Directory -Force -Path database
   ```

5. **Lancer l’application en développement**

   ```bash
   npm run dev
   ```

   L’application est disponible sur [http://localhost:3000](http://localhost:3000).

### Commandes utiles

| Commande              | Description                    |
|-----------------------|--------------------------------|
| `npm run dev`         | Serveur de développement       |
| `npm run build`       | Build de production            |
| `npm run start`       | Démarrer en mode production    |
| `npm test`            | Lancer les tests               |
| `npm run test:watch`  | Tests en mode watch            |
| `npm run test:coverage` | Tests avec couverture de code |
| `npm run lint`        | Vérification ESLint            |

### Premier chargement des données

1. **Collecte** : appeler l’API de collecte pour récupérer des produits Open Food Facts (ex. page 2, 100 produits) :
   ```
   GET http://localhost:3000/api/collect?page=2&limit=100
   ```

2. **Enrichissement** : lancer l’enrichissement et le transfert Mongo → SQLite :
   ```
   GET http://localhost:3000/api/enrich
   ```

3. Ensuite, consulter le **catalogue** (`/products`) et les **statistiques** (`/stats`) dans l’interface.

---

## Architecture

### Vue d’ensemble du pipeline

Le flux de données suit un schéma ETL classique :

```
Open Food Facts API
        │
        ▼
   [Collecte]  ──►  MongoDB (RawProduct)
        │
        ▼
   [Enrichissement]  ──►  MongoDB (EnrichedProduct)
        │
        ▼
   [Export]  ──►  SQLite (tables normalisées)
        │
        ▼
   [Consultation]  ──►  API / Pages Next.js
```

### Couches de l’application

| Couche        | Rôle |
|---------------|------|
| **API Next.js** | Routes `/api/collect`, `/api/enrich`, `/api/products`, `/api/products/[id]`, `/api/stats` |
| **Services**  | `openFood.ts` — appels à l’API Open Food Facts (recherche, pagination) |
| **Modèles**   | `RawProduct`, `EnrichedProduct` (Mongoose) — schémas MongoDB |
| **Utils**     | `fromEurope`, `computeNutriScorePersonalized` — règles métier d’enrichissement |
| **Lib**       | `mongo.ts` (connexion MongoDB), `initDb.js` (schéma SQLite + migration Mongo → SQLite) |
| **Front**     | Pages Next.js App Router : `/`, `/products`, `/products/[id]`, `/stats` |

### Flux détaillé

1. **Collecte (`/api/collect`)**
   - Paramètres : `page`, `limit`.
   - Récupère des produits via `fetchOpenFoodFacts(page, limit)`.
   - Pour chaque produit : hash SHA1 du payload, insertion dans `RawProduct` (source, `fetched_at`, `raw_hash`, `payload`).
   - Évite les doublons grâce à l’unicité de `raw_hash`.

2. **Enrichissement (`/api/enrich`)**
   - Vide la collection `EnrichedProduct`.
   - Pour chaque `RawProduct` : calcul du Nutri-Score personnalisé (A→40, B→30, C→20, D→10, E→0), détermination Europe / Non-Europe à partir du pays.
   - Enregistrement dans `EnrichedProduct` (lien vers `RawProduct`, `raw_product_data`, `nutri_score_personalized`, `fromEurope`).
   - Création / réinitialisation des tables SQLite puis migration de tous les `EnrichedProduct` vers SQLite (produits, marques, catégories, nutriscores, régions).

3. **Consultation**
   - **Produits** : `/api/products` (pagination, filtres nom, Nutri-Score, Europe, catégorie, marque) et `/api/products/[id]` — lecture SQLite uniquement.
   - **Statistiques** : `/api/stats` — nombre total de produits et moyenne du Nutri-Score (SQLite).

### Schéma des données

- **MongoDB**
  - **RawProduct** : `source`, `fetched_at`, `raw_hash` (unique), `payload` (objet brut Open Food Facts).
  - **EnrichedProduct** : `raw_product` (ref RawProduct), `raw_product_data`, `nutri_score_personalized`, `fromEurope` ("Europe" | "Non-Europe").

- **SQLite**
  - Tables de référence : `brands`, `categories`, `nutriscores`, `regions`.
  - Table principale : `products` (id, mongo_id, name, code, image_url, brand_id, category_id, nutriscore_id, region_id, calories, fat, sugar, salt, created_at).
  - Les catégories sont dérivées par règles métier (texte → "Boisson", "Viande", "Fruit et légumes", "Snacks", "Poisson et crustacé", "Pas de catégories").

---

## Choix techniques

### Stack

- **Next.js 16** (App Router) — serveur, API routes et rendu des pages.
- **TypeScript** — typage du code et des modèles.
- **MongoDB + Mongoose** — stockage des données brutes et enrichies, souplesse du schéma pour le payload Open Food Facts.
- **SQLite (better-sqlite3)** — base relationnelle locale pour requêtes et filtres performants côté lecture.
- **Tailwind CSS** — mise en forme de l’interface.
- **Jest + ts-jest** — tests unitaires et d’intégration.

### Pourquoi MongoDB pour la collecte et l’enrichissement ?

- Stockage du **payload brut** sans schéma figé (champs variables selon les produits).
- Gestion simple des **doublons** via `raw_hash` unique.
- Enrichissement par traitement par lot sur les documents, puis export unique vers SQLite.

### Pourquoi SQLite pour la consultation ?

- **Lecture rapide** et requêtes SQL (jointures, filtres, pagination) sans serveur dédié.
- **Schéma normalisé** (marques, catégories, nutriscores, régions) adapté à l’affichage et aux stats.
- Fichier unique `database/products.db` : déploiement et sauvegarde simples.

### Règles métier principales

- **Nutri-Score personnalisé** : lettre (A–E) convertie en score numérique (40 à 0) pour tri et agrégations.
- **Europe / Non-Europe** : liste de pays (et variantes linguistiques) considérés comme européens ; tout le reste est "Non-Europe".
- **Catégories** : dérivation à partir des champs `categories` et `product_name` par mots-clés (boisson, viande, fruit/légume, snack, poisson/crustacé, etc.).

### Tests

- **Unitaires** : parsing, enrichissement (`computeNutriScorePersonalized`, `fromEurope`), normalisation, mapping ETL.
- **Intégration** : requêtes SQL (SQLite), endpoints API, pipeline complet (collecte → enrichissement → SQLite).

Voir `__tests__/README.md` pour l’exécution et la structure des tests.
