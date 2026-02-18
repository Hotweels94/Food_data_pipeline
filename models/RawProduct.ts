import mongoose from "mongoose";

const RawSchema = new mongoose.Schema({
  source: { type: String, required: true },
  fetched_at: { type: Date, required: true },
  raw_hash: { type: String, required: true, unique: true },
  payload: { type: Object, required: true }
});

export default mongoose.models.RawProduct ||
  mongoose.model("RawProduct", RawSchema);
