"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app/app");
const db_1 = require("./config/db");
const env_js_1 = __importDefault(require("./config/env.js"));
const logger_js_1 = __importDefault(require("./config/logger.js"));
async function bootstrap() {
    await (0, db_1.connectDb)();
    app_1.app.listen(env_js_1.default.PORT, () => {
        // eslint-disable-next-line no-console
        logger_js_1.default.info(`Server is running on http://localhost:${env_js_1.default.PORT}`);
    });
}
bootstrap().catch((error) => {
    // eslint-disable-next-line no-console
    logger_js_1.default.error({ err: error }, "Failed to bootstrap server");
    process.exit(1);
});
