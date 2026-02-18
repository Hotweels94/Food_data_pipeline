import { NextResponse } from "next/server";
import db from "@/lib/initDb.js";

export async function GET() {
  // total produits
  const stmtTotal = db.prepare(`SELECT COUNT(*) as count FROM products`);
  const totalProducts = stmtTotal.get().count;

  // stats NutriScore
  const stmtNutriScore = db.prepare(`
    SELECT 
        COUNT(*) as count,
        AVG(nutriscore_score) as average_nutri_score
    FROM products
  `);
  const nutriScoreStats = stmtNutriScore.get();

  return NextResponse.json({
    totalProducts,
    averageNutriScore: nutriScoreStats.average_nutri_score,
  });
}

// URL : /api/stats