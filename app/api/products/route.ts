import db from "@/lib/initDb.js";
import { NextResponse } from "next/server";

const GRADE_TO_SCORE: Record<string, number> = {
  A: 40,
  B: 30,
  C: 20,
  D: 10,
  E: 0,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10),
  );
  const limit = Math.min(
    24,
    Math.max(1, Number.parseInt(searchParams.get("limit") || "12", 10)),
  );
  const offset = (page - 1) * limit;

  const nameQ = searchParams.get("name")?.trim() || "";
  const nutriscoreGrade =
    searchParams.get("nutriscore")?.trim().toUpperCase() || "";
  const fromEurope = searchParams.get("from_europe")?.trim() || "";
  const categoryQ = searchParams.get("category")?.trim() || "";
  const brandQ = searchParams.get("brand")?.trim() || "";

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (nameQ) {
    conditions.push("(p.name LIKE ? OR TRIM(COALESCE(p.name, '')) = '')");
    params.push(`%${nameQ}%`);
  }
  if (nutriscoreGrade && GRADE_TO_SCORE[nutriscoreGrade] !== undefined) {
    conditions.push("n.score = ?");
    params.push(GRADE_TO_SCORE[nutriscoreGrade]);
  }
  if (fromEurope === "Europe" || fromEurope === "Non-Europe") {
    conditions.push("r.label = ?");
    params.push(fromEurope);
  }
  if (categoryQ) {
    conditions.push(
      "(c.name LIKE ? OR TRIM(COALESCE(c.name, '')) = '' OR c.name IS NULL)",
    );
    params.push(`%${categoryQ}%`);
  }
  if (brandQ) {
    conditions.push(
      "(b.name LIKE ? OR TRIM(COALESCE(b.name, '')) = '' OR b.name IS NULL)",
    );
    params.push(`%${brandQ}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const baseFrom = `
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN nutriscores n ON p.nutriscore_id = n.id
    LEFT JOIN regions r ON p.region_id = r.id
  `;

  const countStmt = db.prepare(
    `SELECT COUNT(*) as total ${baseFrom} ${whereClause}`,
  );
  const { total } = countStmt.get(...params) as { total: number };

  const orderBy =
    "ORDER BY (CASE WHEN TRIM(COALESCE(p.name, '')) = '' THEN 1 ELSE 0 END) ASC, p.name ASC";

  const stmt = db.prepare(
    `
    SELECT 
      p.*,
      b.name AS brand,
      c.name AS category,
      n.score AS nutriscore_score,
      r.label AS from_europe
    ${baseFrom}
    ${whereClause}
    ${orderBy}
    LIMIT ? OFFSET ?
  `,
  );
  const products = stmt.all(...params, limit, offset);

  return NextResponse.json({
    page,
    limit,
    total,
    products,
  });
}