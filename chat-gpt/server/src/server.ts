import { app } from "./app/app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function bootstrap() {
  
  connectDb();
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
