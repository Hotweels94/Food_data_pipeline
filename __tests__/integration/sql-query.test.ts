import Database from "better-sqlite3";
import db from "@/lib/initDb.js";

describe("Tests d'intégration - Requêtes SQL", () => {
  let testDb: Database.Database;

  beforeEach(() => {
    // Créer une base de données de test en mémoire
    testDb = new Database(":memory:");
    
    // Créer la structure de la table
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

    // Insérer des données de test
    const stmt = testDb.prepare(`
      INSERT INTO products (
        mongo_id, name, brand, category,
        nutriscore_score, from_europe,
        calories, fat, sugar, salt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run("mongo_1", "Produit A", "Marque X", "Catégorie 1", 40, "Europe", 100, 5.0, 10.0, 0.5);
    stmt.run("mongo_2", "Produit B", "Marque Y", "Catégorie 2", 30, "Europe", 200, 10.0, 15.0, 1.0);
    stmt.run("mongo_3", "Produit C", "Marque Z", "Catégorie 1", 20, "Non-Europe", 150, 7.5, 12.0, 0.8);
    stmt.run("mongo_4", "Produit D", "Marque X", "Catégorie 3", 10, "Non-Europe", 300, 15.0, 20.0, 2.0);
  });

  afterEach(() => {
    testDb.close();
  });

  it("devrait exécuter une requête SELECT simple", () => {
    const stmt = testDb.prepare("SELECT * FROM products");
    const products = stmt.all();

    expect(products).toHaveLength(4);
    expect(products[0]).toHaveProperty("name");
    expect(products[0]).toHaveProperty("brand");
  });

  it("devrait filtrer par nom avec LIKE", () => {
    const stmt = testDb.prepare("SELECT * FROM products WHERE name LIKE ?");
    const products = stmt.all("%Produit A%");

    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Produit A");
  });

  it("devrait filtrer par nutriscore_score", () => {
    const stmt = testDb.prepare("SELECT * FROM products WHERE nutriscore_score = ?");
    const products = stmt.all(40);

    expect(products).toHaveLength(1);
    expect(products[0].nutriscore_score).toBe(40);
  });

  it("devrait filtrer par from_europe", () => {
    const stmt = testDb.prepare("SELECT * FROM products WHERE from_europe = ?");
    const europeProducts = stmt.all("Europe");

    expect(europeProducts).toHaveLength(2);
    europeProducts.forEach((product: any) => {
      expect(product.from_europe).toBe("Europe");
    });
  });

  it("devrait filtrer par brand avec LIKE", () => {
    const stmt = testDb.prepare("SELECT * FROM products WHERE brand LIKE ?");
    const products = stmt.all("%Marque X%");

    expect(products).toHaveLength(2);
    products.forEach((product: any) => {
      expect(product.brand).toContain("Marque X");
    });
  });

  it("devrait filtrer par category avec LIKE", () => {
    const stmt = testDb.prepare("SELECT * FROM products WHERE category LIKE ?");
    const products = stmt.all("%Catégorie 1%");

    expect(products).toHaveLength(2);
  });

  it("devrait combiner plusieurs filtres avec AND", () => {
    const stmt = testDb.prepare(
      "SELECT * FROM products WHERE from_europe = ? AND nutriscore_score = ?"
    );
    const products = stmt.all("Europe", 40);

    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Produit A");
  });

  it("devrait compter le total avec COUNT", () => {
    const stmt = testDb.prepare("SELECT COUNT(*) as total FROM products");
    const result = stmt.get() as { total: number };

    expect(result.total).toBe(4);
  });

  it("devrait compter avec des filtres", () => {
    const stmt = testDb.prepare(
      "SELECT COUNT(*) as total FROM products WHERE from_europe = ?"
    );
    const result = stmt.get("Europe") as { total: number };

    expect(result.total).toBe(2);
  });

  it("devrait trier les résultats par nom", () => {
    const stmt = testDb.prepare("SELECT * FROM products ORDER BY name ASC");
    const products = stmt.all() as any[];

    expect(products[0].name).toBe("Produit A");
    expect(products[products.length - 1].name).toBe("Produit D");
  });

  it("devrait utiliser LIMIT et OFFSET pour la pagination", () => {
    const stmt = testDb.prepare(
      "SELECT * FROM products ORDER BY name ASC LIMIT ? OFFSET ?"
    );
    const page1 = stmt.all(2, 0) as any[];
    const page2 = stmt.all(2, 2) as any[];

    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);
    expect(page1[0].name).toBe("Produit A");
    expect(page2[0].name).toBe("Produit C");
  });

  it("devrait gérer les valeurs NULL correctement", () => {
    const insertStmt = testDb.prepare(`
      INSERT INTO products (
        mongo_id, name, brand, category,
        nutriscore_score, from_europe,
        calories, fat, sugar, salt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run("mongo_null", "Produit NULL", null, null, null, null, null, null, null, null);

    const stmt = testDb.prepare("SELECT * FROM products WHERE mongo_id = ?");
    const product = stmt.get("mongo_null") as any;

    expect(product.brand).toBeNull();
    expect(product.category).toBeNull();
    expect(product.nutriscore_score).toBeNull();
  });

  it("devrait gérer les produits sans nom avec TRIM et COALESCE", () => {
    const insertStmt = testDb.prepare(`
      INSERT INTO products (
        mongo_id, name, brand, category,
        nutriscore_score, from_europe,
        calories, fat, sugar, salt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run("mongo_empty", "", "Brand", "Category", 20, "Europe", 100, 5, 10, 0.5);

    const stmt = testDb.prepare(
      "SELECT * FROM products WHERE TRIM(COALESCE(name, '')) = ''"
    );
    const products = stmt.all() as any[];

    expect(products.length).toBeGreaterThanOrEqual(1);
    const emptyNameProduct = products.find((p: any) => p.mongo_id === "mongo_empty");
    expect(emptyNameProduct).toBeDefined();
  });
});
