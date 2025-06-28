import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { userAuth } from "./userAuth.js";


export const userAuthRelations = relations(userAuth, ({ one }) => ({
  user: one(user, {
    fields: [userAuth.userId],
    references: [user.id],
  }),
}));
