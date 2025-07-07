import { seed, reset } from "drizzle-seed";
import { DrizzleClient } from "../drizzle.js";

// Import all tables
import { user } from "../drizzle/user.js";
import { role } from "../drizzle/role.js";
import { author } from "../drizzle/author.js";
import { publisher } from "../drizzle/publisher.js";
import { subject } from "../drizzle/subject.js";
import { book } from "../drizzle/book.js";
import { library } from "../drizzle/library.js";
import { userRole } from "../drizzle/userRole.js";
import { userSession } from "../drizzle/userSession.js";
import { passwordResetToken } from "../drizzle/passwordResetToken.js";
import { emailVerificationToken } from "../drizzle/emailVerificationToken.js";
import { accountLockout } from "../drizzle/accountLockout.js";
import { oauthProfile } from "../drizzle/oauthProfile.js";
import { securityAuditLog } from "../drizzle/securityAuditLog.js";

export async function runSeed(drizzle: DrizzleClient) {
  // Reset all tables in dependency order (dependent tables first)
  await reset(drizzle, {
    securityAuditLog,
    oauthProfile,
    accountLockout,
    emailVerificationToken,
    passwordResetToken,
    userSession,
    userRole,
    book,
    library,
    subject,
    publisher,
    author,
    role,
    user,
  });

  await seed(drizzle, {
    user,
    role,
    author,
    publisher,
    subject,
    book,
    library,
    userRole,
    userSession,
    passwordResetToken,
    emailVerificationToken,
    accountLockout,
    oauthProfile,
    securityAuditLog,
  }).refine((funcs) => ({
    // Independent tables first
    user: {
      count: 25,
      columns: {
        id: funcs.uuid(),
        username: funcs.string(),
        email: funcs.email(),
        firstName: funcs.firstName(),
        lastName: funcs.lastName(),
        role: funcs.valuesFromArray({
          values: ["user", "admin"],
        }),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    role: {
      count: 5,
      columns: {
        id: funcs.uuid(),
        name: funcs.valuesFromArray({
          values: ["admin", "librarian", "member", "guest", "moderator"],
          isUnique: true,
        }),
        description: funcs.loremIpsum(),
        permissions: funcs.default({ defaultValue: ["read", "write"] }),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    author: {
      count: 50,
      columns: {
        id: funcs.uuid(),
        name: funcs.fullName(),
        biography: funcs.loremIpsum(),
        birthDate: funcs.default({ defaultValue: "1970-01-01" }),
        nationality: funcs.country(),
        booksCount: funcs.int({ minValue: 1, maxValue: 20 }),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    publisher: {
      count: 30,
      columns: {
        id: funcs.uuid(),
        name: funcs.companyName(),
        address: funcs.streetAddress(),
        website: funcs.string(),
        foundedYear: funcs.int({ minValue: 1800, maxValue: 2020 }),
        booksCount: funcs.int({ minValue: 1, maxValue: 100 }),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    subject: {
      count: 20,
      columns: {
        id: funcs.uuid(),
        name: funcs.valuesFromArray({
          values: [
            "Science",
            "Technology",
            "History",
            "Literature",
            "Philosophy",
            "Art",
            "Religion",
            "Politics",
            "Economics",
            "Psychology",
            "Mathematics",
            "Physics",
            "Chemistry",
            "Biology",
            "Geography",
            "Sociology",
            "Medicine",
            "Engineering",
            "Law",
            "Business",
          ],
          isUnique: true,
        }),
        description: funcs.loremIpsum(),
        parent: undefined,
        booksCount: funcs.int({ minValue: 1, maxValue: 50 }),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    library: {
      count: 5,
      columns: {
        id: funcs.uuid(),
        name: funcs.companyName(),
        description: funcs.loremIpsum(),
        address: funcs.streetAddress(),
        city: funcs.city(),
        phone: funcs.phoneNumber(),
        email: funcs.email(),
        website: funcs.string(),
        hours: funcs.valuesFromArray({ values: ["9AM-5PM", "8AM-6PM", "10AM-4PM", "9AM-9PM"] }),
        image: funcs.string(),
        rating: funcs.number({ minValue: 1, maxValue: 5, precision: 10 }),
        location: funcs.city(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    book: {
      count: 100,
      columns: {
        id: funcs.uuid(),
        title: funcs.string(),
        titleLong: funcs.string(),
        isbn: funcs.string(),
        isbn13: funcs.string(),
        deweyDecimal: funcs.string(),
        binding: funcs.valuesFromArray({ values: ["Hardcover", "Paperback", "Ebook"] }),
        language: funcs.valuesFromArray({ values: ["en", "ar", "other"] }),
        genre: funcs.valuesFromArray({
          values: ["Fiction", "Non-fiction", "Mystery", "Romance", "Science", "History", "Biography"],
        }),
        publishedYear: funcs.int({ minValue: 1900, maxValue: 2024 }),
        edition: funcs.string(),
        pages: funcs.int({ minValue: 50, maxValue: 1000 }),
        overview: funcs.loremIpsum(),
        image: funcs.string(),
        excerpt: funcs.loremIpsum(),
        synopsis: funcs.loremIpsum(),
        createdAt: funcs.date(),
      },
    },

    userRole: {
      count: 5, // Very low count to avoid duplicates
      columns: {
        id: funcs.uuid(),
        assignedAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    userSession: {
      count: 50,
      columns: {
        id: funcs.uuid(),
        sessionToken: funcs.string(),
        refreshToken: funcs.string(),
        ipAddress: funcs.default({ defaultValue: "192.168.1.1" }),
        userAgent: funcs.string(),
        isActive: funcs.boolean(),
        expiresAt: funcs.date({
          minDate: new Date(),
          maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
        createdAt: funcs.date(),
        lastAccessedAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    passwordResetToken: {
      count: 10,
      columns: {
        id: funcs.uuid(),
        token: funcs.string(),
        expiresAt: funcs.date({ minDate: new Date(), maxDate: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
        isUsed: funcs.boolean(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    emailVerificationToken: {
      count: 8,
      columns: {
        id: funcs.uuid(),
        token: funcs.string(),
        expiresAt: funcs.date({ minDate: new Date(), maxDate: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
        isUsed: funcs.boolean(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    accountLockout: {
      count: 3,
      columns: {
        id: funcs.uuid(),
        lockedAt: funcs.date(),
        lockedUntil: funcs.date({ minDate: new Date(), maxDate: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
        reason: funcs.valuesFromArray({
          values: [
            "Too many failed login attempts",
            "Suspicious activity",
            "Admin lockout",
            "Security breach",
          ],
        }),
        failedAttempts: funcs.int({ minValue: 3, maxValue: 10 }),
        isActive: funcs.boolean(),
      },
    },

    oauthProfile: {
      count: 2, // Very low count since we only have 2 providers (google, apple)
      columns: {
        id: funcs.uuid(),
        provider: funcs.valuesFromArray({
          values: ["google", "apple"],
        }),
        providerId: funcs.string(),
        email: funcs.email(),
        profileData: funcs.string(),
        accessToken: funcs.string(),
        refreshToken: funcs.string(),
        tokenExpiresAt: funcs.date({
          minDate: new Date(),
          maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    securityAuditLog: {
      count: 100,
      columns: {
        id: funcs.uuid(),
        action: funcs.valuesFromArray({
          values: [
            "login",
            "logout",
            "password_change",
            "profile_update",
            "role_assignment",
            "data_access",
            "failed_login",
          ],
        }),
        details: funcs.loremIpsum(),
        ipAddress: funcs.default({ defaultValue: "192.168.1.1" }),
        userAgent: funcs.string(),
        timestamp: funcs.date(),
        severity: funcs.valuesFromArray({
          values: ["info", "warning", "error", "critical"],
        }),
      },
    },
  }));
}
