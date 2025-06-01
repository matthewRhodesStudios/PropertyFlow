import { defineConfig } from "drizzle-kit";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL. Check your .env file.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
