import fs from "node:fs";
import path from "node:path";
import { pino } from "pino";
import { generateOpenAPIDocument } from "./openAPIDocumentGenerator.js";

async function main() {
  const openAPIDocument = generateOpenAPIDocument();
  const outputPath = path.resolve(process.cwd(), "swagger.json");
  fs.writeFileSync(outputPath, JSON.stringify(openAPIDocument, null, 2));
}

main().catch((err: unknown) => {
  const logger = pino();
  logger.error(err, "Failed to generate OpenAPI document");
  process.exit(1);
});
