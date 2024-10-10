import "dotenv/config"; // make sure to install dotenv package
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./src/drizzle",
  schema: "./src/drizzle/schema.ts",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
  breakpoints: false,
  schemaFilter: [
    "gateway",
    "memory",
    "items",
    "slackbot",
    "flirt",
    "basic_mine",
    "summarizer",
    "recipe_craft",
    "npc",
  ],
});
