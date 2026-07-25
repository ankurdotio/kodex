import mongoose from "mongoose";
import env from "./env";
import logger from "./logger";

export async function connectDb(): Promise<void> {

  try {

    // Connect to MongoDB using Mongoose
    await mongoose.connect(env.MONGODB_URI);

    // Log a success message if the connection is successful
    logger.info("Connected to MongoDB");

  } catch (error) {

    // Log an error message if the connection fails
    logger.error( {err: error} ,"Failed to connect to MongoDB");

  }
  
}
