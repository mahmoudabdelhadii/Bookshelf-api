import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfileType,
  VerifyCallback as VerifyCallbackGoogle,
} from "passport-google-oauth20";
import {
  Strategy as AppleStrategy,
  Profile as AppleProfileType,
  VerifyCallback as VerifyCallbackApple,
} from "passport-apple";
import type { DrizzleClient } from "database";
import { eq, schema } from "database";
import { env } from "../utils/envConfig.js";
import { generateSecurePassword, hashPassword } from "../utils/password.js";
import { emailService } from "../services/email.js";
import { logger } from "../../server.js";
export interface GoogleProfile {
  id: string;
  provider: "google";
  emails: { value: string; verified: boolean }[];
  name: {
    givenName: string;
    familyName: string;
  };
  photos: { value: string }[];
}

export interface AppleProfile {
  id: string;
  provider: "apple";
  email?: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface OAuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  isSuspended: boolean;
  provider: "google" | "apple";
  providerId: string;
  avatar?: string;
}

export function configureOAuthStrategies(drizzle: DrizzleClient) {
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL,
          scope: ["profile", "email"],
          passReqToCallback: false,
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: GoogleProfileType,
          done: VerifyCallbackGoogle,
        ): Promise<void> => {
          try {
            const email = profile.emails?.[0]?.value;

            if (!email) {
              done(new Error("No email provided by Google"), false);
              return;
            }

            let user = await findUserByEmail(drizzle, email);

            if (user) {
              await updateUserOAuthInfo(drizzle, user.id, {
                provider: "google",
                providerId: profile.id,
                avatar: profile.photos?.[0]?.value,
              });
            } else {
              await createOAuthUser(drizzle, {
                email,
                firstName: profile.name?.givenName ?? "User",
                lastName: profile.name?.familyName ?? "",
                provider: "google",
                providerId: profile.id,
                avatar: profile.photos?.[0]?.value,
                accessToken,
                refreshToken,
              });

              user = await findUserByEmail(drizzle, email);
            }

            if (!user) {
              done(new Error("Failed to create or find user"), false);
              return;
            }

            const authUser = await buildAuthUser(drizzle, user, "google", profile.id);
            done(null, authUser);
          } catch (err) {
            done(err as Error, false);
          }
        },
      ),
    );
  }

  if (env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY) {
    passport.use(
      new AppleStrategy(
        {
          clientID: env.APPLE_CLIENT_ID,
          teamID: env.APPLE_TEAM_ID,
          keyID: env.APPLE_KEY_ID,
          privateKeyString: env.APPLE_PRIVATE_KEY,
          callbackURL: env.APPLE_CALLBACK_URL,
          scope: ["email", "name", "profile"],
          passReqToCallback: false,
        },
        async (
          accessToken: string,
          refreshToken: string,
          idToken: string,
          profile: AppleProfileType,
          done: VerifyCallbackApple,
        ): Promise<void> => {
          try {
            const email = profile.email as string;

            if (!email) {
              done(new Error("No email provided by Apple")); return;
            }

            let user = await findUserByEmail(drizzle, email);

            if (user) {
              await updateUserOAuthInfo(drizzle, user.id, {
                provider: "apple",
                providerId: profile.id as string,
              });
            } else {
              await createOAuthUser(drizzle, {
                email,
                firstName: (profile.name?.firstName as string) ?? "User",
                lastName: (profile.name?.lastName as string) ?? "",
                provider: "apple",
                providerId: profile.id as string,
                idToken,
                accessToken,
                refreshToken,
              });
              user = await findUserByEmail(drizzle, email as string);
            }

            if (!user) {
              done(new Error("Failed to create or find user")); return;
            }

            const authUser = await buildAuthUser(drizzle, user, "apple", profile.id as string);
            done(null, authUser); 
          } catch (err) {
            done(err instanceof Error ? err : new Error("Unhandled error")); 
          }
        },
      ),
    );
  }

  return passport;
}

async function findUserByEmail(drizzle: DrizzleClient, email: string) {
  return await drizzle.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, email),
    with: {
      userAuth: true,
      userRoles: {
        with: {
          role: true,
        },
      },
    },
  });
}

async function createOAuthUser(
  drizzle: DrizzleClient,
  data: {
    email: string;
    firstName: string;
    lastName: string;
    provider: "google" | "apple";
    providerId: string;
    avatar?: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  },
) {
  return await drizzle.transaction(async (tx) => {
    const username = generateUsernameFromEmail(data.email);

    const randomPassword = generateSecurePassword(32);
    const passwordHash = await hashPassword(randomPassword);

    const [newUser] = await tx
      .insert(schema.user)
      .values({
        username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "user",
      })
      .returning();

    await tx.insert(schema.userAuth).values({
      userId: newUser.id,
      passwordHash,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      isSuspended: false,
      failedLoginAttempts: 0,
    });

    await tx.insert(schema.oauthProfile).values({
      userId: newUser.id,
      provider: data.provider,
      providerId: data.providerId,
      email: data.email,
      profileData: JSON.stringify({
        avatar: data.avatar,
        verifiedEmail: true,
      }),
    });

    const readerRole = await tx.query.role.findFirst({
      where: (role, { eq }) => eq(role.name, "Reader"),
    });

    if (readerRole) {
      await tx.insert(schema.userRole).values({
        userId: newUser.id,
        roleId: readerRole.id,
      });
    }

    emailService
      .sendWelcomeEmail({
        email: data.email,
        firstName: data.firstName,
        username,
        loginUrl: `${env.FRONTEND_URL}/login`,
      })
      .catch((err: unknown) => {
        logger.error(err, "Failed to send welcome email");
      });

    await tx.insert(schema.securityAuditLog).values({
      userId: newUser.id,
      action: `oauth_registration_${data.provider}`,
      details: JSON.stringify({
        email: data.email,
        provider: data.provider,
        providerId: data.providerId,
      }),
      severity: "info",
    });

    return newUser;
  });
}

