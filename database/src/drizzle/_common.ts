import { pgSchema, customType, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export function idpk(name: string) {
  return uuid(name)
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull();
}

export const server = pgSchema("server");
