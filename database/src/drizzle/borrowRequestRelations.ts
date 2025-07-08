import { relations } from "drizzle-orm";
import { borrowRequest } from "./borrowRequest.js";
import { user } from "./user.js";
import { libraryBooks } from "./libraryBooks.js";

export const borrowRequestRelations = relations(borrowRequest, ({ one }) => ({
  user: one(user, {
    fields: [borrowRequest.userId],
    references: [user.id],
  }),
  libraryBook: one(libraryBooks, {
    fields: [borrowRequest.libraryBookId],
    references: [libraryBooks.id],
  }),
  approver: one(user, {
    fields: [borrowRequest.approvedBy],
    references: [user.id],
    relationName: "approvedBorrowRequests",
  }),
  rejecter: one(user, {
    fields: [borrowRequest.rejectedBy],
    references: [user.id],
    relationName: "rejectedBorrowRequests",
  }),
  returner: one(user, {
    fields: [borrowRequest.returnedBy],
    references: [user.id],
    relationName: "returnedBorrowRequests",
  }),
}));
