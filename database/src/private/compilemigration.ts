import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import Postgrator from "postgrator";

const __dirname = dirname(fileURLToPath(import.meta.url));

const INCLUDE_START = /^--!include\s+(.*)$/;
const INCLUDE_END = "--!endinclude";

async function main() {
  const [, , ...opts] = process.argv;
  const checking = opts.includes("--check");
  const writing = opts.includes("--write");
  const migrationDir = join(__dirname, "../../migrations");
  const postgrator = new Postgrator({
    migrationPattern: join(migrationDir, "*"),
    driver: "pg",
    database: "kitab",
    schemaTable: "public.__postgrator_migrations",
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const last = (await postgrator.getMigrations()).at(-1)!;
  const source = last.getSql();
  const lines = source.split("\n");
  const output = [];
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    output.push(line);
    const match = INCLUDE_START.exec(line);
    if (match === null) continue;

    const includeContent = await readFile(join(dirname(last.filename), match[1]), "utf-8");

    // An include directive will DELETE EVERYTHING between the start and the next `--!endinclude` line.
    // If there is no end include line before the next include or the end of the file`, then nothing is deleted.
    //
    // This makes it reasonable for includes to replace their own content if you change the content, but it will
    // lead to lost code if you are not careful when editing the migration manually.
    let j = i + 1;
    for (; j < lines.length; ++j) {
      if (INCLUDE_START.test(lines[j])) {
        j = i;
        break;
      }
      if (lines[j] === INCLUDE_END) break;
    }
    if (j === lines.length) j = i;
    output.push(includeContent.trim());
    output.push(INCLUDE_END);
    i = j;
  }

  const compiled = `${output.join("\n").trim()}\n`;
  if (checking) {
    if (compiled !== source) {
      // eslint-disable-next-line no-console
      console.error("Compiled migration does not match its current state.");
      process.exit(1);
    }
  } else if (writing) {
    await writeFile(last.filename, compiled);
  } else {
    process.stdout.write(compiled);
  }
}

await main();
