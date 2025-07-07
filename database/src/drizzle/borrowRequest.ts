import { timestamp, pgEnum, uniqueIndex, index, uuid } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";
import { libraryBooks } from "./libraryBooks.js";

export const borrowStatusEnum = pgEnum("borrow_status", ["pending", "approved", "rejected", "returned"]);

export const borrowRequest = server.table(
  "borrow_request",
  {
    id: idpk("id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    libraryBookId: uuid("library_book_id")
      .notNull()
      .references(() => libraryBooks.id, { onDelete: "cascade", onUpdate: "cascade" }),
    requestDate: timestamp("request_date", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }).notNull(),
    returnDate: timestamp("return_date", { withTimezone: true, mode: "date" }),
    status: borrowStatusEnum("status").default("pending").notNull(),
    approvedBy: uuid("approved_by").references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
    rejectedBy: uuid("rejected_by").references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
    returnedBy: uuid("returned_by").references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_borrow_request").on(table.userId, table.libraryBookId),
    index("idx_borrow_request_user_id").on(table.userId),
    index("idx_borrow_request_library_book_id").on(table.libraryBookId),
    index("idx_borrow_request_status").on(table.status),
  ],
);
