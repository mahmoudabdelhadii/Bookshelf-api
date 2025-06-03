import fs from "node:fs";
import path from "node:path";
import { generateOpenAPIDocument } from "./openAPIDocumentGenerator.js";

function main() {
  const openAPIDocument = generateOpenAPIDocument();
  const outputPath = path.resolve(process.cwd(), "swagger.json");
  fs.writeFileSync(outputPath, JSON.stringify(openAPIDocument, null, 2));
  console.log(`Generated OpenAPI document at ${outputPath}`);
}

main();
