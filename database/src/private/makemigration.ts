/* eslint-disable no-console */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import Postgrator from "postgrator";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const [, , name, rest] = process.argv;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (rest !== undefined) {
    console.error("Only one argument is expected");
    process.exit(3);
  }
  if (!name) {
    console.error("A name for the migration is required");
    process.exit(2);
  }

  try {
    const migrationDir = join(__dirname, "../../migrations");
    const postgrator = new Postgrator({
      migrationPattern: join(migrationDir, "*"),
      driver: "pg",
      database: "bookshelf",
      schemaTable: "public.__postgrator_migrations",
    });
    const last = await postgrator.getMaxVersion();
    const file = join(migrationDir, `${last + 1}.do.${name}.sql`);
    await writeFile(file, "-- Empty migration\n");
    console.log(file);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

await main();
