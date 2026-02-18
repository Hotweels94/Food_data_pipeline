import { NextResponse } from "next/server";
import db from "@/lib/initDb.js";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;

  if (!idStr) {
    return NextResponse.json({ error: "ID missing" }, { status: 400 });
  }

  const id = parseInt(idStr);
  const stmt = db.prepare(`SELECT * FROM products WHERE id = ?`);
  const product = stmt.get(id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// URL : /api/products/:id