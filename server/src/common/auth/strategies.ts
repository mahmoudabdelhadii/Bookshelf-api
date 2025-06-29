import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import type { DrizzleClient } from "database";
import { schema, eq } from "database";
import { env } from "../utils/envConfig.js";
import { verifyPassword } from "../utils/password.js";
import { JwtPayload } from "./jwt.js";

export interface AuthUser {
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
  passwordHash?: string;
}

/**
 * Configure Passport.js with Local and JWT strategies
 */
export function configurePassport(drizzle: DrizzleClient) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email: string, password: string, done) => {
        try {
          const userWithAuth = await drizzle.query.user.findFirst({
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

          if (!userWithAuth) {
            done(null, false, { message: "Invalid email or password" });
            return;
          }

          const { userAuth, userRoles, ...user } = userWithAuth;

          if (!userAuth) {
            done(null, false, { message: "Account not properly configured" });
            return;
          }

          if (!userAuth.isActive) {
            done(null, false, { message: "Account is deactivated" });
            return;
          }

          if (userAuth.isSuspended) {
            done(null, false, { message: "Account is suspended" });
            return;
          }

          if (userAuth.failedLoginAttempts >= env.MAX_LOGIN_ATTEMPTS) {
            const lockoutExpiry = userAuth.lastFailedLoginAt
              ? new Date(userAuth.lastFailedLoginAt.getTime() + env.LOCKOUT_TIME)
              : new Date();

            if (lockoutExpiry > new Date()) {
              done(null, false, { message: "Account temporarily locked due to too many failed attempts" });
              return;
            }
          }

          const isValidPassword = await verifyPassword(password, userAuth.passwordHash);

          if (!isValidPassword) {
            await drizzle
              .update(schema.userAuth)
              .set({
                failedLoginAttempts: userAuth.failedLoginAttempts + 1,
                lastFailedLoginAt: new Date(),
              })
              .where(eq(schema.userAuth.userId, user.id));

            await drizzle.insert(schema.loginAttempt).values({
              email,
              ipAddress: req.ip || "unknown",
              isSuccessful: false,
              userAgent: req.get("user-agent") || "unknown",
              failureReason: "invalid_password",
            });

            done(null, false, { message: "Invalid email or password" });
            return;
          }

          await drizzle
            .update(schema.userAuth)
            .set({
              failedLoginAttempts: 0,
              lastLoginAt: new Date(),
              lastFailedLoginAt: null,
            })
            .where(eq(schema.userAuth.userId, user.id));

          await drizzle.insert(schema.loginAttempt).values({
            email,
            ipAddress: req.ip || "unknown",
            isSuccessful: true,
            userAgent: req.get("user-agent") || "unknown",
          });

          const permissions = userRoles.flatMap((ur) => ur.role.permissions || []);

          const authUser: AuthUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            permissions,
            isActive: userAuth.isActive,
            isEmailVerified: userAuth.isEmailVerified,
            isSuspended: userAuth.isSuspended,
          };

          done(null, authUser);
        } catch (err) {
          console.error("Local strategy error:", err);
          done(err);
        }
      },
    ),
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: env.JWT_SECRET,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        algorithms: ["HS256"],
        passReqToCallback: true,
      },
      async (req, payload: JwtPayload, done) => {
        try {
          if (payload.type !== "access") {
            done(null, false, { message: "Invalid token type" });
            return;
          }

          const userWithAuth = await drizzle.query.user.findFirst({
            where: (user, { eq }) => eq(user.id, payload.userId),
            with: {
              userAuth: true,
              userRoles: {
                with: {
                  role: true,
                },
              },
            },
          });

          if (!userWithAuth) {
            done(null, false, { message: "User not found" });
            return;
          }

          const { userAuth, userRoles, ...user } = userWithAuth;

          if (!userAuth) {
            done(null, false, { message: "Account not properly configured" });
            return;
          }

          if (!userAuth.isActive) {
            done(null, false, { message: "Account is deactivated" });
            return;
          }

          if (userAuth.isSuspended) {
            done(null, false, { message: "Account is suspended" });
            return;
          }

          const session = await drizzle.query.userSession.findFirst({
            where: (s, { eq, and }) => and(eq(s.sessionToken, payload.sessionId), eq(s.isActive, true)),
          });

          if (!session) {
            done(null, false, { message: "Session not found or expired" });
            return;
          }

          if (session.expiresAt < new Date()) {
            done(null, false, { message: "Session expired" });
            return;
          }

          await drizzle
            .update(schema.userSession)
            .set({ lastAccessedAt: new Date() })
            .where(eq(schema.userSession.id, session.id));

          const permissions = userRoles.flatMap((ur) => ur.role.permissions || []);

          const authUser: AuthUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            permissions,
            isActive: userAuth.isActive,
            isEmailVerified: userAuth.isEmailVerified,
            isSuspended: userAuth.isSuspended,
          };

          done(null, authUser);
        } catch (err) {
          console.error("JWT strategy error:", err);
          done(err);
        }
      },
    ),
  );

  passport.serializeUser((user: AuthUser, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const userWithAuth = await drizzle.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, id),
        with: {
          userAuth: true,
          userRoles: {
            with: {
              role: true,
            },
          },
        },
      });

      if (!userWithAuth) {
        done(null, false);
        return;
      }

      const { userAuth, userRoles, ...user } = userWithAuth;

      if (!userAuth || !userAuth.isActive || userAuth.isSuspended) {
        done(null, false);
        return;
      }

      const permissions = userRoles.flatMap((ur) => ur.role.permissions || []);

      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions,
        isActive: userAuth.isActive,
        isEmailVerified: userAuth.isEmailVerified,
        isSuspended: userAuth.isSuspended,
      };

      done(null, authUser);
    } catch (err) {
      done(err);
    }
  });

  return passport;
}
