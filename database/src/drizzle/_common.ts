import { pgSchema, customType, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export function idpk(name: string) {
  return uuid(name)
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull();
}

export const server = pgSchema("server");

function genExpWithWeights(input: string[]) {
  const columnExpressions = input.map((column, index) => {
    const weight = String.fromCharCode(index + 65);
    return `setweight(to_tsvector('english', coalesce(${column}, '')), '${weight}')`;
  });

  const tsvectorColumn = `tsvector GENERATED ALWAYS AS (${columnExpressions.join(" || ")}) STORED`;

  return tsvectorColumn;
}

export const tsvector = customType<{
  data: string;
  config: { sources: string[]; weighted: boolean };
}>({
  dataType(config) {
    if (config) {
      const sources = config.sources.join(" || ' ' || ");
      return config.weighted
        ? genExpWithWeights(config.sources)
        : `tsvector generated always as (to_tsvector('english', ${sources})) stored`;
    } else {
      return `tsvector`;
    }
  },
});
