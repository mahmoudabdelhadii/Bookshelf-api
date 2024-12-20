import { integer, text, uniqueIndex, timestamp, index } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { sql } from "drizzle-orm";

export const subject = server.table(
  "subject",
  {
    id: idpk("id"),
    name: text("name").notNull(), 
    parent: text("parent"), 
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    subjectNameIndex: uniqueIndex("unique_subject_name").on(table.name),
  }),
);