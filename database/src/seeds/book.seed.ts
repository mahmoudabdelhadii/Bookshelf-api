import { connect, schema } from "../index.js";
import { seed } from "drizzle-seed";
import { book } from "../drizzle/book.js";

async function main() {
  const { drizzle } = connect("seeder");
  await seed(drizzle, book);

  console.log("✅ Seeded books!");
}

main().catch(console.error);
