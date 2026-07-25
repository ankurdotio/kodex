import { app } from "./app/app";
import { connectDb } from "./config/db";
import env from "./config/env.js";
import logger from "./config/logger.js"

async function bootstrap() {
  await connectDb();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    logger.info(`Server is running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  logger.error( {err: error} ,"Failed to bootstrap server");
  process.exit(1);
});
