"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Using zod for better validations 
const zod = __importStar(require("zod"));
const env_constants_1 = __importDefault(require("../constants/env.constants"));
dotenv_1.default.config();
// configured valirables using ZOD for better validation and type safety
const envSchema = zod.object({
    PORT: zod.coerce.number().default(env_constants_1.default.PORT),
    MONGODB_URI: zod.string().default(env_constants_1.default.MONGODB_URI),
    NODE_ENV: zod.string().default(env_constants_1.default.NODE_ENV),
    JWT_ACCESS_SECRET: zod.string(),
    JWT_REFRESH_SECRET: zod.string(),
    ACCESS_TOKEN_TTL: zod.string().default(env_constants_1.default.ACCESS_TOKEN_TTL),
    REFRESH_TOKEN_TTL: zod.string().default(env_constants_1.default.REFRESH_TOKEN_TTL),
    REFRESH_COOKIE_NAME: zod.string().default(env_constants_1.default.REFRESH_COOKIE_NAME),
    MISTRAL_API_KEY: zod.string(),
    BREVO_API_KEY: zod.string().default(""),
    SMTP_HOST: zod.string().default(env_constants_1.default.SMTP_HOST),
    SMTP_PORT: zod.coerce.number().default(env_constants_1.default.SMTP_PORT),
    SMTP_USER: zod.string().default(env_constants_1.default.SMTP_USER),
    SMTP_PASS: zod.string().default(env_constants_1.default.SMTP_PASS),
    MAIL_FROM: zod.string().default(env_constants_1.default.MAIL_FROM),
    SEND_MAIL: zod.preprocess((val) => val === 'true' || val === '1' || val === true, zod.boolean()).default(env_constants_1.default.SEND_MAIL),
    EMAIL_VERIFICATION: zod.preprocess((val) => val === 'true' || val === '1' || val === true, zod.boolean()).default(env_constants_1.default.EMAIL_VERIFICATION),
    LOGGER_LEVEL: zod.string().default(env_constants_1.default.LOGGER_LEVEL),
});
// Parse and validate environment variables
const envParsed = envSchema.safeParse(process.env);
// If validation fails, log the error and exit the process
if (!envParsed.success) {
    console.error("Invalid environment variables:", envParsed.error.format());
    process.exit(1);
}
// Export the validated environment variables as a typed object
exports.env = envParsed.data;
exports.isProduction = exports.env.NODE_ENV === "production";
exports.default = exports.env;
