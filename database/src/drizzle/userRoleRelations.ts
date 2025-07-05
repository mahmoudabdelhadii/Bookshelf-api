import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { userRoleType } from "./role.js";
import { userRole } from "./userRole.js";

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, {
    fields: [userRole.userId],
    references: [user.id],
    relationName: "userToRole",
  }),
  role: one(userRoleType, {
    fields: [userRole.roleId],
    references: [userRoleType.id],
  }),
  assignedByUser: one(user, {
    fields: [userRole.assignedBy],
    references: [user.id],
    relationName: "assignerToRole",
  }),
}));
