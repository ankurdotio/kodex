import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.mongoUri);

  console.log("Connected to MongoDB");
  
}
