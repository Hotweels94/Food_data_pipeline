import { connectMongo } from "@/lib/mongo";
import EnrichedProduct from "@/models/EnrichedProduct";
import RawProduct from "@/models/RawProduct";
import fromEurope from "@/utils/fromEurope";
import computeNutriScorePersonalized from "@/utils/computeNutriScorePersonalized";
import { initDb, mongoToSqlite } from "@/lib/initDb";

export async function GET() {
    await connectMongo();
    const rawProducts = await RawProduct.find();
    for (const rawProduct of rawProducts) {
        const payload = rawProduct.payload;
        const nutriscore_grade = payload.nutriscore_grade || "E";
        const nutri_score_personalized = computeNutriScorePersonalized(nutriscore_grade);
        const fromEuropeValue = fromEurope(payload.country);
        const enrichedProduct = new EnrichedProduct({
            raw_product: rawProduct._id,
            raw_product_data: payload,
            nutri_score_personalized: nutri_score_personalized,
            fromEurope: fromEuropeValue,
        });
        await enrichedProduct.save();
    }
    initDb();
    await mongoToSqlite();
    return new Response("Data enrichment completed.");
}

