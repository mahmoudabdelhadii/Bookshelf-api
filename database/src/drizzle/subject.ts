import { integer, text, uniqueIndex, timestamp, index, AnyPgColumn, uuid } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

export const subject = server.table(
  "subject",
  {
    id: idpk("id"),
    name: text("name").notNull(),
    parent: uuid("parent").references((): AnyPgColumn => subject.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    subjectNameIndex: uniqueIndex("unique_subject_name").on(table.name),
  }),
);
