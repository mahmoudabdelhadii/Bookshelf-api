import { seed, reset } from "drizzle-seed";
import { DrizzleClient } from "../drizzle.js";

// Import only the basic tables first
import { user } from "../drizzle/user.js";
import { userRoleType } from "../drizzle/role.js";
import { author } from "../drizzle/author.js";
import { publisher } from "../drizzle/publisher.js";
import { subject } from "../drizzle/subject.js";
import { book } from "../drizzle/book.js";
import { library } from "../drizzle/library.js";

export async function runSeed(drizzle: DrizzleClient) {
  // Reset all basic tables first
  await reset(drizzle, {
    user,
    userRoleType,
    author,
    publisher,
    subject,
    book,
    library,
  });

  await seed(drizzle, {
    user,
    userRoleType,
    author,
    publisher,
    subject,
    book,
    library,
  }).refine((funcs) => ({
    // Independent tables first
    user: {
      count: 25,
      columns: {
        id: funcs.uuid(),
        email: funcs.email(),
        firstName: funcs.firstName(),
        lastName: funcs.lastName(),
        dateOfBirth: funcs.date({ minDate: new Date("1950-01-01"), maxDate: new Date("2005-12-31") }),
        phone: funcs.phoneNumber(),
        address: funcs.streetAddress(),
        city: funcs.city(),
        country: funcs.country(),
        profilePicture: funcs.default({ defaultValue: "profile.jpg" }),
        bio: funcs.loremIpsum(),
        isActive: funcs.boolean({ probability: 0.95 }),
        lastLoginAt: funcs.date(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },
    
    userRoleType: {
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
          values: ["Science", "Technology", "History", "Literature", "Philosophy", "Art", "Religion", "Politics", "Economics", "Psychology", "Mathematics", "Physics", "Chemistry", "Biology", "Geography", "Sociology", "Medicine", "Engineering", "Law", "Business"],
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
        genre: funcs.valuesFromArray({ values: ["Fiction", "Non-fiction", "Mystery", "Romance", "Science", "History", "Biography"] }),
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
  }));
}