async function updateUserOAuthInfo(
  drizzle: DrizzleClient,
  userId: string,
  data: {
    provider: "google" | "apple";
    providerId: string;
    avatar?: string;
  },
) {
  await drizzle.transaction(async (tx) => {
    const existingProfile = await tx.query.oauthProfile.findFirst({
      where: (profile, { eq, and }) => and(eq(profile.userId, userId), eq(profile.provider, data.provider)),
    });
    if (existingProfile) {
      await tx
        .update(schema.oauthProfile)
        .set({
          providerId: data.providerId,
          profileData: JSON.stringify({
            avatar: data.avatar,
            lastLogin: new Date().toISOString(),
          }),
          updatedAt: new Date(),
        })
        .where(eq(schema.oauthProfile.id, existingProfile.id));
    } else {
      const user = await tx.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, userId),
      });
      if (!user) throw new TypeError("user not found");
      await tx.insert(schema.oauthProfile).values({
        userId,
        provider: data.provider,
        providerId: data.providerId,
        email: user.email,
        profileData: JSON.stringify({
          avatar: data.avatar,
          linkedAt: new Date().toISOString(),
        }),
      });
    }

    await tx
      .update(schema.userAuth)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(schema.userAuth.userId, userId));
  });
}

async function buildAuthUser(
  drizzle: DrizzleClient,
  user: typeof schema.user.$inferSelect & {
    userAuth: typeof schema.userAuth.$inferSelect;
    userRoles: (typeof schema.userRole.$inferSelect & {
      role: typeof schema.role.$inferSelect;
    })[];
  },
  provider: "google" | "apple",
  providerId: string,
): Promise<OAuthUser> {
  const permissions = user.userRoles.flatMap((ur) => ur.role.permissions ?? []);

  await drizzle.insert(schema.securityAuditLog).values({
    userId: user.id,
    action: `oauth_login_${provider}`,
    details: JSON.stringify({
      provider,
      providerId,
      email: user.email,
    }),
    severity: "info",
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    permissions,
    isActive: user.userAuth.isActive,
    isEmailVerified: user.userAuth.isEmailVerified,
    isSuspended: user.userAuth.isSuspended,
    provider,
    providerId,
  };
}

function generateUsernameFromEmail(email: string): string {
  const baseUsername = email.split("@")[0].toLowerCase();

  const cleanUsername = baseUsername.replace(/[^a-z0-9]/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${cleanUsername}_${randomSuffix}`;
}

interface OAuthData {
  provider: "google" | "apple";
  providerId: string;
  email: string;
  profileData: Record<string, unknown>;
}

export class OAuthService {
  static async linkOAuthAccount(
    drizzle: DrizzleClient,
    userId: string,
    oauthData: OAuthData,
  ) {
    const existingLink = await drizzle.query.oauthProfile.findFirst({
      where: (profile, { eq, and }) =>
        and(eq(profile.provider, oauthData.provider), eq(profile.providerId, oauthData.providerId)),
    });

    if (existingLink && existingLink.userId !== userId) {
      throw new Error("This OAuth account is already linked to another user");
    }

    if (existingLink) {
      await drizzle
        .update(schema.oauthProfile)
        .set({
          email: oauthData.email,
          profileData: JSON.stringify(oauthData.profileData),
          updatedAt: new Date(),
        })
        .where(eq(schema.oauthProfile.id, existingLink.id));
    } else {
      await drizzle.insert(schema.oauthProfile).values({
        userId,
        provider: oauthData.provider,
        providerId: oauthData.providerId,
        email: oauthData.email,
        profileData: JSON.stringify(oauthData.profileData),
      });
    }

    await drizzle.insert(schema.securityAuditLog).values({
      userId,
      action: `oauth_account_linked_${oauthData.provider}`,
      details: JSON.stringify({
        provider: oauthData.provider,
        email: oauthData.email,
      }),
      severity: "info",
    });

    return true;
  }

  static async unlinkOAuthAccount(drizzle: DrizzleClient, userId: string, provider: "google" | "apple") {
    const profile = await drizzle.query.oauthProfile.findFirst({
      where: (p, { eq, and }) => and(eq(p.userId, userId), eq(p.provider, provider)),
    });

    if (!profile) {
      throw new Error("OAuth account not found");
    }

    await drizzle.delete(schema.oauthProfile).where(eq(schema.oauthProfile.id, profile.id));

    await drizzle.insert(schema.securityAuditLog).values({
      userId,
      action: `oauth_account_unlinked_${provider}`,
      details: JSON.stringify({
        provider,
        email: profile.email,
      }),
      severity: "warning",
    });

    return true;
  }

  static async getUserOAuthAccounts(drizzle: DrizzleClient, userId: string) {
    return await drizzle.query.oauthProfile.findMany({
      where: (profile, { eq }) => eq(profile.userId, userId),
      columns: {
        id: true,
        provider: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
