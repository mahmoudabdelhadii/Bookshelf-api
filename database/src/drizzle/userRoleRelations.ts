import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { role } from "./role.js";
import { userRole } from "./userRole.js";

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, {
    fields: [userRole.userId],
    references: [user.id],
    relationName: "userToRole",
  }),
  role: one(role, {
    fields: [userRole.roleId],
    references: [role.id],
  }),
  assignedByUser: one(user, {
    fields: [userRole.assignedBy],
    references: [user.id],
    relationName: "assignerToRole",
  }),
}));
