import dotenv from "dotenv";
import type { AppEnv } from "../types/env";
// Using zod for better validations 
import * as zod from "zod";
import envConstants from "../constants/env.constants";

dotenv.config();

// configured valirables using ZOD for better validation and type safety
const envSchema = zod.object({
  PORT: zod.coerce.number().default(envConstants.PORT),
  MONGODB_URI: zod.string().default(envConstants.MONGODB_URI),
  NODE_ENV: zod.string().default(envConstants.NODE_ENV),
  JWT_ACCESS_SECRET: zod.string(),
  JWT_REFRESH_SECRET: zod.string(),
  ACCESS_TOKEN_TTL: zod.string().default(envConstants.ACCESS_TOKEN_TTL),
  REFRESH_TOKEN_TTL: zod.string().default(envConstants.REFRESH_TOKEN_TTL),
  REFRESH_COOKIE_NAME: zod.string().default(envConstants.REFRESH_COOKIE_NAME),
  MISTRAL_API_KEY: zod.string(),
  BREVO_API_KEY: zod.string().default(""),
  SMTP_HOST: zod.string().default(envConstants.SMTP_HOST),
  SMTP_PORT: zod.coerce.number().default(envConstants.SMTP_PORT),
  SMTP_USER: zod.string().default(envConstants.SMTP_USER),
  SMTP_PASS: zod.string().default(envConstants.SMTP_PASS),
  MAIL_FROM: zod.string().default(envConstants.MAIL_FROM),
  SEND_MAIL: zod.preprocess((val) => val === 'true' || val === '1' || val === true, zod.boolean()).default(envConstants.SEND_MAIL),
  EMAIL_VERIFICATION: zod.preprocess((val) => val === 'true' || val === '1' || val === true, zod.boolean()).default(envConstants.EMAIL_VERIFICATION),
  LOGGER_LEVEL: zod.string().default(envConstants.LOGGER_LEVEL),
});

// Parse and validate environment variables
const envParsed = envSchema.safeParse(process.env);

// If validation fails, log the error and exit the process
if (!envParsed.success) {
  console.error("Invalid environment variables:", envParsed.error.format());
  process.exit(1);
}

// Export the validated environment variables as a typed object
export const env: AppEnv = envParsed.data;

export const isProduction = env.NODE_ENV === "production";

export default env;