import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import crypto from "crypto";
import RawProduct from "@/models/RawProduct";
import { fetchOpenFoodFacts } from "@/services/openFood";

export async function GET(request: Request) {
  await connectMongo();

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 2);
  const limit = Number(searchParams.get("limit") ?? 100);

  try {
    const products = await fetchOpenFoodFacts(page, limit);

    let inserted = 0;
    

    for (const product of products) {
        const hash = crypto
          .createHash("sha1")
          .update(JSON.stringify(product))
          .digest("hex");

      await RawProduct.create({
        source: "openfoodfacts",
        fetched_at: new Date(),
        raw_hash: hash,
        payload: product
      });
      inserted++;
    }

    return NextResponse.json({
      status: "success",
      page,
      inserted
    });
  } catch (error: unknown) {
    console.error(error);

    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}