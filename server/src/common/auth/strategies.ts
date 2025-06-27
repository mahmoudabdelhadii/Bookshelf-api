import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import type { DrizzleClient } from "database";
import { eq } from "database";
import { env } from "../utils/envConfig.js";
import { verifyPassword } from "../utils/password.js";
import { JwtPayload } from "./jwt.js";

// Extended user interface for authentication
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
  passwordHash?: string; // Only included during authentication
}

/**
 * Configure Passport.js with Local and JWT strategies
 */
export function configurePassport(drizzle: DrizzleClient) {
  // Local Strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // Use email as username field
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email: string, password: string, done) => {
        try {
          // Find user by email with auth data and roles
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
            return done(null, false, { message: "Invalid email or password" });
          }

          const { userAuth, userRoles, ...user } = userWithAuth;

          if (!userAuth) {
            return done(null, false, { message: "Account not properly configured" });
          }

          // Check if account is active
          if (!userAuth.isActive) {
            return done(null, false, { message: "Account is deactivated" });
          }

          // Check if account is suspended
          if (userAuth.isSuspended) {
            return done(null, false, { message: "Account is suspended" });
          }

          // Check if too many failed login attempts
          if (userAuth.failedLoginAttempts >= env.MAX_LOGIN_ATTEMPTS) {
            const lockoutExpiry = userAuth.lastFailedLoginAt 
              ? new Date(userAuth.lastFailedLoginAt.getTime() + env.LOCKOUT_TIME)
              : new Date();

            if (lockoutExpiry > new Date()) {
              return done(null, false, { message: "Account temporarily locked due to too many failed attempts" });
            }
          }

          // Verify password
          const isValidPassword = await verifyPassword(password, userAuth.passwordHash);

          if (!isValidPassword) {
            // Update failed login attempts
            await drizzle
              .update(userAuth)
              .set({
                failedLoginAttempts: userAuth.failedLoginAttempts + 1,
                lastFailedLoginAt: new Date(),
              })
              .where(eq(userAuth.userId, user.id));

            // Log failed login attempt
            await drizzle.insert(loginAttempt).values({
              email,
              ipAddress: req.ip || "unknown",
              isSuccessful: false,
              userAgent: req.get("user-agent") || "unknown",
              failureReason: "invalid_password",
            });

            return done(null, false, { message: "Invalid email or password" });
          }

          // Successful login - reset failed attempts and update last login
          await drizzle
            .update(userAuth)
            .set({
              failedLoginAttempts: 0,
              lastLoginAt: new Date(),
              lastFailedLoginAt: null,
            })
            .where(eq(userAuth.userId, user.id));

          // Log successful login
          await drizzle.insert(loginAttempt).values({
            email,
            ipAddress: req.ip || "unknown",
            isSuccessful: true,
            userAgent: req.get("user-agent") || "unknown",
          });

          // Collect user permissions from roles
          const permissions = userRoles.flatMap(ur => ur.role.permissions || []);

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

          return done(null, authUser);
        } catch (error) {
          console.error("Local strategy error:", error);
          return done(error);
        }
      }
    )
  );

  // JWT Strategy for token-based authentication
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
          // Verify this is an access token
          if (payload.type !== "access") {
            return done(null, false, { message: "Invalid token type" });
          }

          // Find user by ID
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
            return done(null, false, { message: "User not found" });
          }

          const { userAuth, userRoles, ...user } = userWithAuth;

          if (!userAuth) {
            return done(null, false, { message: "Account not properly configured" });
          }

          // Check if account is still active
          if (!userAuth.isActive) {
            return done(null, false, { message: "Account is deactivated" });
          }

          // Check if account is suspended
          if (userAuth.isSuspended) {
            return done(null, false, { message: "Account is suspended" });
          }

          // Verify session exists and is active
          const session = await drizzle.query.userSession.findFirst({
            where: (s, { eq, and }) => and(
              eq(s.sessionToken, payload.sessionId),
              eq(s.isActive, true)
            ),
          });

          if (!session) {
            return done(null, false, { message: "Session not found or expired" });
          }

          if (session.expiresAt < new Date()) {
            return done(null, false, { message: "Session expired" });
          }

          // Update session last accessed time
          await drizzle
            .update(userSession)
            .set({ lastAccessedAt: new Date() })
            .where(eq(userSession.id, session.id));

          // Collect current permissions
          const permissions = userRoles.flatMap(ur => ur.role.permissions || []);

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

          return done(null, authUser);
        } catch (error) {
          console.error("JWT strategy error:", error);
          return done(error);
        }
      }
    )
  );

  // Serialize user for session storage (if using sessions alongside JWT)
  passport.serializeUser((user: AuthUser, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
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
        return done(null, false);
      }

      const { userAuth, userRoles, ...user } = userWithAuth;

      if (!userAuth || !userAuth.isActive || userAuth.isSuspended) {
        return done(null, false);
      }

      const permissions = userRoles.flatMap(ur => ur.role.permissions || []);

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
    } catch (error) {
      done(error);
    }
  });

  return passport;
}

// Note: Tables will be available through drizzle.query when the schema is properly set up