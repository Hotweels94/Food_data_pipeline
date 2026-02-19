import { NextResponse } from "next/server";
import db from "@/lib/initDb.js";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;

  if (!idStr) {
    return NextResponse.json({ error: "ID missing" }, { status: 400 });
  }

  const id = Number.parseInt(idStr, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const stmt = db.prepare(
    `
    SELECT
      p.*,
      b.name AS brand,
      c.name AS category,
      n.score AS nutriscore_score,
      r.label AS from_europe,
      p.image_url AS image_url,
      p.code AS barcode
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN nutriscores n ON p.nutriscore_id = n.id
    LEFT JOIN regions r ON p.region_id = r.id
    WHERE p.id = ?
  `,
  );
  const product = stmt.get(id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}