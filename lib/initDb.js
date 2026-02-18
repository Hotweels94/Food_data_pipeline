import Database from "better-sqlite3";
import mongoose from "mongoose";
import EnrichedProduct from "@/models/EnrichedProduct.ts";

const db = new Database("database/products.db");

export function initDb(database = db) {
  database.exec(`
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

  database.exec(`CREATE INDEX IF NOT EXISTS idx_brand ON products(brand);`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_category ON products(category);`);
  database.exec(
    `CREATE INDEX IF NOT EXISTS idx_score ON products(nutriscore_score);`,
  );

  console.log("✅ SQLite ready");
}

export async function mongoToSqlite() {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO products (
      mongo_id, name, brand, category,
      nutriscore_score, from_europe,
      calories, fat, sugar, salt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = await EnrichedProduct.find({});

  for (const p of products) {
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

  console.log(`✅ ${products.length} produits transférés Mongo → SQLite`);
  await mongoose.disconnect();
}

export default db;
