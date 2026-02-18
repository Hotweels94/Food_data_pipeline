import Database from "better-sqlite3";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongo";
import RawProduct from "@/models/RawProduct";
import EnrichedProduct from "@/models/EnrichedProduct";
import { fetchOpenFoodFacts } from "@/services/openFood";
import computeNutriScorePersonalized from "@/utils/computeNutriScorePersonalized";
import fromEurope from "@/utils/fromEurope";

describe("Tests d'intégration - Pipeline complet sur un petit jeu de données", () => {
  let testDb: Database.Database;
  const dbPath = ":memory:";

  beforeEach(() => {
    // Créer une base de données SQLite de test en mémoire
    testDb = new Database(dbPath);
    
    // Créer la structure de la table dans la base de test
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mongo_id TEXT UNIQUE NOT NULL,         
        name TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        nutriscore_score INTEGER,              
        from_europe TEXT,                     
        calories INTEGER,
        fat REAL,
        sugar REAL,
        salt REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  afterEach(async () => {
    testDb.close();
    // Nettoyer MongoDB si connecté
    if (mongoose.connection.readyState === 1) {
      await RawProduct.deleteMany({});
      await EnrichedProduct.deleteMany({});
      await mongoose.disconnect();
    }
  });

  it("devrait exécuter le pipeline complet : collect -> enrich -> normalize", async () => {
    // Étape 1: Collect - Récupérer des données réelles de l'API
    const products = await fetchOpenFoodFacts(1, 3);
    
    expect(products.length).toBeGreaterThan(0);

    // Étape 2: Stocker dans MongoDB (simulation)
    // Note: Ce test nécessite une connexion MongoDB réelle
    // Pour un test isolé, on peut mocker cette partie
    
    // Créer des données de test simulées
    const testProducts = products.slice(0, Math.min(3, products.length)).map((product) => ({
      product_name: product.product_name || "Test Product",
      brands: product.brands || "",
      categories: product.categories || "",
      nutriscore_grade: product.nutriscore_grade || "E",
      country: product.countries || "France",
      nutriments: product.nutriments || {},
    }));

    // Étape 3: Enrichissement - Simuler le processus d'enrichissement
    const enrichedData = testProducts.map((product) => {
      const nutriscore_grade = product.nutriscore_grade || "E";
      const nutri_score_personalized = computeNutriScorePersonalized(nutriscore_grade);
      const fromEuropeValue = fromEurope(product.country);

      return {
        raw_product_data: product,
        nutri_score_personalized: nutri_score_personalized,
        fromEurope: fromEuropeValue,
      };
    });

    expect(enrichedData).toHaveLength(testProducts.length);
    enrichedData.forEach((enriched) => {
      expect(enriched).toHaveProperty("nutri_score_personalized");
      expect(enriched).toHaveProperty("fromEurope");
      expect(["Europe", "Non-Europe"]).toContain(enriched.fromEurope);
    });

    // Étape 4: Normalisation - Insérer dans SQLite
    const stmt = testDb.prepare(`
      INSERT OR IGNORE INTO products (
        mongo_id, name, brand, category,
        nutriscore_score, from_europe,
        calories, fat, sugar, salt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    enrichedData.forEach((enriched, index) => {
      const data = enriched.raw_product_data;
      const nutriments = data.nutriments || {};

      stmt.run(
        `test_mongo_id_${index}`,
        data.product_name || "",
        data.brands || "",
        data.categories || "",
        enriched.nutri_score_personalized || 0,
        enriched.fromEurope,
        (nutriments.energy as number) || null,
        (nutriments.fat as number) || null,
        (nutriments.sugars as number) || null,
        (nutriments.salt as number) || null,
      );
    });

    // Vérifier que les données sont dans SQLite
    const selectStmt = testDb.prepare("SELECT * FROM products");
    const sqliteProducts = selectStmt.all();

    expect(sqliteProducts.length).toBe(testProducts.length);

    // Vérifier la structure des données normalisées
    sqliteProducts.forEach((product: any) => {
      expect(product).toHaveProperty("mongo_id");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("nutriscore_score");
      expect(product).toHaveProperty("from_europe");
      expect(["Europe", "Non-Europe"]).toContain(product.from_europe);
    });
  }, 30000); // Timeout de 30 secondes pour le pipeline complet

  it("devrait maintenir la cohérence des données à travers le pipeline", async () => {
    // Créer un jeu de données de test contrôlé
    const testProduct = {
      product_name: "Produit Test Cohérence",
      brands: "Marque Test",
      categories: "Catégorie Test",
      nutriscore_grade: "B",
      country: "France",
      nutriments: {
        energy: 150,
        fat: 8.5,
        sugars: 12.3,
        salt: 0.7,
      },
    };

    // Enrichissement
    const nutri_score = computeNutriScorePersonalized(testProduct.nutriscore_grade);
    const fromEuropeValue = fromEurope(testProduct.country);

    expect(nutri_score).toBe(30); // B = 30
    expect(fromEuropeValue).toBe("Europe");

    // Normalisation
    const stmt = testDb.prepare(`
      INSERT INTO products (
        mongo_id, name, brand, category,
        nutriscore_score, from_europe,
        calories, fat, sugar, salt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      "coherence_test_id",
      testProduct.product_name,
      testProduct.brands,
      testProduct.categories,
      nutri_score,
      fromEuropeValue,
      testProduct.nutriments.energy,
      testProduct.nutriments.fat,
      testProduct.nutriments.sugars,
      testProduct.nutriments.salt,
    );

    // Vérifier la cohérence
    const selectStmt = testDb.prepare("SELECT * FROM products WHERE mongo_id = ?");
    const product = selectStmt.get("coherence_test_id") as any;

    expect(product.name).toBe(testProduct.product_name);
    expect(product.brand).toBe(testProduct.brands);
    expect(product.category).toBe(testProduct.categories);
    expect(product.nutriscore_score).toBe(30);
    expect(product.from_europe).toBe("Europe");
    expect(product.calories).toBe(150);
    expect(product.fat).toBe(8.5);
    expect(product.sugar).toBe(12.3);
    expect(product.salt).toBe(0.7);
  });

  it("devrait gérer les produits avec des données incomplètes", async () => {
    const incompleteProduct: {
      product_name: string;
      nutriscore_grade?: string;
      country?: string;
    } = {
      product_name: "Produit Incomplet",
      // Pas de brands, categories, nutriscore_grade, etc.
    };

    // Enrichissement avec valeurs par défaut
    const nutri_score = computeNutriScorePersonalized(incompleteProduct.nutriscore_grade || "E");
    const fromEuropeValue = fromEurope(incompleteProduct.country || "");

    expect(nutri_score).toBe(0); // E par défaut
    expect(fromEuropeValue).toBe("Non-Europe"); // Pays vide = Non-Europe

    // Normalisation
    const stmt = testDb.prepare(`
      INSERT INTO products (
        mongo_id, name, brand, category,
        nutriscore_score, from_europe,
        calories, fat, sugar, salt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      "incomplete_test_id",
      incompleteProduct.product_name || "",
      "",
      "",
      nutri_score,
      fromEuropeValue,
      null,
      null,
      null,
      null,
    );

    // Vérifier que les valeurs par défaut sont appliquées
    const selectStmt = testDb.prepare("SELECT * FROM products WHERE mongo_id = ?");
    const product = selectStmt.get("incomplete_test_id") as any;

    expect(product.name).toBe("Produit Incomplet");
    expect(product.brand).toBe("");
    expect(product.category).toBe("");
    expect(product.nutriscore_score).toBe(0);
    expect(product.from_europe).toBe("Non-Europe");
    expect(product.calories).toBeNull();
  });
});
