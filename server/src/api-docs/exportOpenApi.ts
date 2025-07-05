import fs from "node:fs";
import path from "node:path";
import { generateOpenAPIDocument } from "./openAPIDocumentGenerator.js";

async function main() {
  try {
    console.log("Generating OpenAPI document...");
    const openAPIDocument = generateOpenAPIDocument();
    const outputPath = path.resolve(process.cwd(), "swagger.json");
    fs.writeFileSync(outputPath, JSON.stringify(openAPIDocument, null, 2));
    console.log("OpenAPI document generated successfully at:", outputPath);
  } catch (error) {
    console.error("Error generating OpenAPI document:", error);
    process.exit(1);
  }
}

main().catch(console.error);
