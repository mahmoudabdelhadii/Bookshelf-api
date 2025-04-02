import { text, timestamp } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";

export const library = server.table("library", {
  id: idpk("id"),
  name: text("name").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});