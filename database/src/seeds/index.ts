// seeds/index.ts
import fs from "fs";
import path from "path";
import { connect } from "../drizzle.js"; 
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
async function main() {
  const { drizzle, close } = connect("seeder");
  const seedsDir = __dirname; // 'database/seeds'
  
  // 1. Read all files in 'seeds/' that end with '.seed.ts'
  const seedFiles = fs.readdirSync(seedsDir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts");

  // 2. Run them in alphabetical order or any custom logic
  for (const file of seedFiles.sort()) {
    const fullPath = path.join(seedsDir, file);
    console.log(`🌱 Running seed file: ${file}`);

    // 3. Dynamically import each seed file
    const seedModule = await import(fullPath);

    // 4. Call its "runSeed" function (assuming each seed file exports this)
    if (seedModule.runSeed) {
      await seedModule.runSeed(drizzle);
    } else {
      console.warn(`❗️ File "${file}" has no runSeed() export. Skipping...`);
    }
  }

  // Close the DB pool
  await close();
  console.log("✅ All seeds completed!");
}

main().catch(console.error);