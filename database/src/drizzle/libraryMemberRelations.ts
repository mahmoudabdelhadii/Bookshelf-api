import { relations } from "drizzle-orm";
import { libraryMember } from "./libraryMember.js";
import { user } from "./user.js";
import { library } from "./library.js";

export const libraryMemberRelations = relations(libraryMember, ({ one }) => ({
  user: one(user, {
    fields: [libraryMember.userId],
    references: [user.id],
  }),
  library: one(library, {
    fields: [libraryMember.libraryId],
    references: [library.id],
  }),
  inviter: one(user, {
    fields: [libraryMember.invitedBy],
    references: [user.id],
  }),
}));