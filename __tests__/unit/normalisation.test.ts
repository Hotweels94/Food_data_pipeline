import Database from "better-sqlite3";
import EnrichedProduct from "@/models/EnrichedProduct";
import { initDb } from "@/lib/initDb";

// Mock de mongoose
jest.mock("mongoose", () => ({
  connection: {
    readyState: 0,
  },
  disconnect: jest.fn(),
  models: {},
  model: jest.fn(),
}));

// Mock d'EnrichedProduct
jest.mock("@/models/EnrichedProduct", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

describe("Normalisation - mongoToSqlite", () => {
  let testDb: Database.Database;
  const dbPath = ":memory:";

  beforeEach(() => {
    testDb = new Database(dbPath);
    
    initDb(testDb);
  });

  afterEach(() => {
    testDb.close();
    jest.clearAllMocks();
  });

  it("devrait normaliser correctement les données MongoDB vers SQLite", async () => {
    const mockEnrichedProducts = [
      {
        _id: { toString: () => "mongo_id_1" },
        raw_product_data: {
          product_name: "Test Product 1",
          brands: "Test Brand",
          categories: "Test Category",
          nutriments: {
            energy: 100,
            fat: 5.5,
            sugars: 10.2,
            salt: 0.5,
          },
        },
        nutri_score_personalized: 40,
        fromEurope: "Europe",
      },
      {
        _id: { toString: () => "mongo_id_2" },
        raw_product_data: {
          product_name: "Test Product 2",
          brands: "Another Brand",
          categories: "Another Category",
          nutriments: {
            energy: 200,
            fat: null,
            sugars: null,
            salt: null,
          },
        },
        nutri_score_personalized: 20,
        fromEurope: "Non-Europe",
      },
    ];

    (EnrichedProduct.find as jest.Mock).mockResolvedValue(mockEnrichedProducts);

    const stmt = testDb.prepare(`
      INSERT OR IGNORE INTO products (
        mongo_id, name, brand, category,
        nutriscore_score, from_europe,
        calories, fat, sugar, salt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of mockEnrichedProducts) {
      const data = p.raw_product_data || {};
      const nutriments = data.nutriments || {};

      stmt.run(
        p._id.toString(),
        data.product_name || "",
        data.brands || "",
        data.categories || "",
        p.nutri_score_personalized || 0,
        p.fromEurope,
        nutriments.energy || null,
        nutriments.fat || null,
        nutriments.sugars || null,
        nutriments.salt || null,
      );
    }

    const selectStmt = testDb.prepare("SELECT * FROM products");
    const products = selectStmt.all();

    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({
      mongo_id: "mongo_id_1",
      name: "Test Product 1",
      brand: "Test Brand",
      category: "Test Category",
      nutriscore_score: 40,
      from_europe: "Europe",
      calories: 100,
      fat: 5.5,
      sugar: 10.2,
      salt: 0.5,
    });

    expect(products[1]).toMatchObject({
      mongo_id: "mongo_id_2",
      name: "Test Product 2",
      brand: "Another Brand",
      category: "Another Category",
      nutriscore_score: 20,
      from_europe: "Non-Europe",
      calories: 200,
    });
  });

  it("devrait gérer les valeurs nulles correctement", async () => {
    const mockEnrichedProduct = {
      _id: { toString: () => "mongo_id_null" },
      raw_product_data: {
        product_name: "",
        brands: "",
        categories: "",
        nutriments: {
          energy: null,
          fat: null,
          sugars: null,
          salt: null,
        },
      },
      nutri_score_personalized: 0,
      fromEurope: "Non-Europe",
    };

    const stmt = testDb.prepare(`
      INSERT OR IGNORE INTO products (
        mongo_id, name, brand, category,
        nutriscore_score, from_europe,
        calories, fat, sugar, salt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const data = mockEnrichedProduct.raw_product_data || {};
    const nutriments = data.nutriments || {};

    stmt.run(
      mockEnrichedProduct._id.toString(),
      data.product_name || "",
      data.brands || "",
      data.categories || "",
      mockEnrichedProduct.nutri_score_personalized || 0,
      mockEnrichedProduct.fromEurope,
      nutriments.energy,
      nutriments.fat,
      nutriments.sugars,
      nutriments.salt,
    );

    const selectStmt = testDb.prepare("SELECT * FROM products WHERE mongo_id = ?");
    const product = selectStmt.get("mongo_id_null") as any;

    expect(product).toBeDefined();
    expect(product.name).toBe("");
    expect(product.brand).toBe("");
    expect(product.category).toBe("");
    expect(product.calories).toBeNull();
    expect(product.fat).toBeNull();
    expect(product.sugar).toBeNull();
    expect(product.salt).toBeNull();
  });

  it("devrait utiliser des valeurs par défaut pour les champs manquants", async () => {
    const mockEnrichedProduct = {
      _id: { toString: () => "mongo_id_default" },
      raw_product_data: {
        product_name: "",
        brands: "",
        categories: "",
        nutriments: {
          energy: null,
          fat: null,
          sugars: null,
          salt: null,
        },
      },
      nutri_score_personalized: 0,
      fromEurope: "Non-Europe",
    };

    const stmt = testDb.prepare(`
      INSERT OR IGNORE INTO products (
        mongo_id, name, brand, category,
        nutriscore_score, from_europe,
        calories, fat, sugar, salt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const data = mockEnrichedProduct.raw_product_data || {};
    const nutriments = data.nutriments || {};

    stmt.run(
      mockEnrichedProduct._id.toString(),
      data.product_name || "",
      data.brands || "",
      data.categories || "",
      mockEnrichedProduct.nutri_score_personalized || 0,
      mockEnrichedProduct.fromEurope,
      nutriments.energy,
      nutriments.fat,
      nutriments.sugars,
      nutriments.salt,
    );

    const selectStmt = testDb.prepare("SELECT * FROM products WHERE mongo_id = ?");
    const product = selectStmt.get("mongo_id_default") as any;

    expect(product).toBeDefined();
    expect(product.name).toBe("");
    expect(product.brand).toBe("");
    expect(product.category).toBe("");
    expect(product.nutriscore_score).toBe(0);
  });
});

describe("Normalisation - initDb", () => {
  it("devrait créer la table products avec les bonnes colonnes", () => {
    const testDb = new Database(":memory:");
    
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

    const tableInfo = testDb.prepare("PRAGMA table_info(products)").all();
    expect(tableInfo.length).toBeGreaterThan(0);

    const columns = tableInfo.map((col: any) => col.name);
    expect(columns).toContain("id");
    expect(columns).toContain("mongo_id");
    expect(columns).toContain("name");
    expect(columns).toContain("brand");
    expect(columns).toContain("category");
    expect(columns).toContain("nutriscore_score");
    expect(columns).toContain("from_europe");
    expect(columns).toContain("calories");
    expect(columns).toContain("fat");
    expect(columns).toContain("sugar");
    expect(columns).toContain("salt");

    testDb.close();
  });
});
