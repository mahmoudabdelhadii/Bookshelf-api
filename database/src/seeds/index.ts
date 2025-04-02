import fs from "fs";
import "dotenv/config";
import path from "path";
import { connect } from "../drizzle.js"; 
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const { drizzle, close } = connect("seeder");
  const seedsDir = __dirname; 
  
try{
    const seedFiles = fs.readdirSync(seedsDir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts");
  
  for (const file of seedFiles) {
    const fullPath = path.join(seedsDir, file);
    console.log(`🌱 Running seed file: ${file}`);

    
    const seedModule = await import(fullPath);

    
    if (seedModule.runSeed) {
      await seedModule.runSeed(drizzle);
    } else {
      console.warn(`❗️ File "${file}" has no runSeed() export. Skipping...`);
    }
  }

}catch(error){
    console.error(error, "seeder failed");
}
finally{
    await close();
    console.log("✅ All seeds completed!");
}
  
  
}

void main();