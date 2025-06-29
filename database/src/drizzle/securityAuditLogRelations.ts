import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { securityAuditLog } from "./securityAuditLog.js";

export const securityAuditLogRelations = relations(securityAuditLog, ({ one }) => ({
  user: one(user, {
    fields: [securityAuditLog.userId],
    references: [user.id],
  }),
}));
