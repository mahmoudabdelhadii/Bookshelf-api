import fs from "node:fs";
import path from "node:path";
import { generateOpenAPIDocument } from "./openAPIDocumentGenerator.js";

async function main() {
  try {
    const openAPIDocument = generateOpenAPIDocument();
    const outputPath = path.resolve(process.cwd(), "swagger.json");
    fs.writeFileSync(outputPath, JSON.stringify(openAPIDocument, null, 2));
  } catch (err) {
    process.exit(1);
  }
}

main().catch(console.error);
