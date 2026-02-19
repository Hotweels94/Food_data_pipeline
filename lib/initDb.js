import Database from "better-sqlite3";
import mongoose from "mongoose";
import EnrichedProduct from "@/models/EnrichedProduct.ts";

const db = new Database("database/products.db");

export function initDb(database = db) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nutriscores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      score INTEGER UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mongo_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      image_url TEXT,

      brand_id INTEGER,
      category_id INTEGER,
      nutriscore_id INTEGER,
      region_id INTEGER,

      calories INTEGER,
      fat REAL,
      sugar REAL,
      salt REAL,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (nutriscore_id) REFERENCES nutriscores(id),
      FOREIGN KEY (region_id) REFERENCES regions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
    CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_nutriscore_id ON products(nutriscore_id);
    CREATE INDEX IF NOT EXISTS idx_products_region_id ON products(region_id);
  `);

  console.log("✅ SQLite ready");
}

export async function mongoToSqlite() {
  db.exec(`
    DELETE FROM products;
    DELETE FROM brands;
    DELETE FROM categories;
    DELETE FROM nutriscores;
    DELETE FROM regions;
  `);

  function computeHighLevelCategory(rawCategories, productName) {
    const text = `${rawCategories || ""} ${productName || ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (
      text.includes("boisson") ||
      text.includes("drink") ||
      text.includes("jus") ||
      text.includes("soda") ||
      text.includes("limonade") ||
      text.includes("the") ||
      text.includes("tea") ||
      text.includes("cafe") ||
      text.includes("coffee")
    ) {
      return "Boisson";
    }

    if (
      text.includes("viande") ||
      text.includes("charcuterie") ||
      text.includes("meat") ||
      text.includes("jambon") ||
      text.includes("saucisse") ||
      text.includes("poulet") ||
      text.includes("boeuf") ||
      text.includes("porc") ||
      text.includes("chicken") ||
      text.includes("beef") ||
      text.includes("pork") ||
      text.includes("ham") ||
      text.includes("sausage") ||
      text.includes("turkey")
    ) {
      return "Viande";
    }

    if (
      text.includes("fruit") ||
      text.includes("legume") ||
      text.includes("vegetable") ||
      text.includes("salade") ||
      text.includes("salad") ||
      text.includes("compote")
    ) {
      return "Fruit et légumes";
    }

    if (
      text.includes("snack") ||
      text.includes("biscuit") ||
      text.includes("biscotte") ||
      text.includes("chips") ||
      text.includes("gateau") ||
      text.includes("gaufre") ||
      text.includes("barre") ||
      text.includes("cracker") ||
      text.includes("cereal") ||
      text.includes("petit dejeuner") ||
      text.includes("petit-dejeuner") ||
      text.includes("chocolat") ||
      text.includes("chocolate")
    ) {
      return "Snacks";
    }

    if (
      text.includes("poisson") ||
      text.includes("poireaux") ||
      text.includes("crevettes") ||
      text.includes("crustacés") ||
      text.includes("crustacea") ||
      text.includes("crustaceans") ||
      text.includes("crab") ||
      text.includes("shrimp") ||
      text.includes("lobster") ||
      text.includes("crayfish") ||
      text.includes("salmon") ||
      text.includes("trout") ||
      text.includes("salmon") ||
      text.includes("trout")
    ) {
      return "Poisson et crustacé";
    }

    return "Pas de catégories";
  }

  const insertBrand = db.prepare(`
    INSERT INTO brands (name) VALUES (?)
    ON CONFLICT(name) DO NOTHING
  `);
  const selectBrandId = db.prepare(`SELECT id FROM brands WHERE name = ?`);

  const insertCategory = db.prepare(`
    INSERT INTO categories (name) VALUES (?)
    ON CONFLICT(name) DO NOTHING
  `);
  const selectCategoryId = db.prepare(
    `SELECT id FROM categories WHERE name = ?`,
  );

  const insertNutriscore = db.prepare(`
    INSERT INTO nutriscores (score) VALUES (?)
    ON CONFLICT(score) DO NOTHING
  `);
  const selectNutriscoreId = db.prepare(
    `SELECT id FROM nutriscores WHERE score = ?`,
  );

  const insertRegion = db.prepare(`
    INSERT INTO regions (label) VALUES (?)
    ON CONFLICT(label) DO NOTHING
  `);
  const selectRegionId = db.prepare(`SELECT id FROM regions WHERE label = ?`);

  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (
      mongo_id, name, code, image_url,
      brand_id, category_id, nutriscore_id, region_id,
      calories, fat, sugar, salt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = await EnrichedProduct.find({});

  const tx = db.transaction((items) => {
    for (const p of items) {
      const data = p.raw_product_data || {};
      const nutriments = data.nutriments || {};

      const name = data.product_name || "";

      const codeValue = (data.code || "").toString().trim() || null;
      const imageUrl = (data.image_url || "").toString().trim() || null;
      const brandName = (data.brands || "").trim() || null;
      const categoryLabel = computeHighLevelCategory(
        data.categories || "",
        name,
      );
      const score = Number.isFinite(p.nutri_score_personalized)
        ? p.nutri_score_personalized
        : 0;
      const regionLabel = (p.fromEurope || "").trim() || null;

      let brandId = null;
      if (brandName) {
        insertBrand.run(brandName);
        brandId = selectBrandId.get(brandName)?.id ?? null;
      }

      let categoryId = null;
      insertCategory.run(categoryLabel);
      categoryId = selectCategoryId.get(categoryLabel)?.id ?? null;

      insertNutriscore.run(score);
      const nutriscoreId = selectNutriscoreId.get(score)?.id ?? null;

      let regionId = null;
      if (regionLabel) {
        insertRegion.run(regionLabel);
        regionId = selectRegionId.get(regionLabel)?.id ?? null;
      }

      insertProduct.run(
        p._id.toString(),
        name,
        codeValue,
        imageUrl,
        brandId,
        categoryId,
        nutriscoreId,
        regionId,
        nutriments.energy ?? null,
        nutriments.fat ?? null,
        nutriments.sugars ?? null,
        nutriments.salt ?? null,
      );
    }
  });

  tx(products);

  console.log(`✅ ${products.length} produits transférés Mongo → SQLite`);
  await mongoose.disconnect();
}

export default db;
