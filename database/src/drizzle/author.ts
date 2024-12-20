import { text, uniqueIndex, timestamp } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

export const author = server.table(
    "author",
    {
      id: idpk("id"), 
      name: text("name").notNull(), 
      createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
        .defaultNow()
        .notNull(),
    },
    (table) => ({
      authorNameIndex: uniqueIndex("unique_author_name").on(table.name),
    }),
  );