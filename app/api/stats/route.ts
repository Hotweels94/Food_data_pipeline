import { NextResponse } from "next/server";
import db from "@/lib/initDb.js";

export async function GET() {
  // total produits
  const stmtTotal = db.prepare(`SELECT COUNT(*) as count FROM products`);
  const totalProductsRow = stmtTotal.get() as { count: number };
  const totalProducts = totalProductsRow.count;

  // stats NutriScore
  const stmtNutriScore = db.prepare(`
    SELECT 
      COUNT(*) as count,
      AVG(n.score) as average_nutri_score
    FROM products p
    LEFT JOIN nutriscores n ON p.nutriscore_id = n.id
    WHERE n.score IS NOT NULL
  `);
  const nutriScoreStats = stmtNutriScore.get() as {
    count: number;
    average_nutri_score: number | null;
  };

  return NextResponse.json({
    totalProducts,
    averageNutriScore: nutriScoreStats.average_nutri_score,
  });
}

// URL : /api/stats