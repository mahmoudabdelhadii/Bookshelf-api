import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { accountLockout } from "./accountLockout.js";

export const accountLockoutRelations = relations(accountLockout, ({ one }) => ({
  user: one(user, {
    fields: [accountLockout.userId],
    references: [user.id],
  }),
}));
