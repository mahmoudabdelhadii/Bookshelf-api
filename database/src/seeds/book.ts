// seeds/book.seed.ts
import { seed } from "drizzle-seed";
import { book } from "../drizzle/book.js";
import { DrizzleClient } from "../drizzle.js";

export async function runSeed(drizzle: DrizzleClient) {
  
  await seed(drizzle, { books: book });
  console.log("✅ Seeded books!");
}