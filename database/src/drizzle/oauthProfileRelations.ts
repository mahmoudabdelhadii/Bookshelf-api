import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { oauthProfile } from "./oauthProfile.js";

export const oauthProfileRelations = relations(oauthProfile, ({ one }) => ({
  user: one(user, {
    fields: [oauthProfile.userId],
    references: [user.id],
  }),
}));
