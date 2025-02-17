import "dotenv/config"; // make sure to install dotenv package
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./src/drizzle",
  schema: "./src/drizzle/[^_]*.ts",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
  breakpoints: false,
  schemaFilter: ["server"],
});
