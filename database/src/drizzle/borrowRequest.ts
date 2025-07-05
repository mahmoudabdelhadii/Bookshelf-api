import { text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";
import { libraryBooks } from "./libraryBooks.js";

export const borrowRequestStatusEnum = server.enum("borrow_request_status", [
  "pending",
  "approved",
  "rejected",
  "borrowed",
  "returned",
  "overdue",
]);

export const borrowRequest = server.table("borrow_request", {
  id: idpk("id"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict", onUpdate: "cascade" }),
  libraryBookId: uuid("library_book_id")
    .notNull()
    .references(() => libraryBooks.id, { onDelete: "restrict", onUpdate: "cascade" }),
  requestDate: timestamp("request_date", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  approvedDate: timestamp("approved_date", { withTimezone: true, mode: "date" }),
  approvedBy: uuid("approved_by").references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }),
  returnDate: timestamp("return_date", { withTimezone: true, mode: "date" }),
  status: borrowRequestStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});
