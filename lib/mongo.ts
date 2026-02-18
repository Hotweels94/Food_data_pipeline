import mongoose from "mongoose";

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(process.env.MONGO_URI!);
}
