import pino from "pino";
import type { Logger } from "pino";
import env from "./env.js";

const loggerOptions = env.NODE_ENV === "production"
    ? { level: env.LOGGER_LEVEL }
    : {
        level: env.LOGGER_LEVEL,
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
            },
        },
    };

const logger: Logger = pino(loggerOptions);

export default logger;