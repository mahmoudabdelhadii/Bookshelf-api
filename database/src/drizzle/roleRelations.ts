import { relations } from "drizzle-orm";
import { role } from "./role.js";
import { userRole } from "./userRole.js";

export const roleRelations = relations(role, ({ many }) => ({
  userRoles: many(userRole),
}));
