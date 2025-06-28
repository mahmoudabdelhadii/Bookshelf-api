import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { passwordResetToken } from "./passwordResetToken.js";


export const passwordResetTokenRelations = relations(passwordResetToken, ({ one }) => ({
  user: one(user, {
    fields: [passwordResetToken.userId],
    references: [user.id],
  }),
}));
