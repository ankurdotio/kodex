import { app } from "./app/app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

async function bootstrap() {
  await connectDb();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on http://localhost:${env.port}`);
  });
}



bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to bootstrap server", error);
  process.exit(1);
});
