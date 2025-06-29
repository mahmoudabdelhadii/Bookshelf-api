import { text, timestamp, uuid, real } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";

export const library = server.table("library", {
  id: idpk("id"),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  city: text("city"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  hours: text("hours"),
  image: text("image"),
  rating: real("rating"),
  ownerId: uuid("owner_id").notNull().references(() => user.id),
  location: text("location"), // keeping for backward compatibility
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});
