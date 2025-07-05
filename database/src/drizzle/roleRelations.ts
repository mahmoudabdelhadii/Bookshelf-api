import { relations } from "drizzle-orm";
import { userRoleType } from "./role.js";
import { userRole } from "./userRole.js";

export const userRoleTypeRelations = relations(userRoleType, ({ many }) => ({
  userRoles: many(userRole),
}));
