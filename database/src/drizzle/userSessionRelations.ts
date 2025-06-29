import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { userSession } from "./userSession.js";

export const userSessionRelations = relations(userSession, ({ one }) => ({
  user: one(user, {
    fields: [userSession.userId],
    references: [user.id],
  }),
}));
