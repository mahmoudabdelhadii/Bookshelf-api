/* eslint-disable no-console */
import fs from "node:fs";
import "dotenv/config";
import path, { dirname } from "node:path";
import { connect } from "../drizzle.js";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const { drizzle, close } = connect("seeder");
  const seedsDir = __dirname;

  try {
    const seedFiles = fs.readdirSync(seedsDir).filter((file) => file.endsWith(".ts") && file !== "index.ts");

    for (const file of seedFiles) {
      const fullPath = path.join(seedsDir, file);
      console.log(`🌱 Running seed file: ${file}`);

      type SeedModule = {
        runSeed?: (db: ReturnType<typeof connect>["drizzle"]) => Promise<void>;
      };

      const seedModule = (await import(fullPath)) as SeedModule;
      if (seedModule.runSeed) {
        await seedModule.runSeed(drizzle);
      } else {
        console.warn(`❗️ File "${file}" has no runSeed() export. Skipping...`);
      }
    }
  } catch (err) {
    console.error(err, "seeder failed");
  } finally {
    await close();
    console.log("✅ All seeds completed!");
  }
}

void main();
