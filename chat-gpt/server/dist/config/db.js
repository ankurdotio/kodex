"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = __importDefault(require("./env"));
const logger_1 = __importDefault(require("./logger"));
async function connectDb() {
    try {
        // Connect to MongoDB using Mongoose
        await mongoose_1.default.connect(env_1.default.MONGODB_URI);
        // Log a success message if the connection is successful
        logger_1.default.info("Connected to MongoDB");
    }
    catch (error) {
        // Log an error message if the connection fails
        logger_1.default.error({ err: error }, "Failed to connect to MongoDB");
    }
}
