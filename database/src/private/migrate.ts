/* eslint-disable no-console */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Postgrator from "postgrator";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function fmt(migration: Postgrator.Migration) {
  return `${migration.version}: ${migration.name}`;
}

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

  try {
    // Establish a database connection
    await client.connect();

    // Create postgrator instance
    const postgrator = new Postgrator({
      migrationPattern: join(__dirname, "../../migrations/*"),
      driver: "pg",
      schemaTable: "__postgrator_migrations",
      execQuery: (query) => client.query(query),
    });

    const appliedMigrations = await postgrator.migrate();
    if (appliedMigrations.length === 0) {
      console.log("No unapplied migrations were found");
    } else {
      console.log(
        `Applied ${appliedMigrations.length} migrations:\n${appliedMigrations.map(fmt).join("\n")}`,
      );
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  await client.end();
}

await main();
