import db from "@/lib/initDb.js";
import { NextResponse } from "next/server";

// Grade Nutri-Score → score en base (computeNutriScorePersonalized)
const GRADE_TO_SCORE: Record<string, number> = {
  A: 40,
  B: 30,
  C: 20,
  D: 10,
  E: 0,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(24, Math.max(1, Number.parseInt(searchParams.get("limit") || "12", 10)));
  const offset = (page - 1) * limit;

  const nameQ = searchParams.get("name")?.trim() || "";
  const nutriscoreGrade = searchParams.get("nutriscore")?.trim().toUpperCase() || "";
  const fromEurope = searchParams.get("from_europe")?.trim() || "";
  const categoryQ = searchParams.get("category")?.trim() || "";
  const brandQ = searchParams.get("brand")?.trim() || "";

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (nameQ) {
    // Inclure aussi les produits sans nom ou à nom vide/blanc
    conditions.push("(name LIKE ? OR TRIM(COALESCE(name, '')) = '')");
    params.push(`%${nameQ}%`);
  }
  if (nutriscoreGrade && GRADE_TO_SCORE[nutriscoreGrade] !== undefined) {
    conditions.push("nutriscore_score = ?");
    params.push(GRADE_TO_SCORE[nutriscoreGrade]);
  }
  if (fromEurope === "Europe" || fromEurope === "Non-Europe") {
    conditions.push("from_europe = ?");
    params.push(fromEurope);
  }
  if (categoryQ) {
    conditions.push("(category LIKE ? OR TRIM(COALESCE(category, '')) = '')");
    params.push(`%${categoryQ}%`);
  }
  if (brandQ) {
    conditions.push("(brand LIKE ? OR TRIM(COALESCE(brand, '')) = '')");
    params.push(`%${brandQ}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM products ${whereClause}`);
  const { total } = countStmt.get(...params) as { total: number };

  // Produits avec un nom en premier, "Sans nom" / vides à la fin
  const orderBy =
    "ORDER BY (CASE WHEN TRIM(COALESCE(name, '')) = '' THEN 1 ELSE 0 END) ASC, name ASC";
  const stmt = db.prepare(
    `SELECT * FROM products ${whereClause} ${orderBy} LIMIT ? OFFSET ?`
  );
  const products = stmt.all(...params, limit, offset);

  return NextResponse.json({
    page,
    limit,
    total,
    products,
  });
}
