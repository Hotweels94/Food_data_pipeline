import mongoose from "mongoose";

const EnrichedSchema = new mongoose.Schema({
    raw_product: { type: mongoose.Schema.Types.ObjectId, ref: "RawProduct", required: true, unique: true },
    raw_product_data: { type: Object, required: true },
    nutri_score_personalized: { type: Number, required: true },
    fromEurope: { type: String, enum: ["Europe", "Non-Europe"], required: true },
});

export default mongoose.models.EnrichedProduct ||
  mongoose.model("EnrichedProduct", EnrichedSchema);