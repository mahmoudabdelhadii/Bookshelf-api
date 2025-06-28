import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { emailVerificationToken } from "./emailVerificationToken.js";


export const emailVerificationTokenRelations = relations(emailVerificationToken, ({ one }) => ({
  user: one(user, {
    fields: [emailVerificationToken.userId],
    references: [user.id],
  }),
}));
