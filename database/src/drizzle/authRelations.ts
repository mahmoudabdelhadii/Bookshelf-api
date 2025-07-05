export { userAuthRelations } from "./userAuthRelations.js";
export { userSessionRelations } from "./userSessionRelations.js";
export { passwordResetTokenRelations } from "./passwordResetTokenRelations.js";
export { emailVerificationTokenRelations } from "./emailVerificationTokenRelations.js";
export { userRoleRelations } from "./userRoleRelations.js";
export { userRoleTypeRelations } from "./roleRelations.js";
export { securityAuditLogRelations } from "./securityAuditLogRelations.js";
export { accountLockoutRelations } from "./accountLockoutRelations.js";
export { oauthProfileRelations } from "./oauthProfileRelations.js";

import { relations } from "drizzle-orm";
import { user } from "./user.js";
import { userAuth } from "./userAuth.js";
import { userSession } from "./userSession.js";
import { passwordResetToken } from "./passwordResetToken.js";
import { emailVerificationToken } from "./emailVerificationToken.js";
import { userRole } from "./userRole.js";
import { securityAuditLog } from "./securityAuditLog.js";
import { accountLockout } from "./accountLockout.js";
import { oauthProfile } from "./oauthProfile.js";

export const userRelations = relations(user, ({ one, many }) => ({
  userAuth: one(userAuth, {
    fields: [user.id],
    references: [userAuth.userId],
  }),
  sessions: many(userSession),
  passwordResetTokens: many(passwordResetToken),
  emailVerificationTokens: many(emailVerificationToken),
  userRoles: many(userRole, {
    relationName: "userToRole",
  }),
  assignedRoles: many(userRole, {
    relationName: "assignerToRole",
  }),
  auditLogs: many(securityAuditLog),
  accountLockouts: many(accountLockout),
  oauthProfiles: many(oauthProfile),
}));
