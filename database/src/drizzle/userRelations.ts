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
import { borrowRequest } from "./borrowRequest.js";
import { libraryMember } from "./libraryMember.js";

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
  assignedUserRoles: many(userRole, {
    relationName: "assignerToRole",
  }),
  auditLogs: many(securityAuditLog),
  accountLockouts: many(accountLockout),
  oauthProfiles: many(oauthProfile),
  borrowRequests: many(borrowRequest),
  libraryMemberships: many(libraryMember),
}));
