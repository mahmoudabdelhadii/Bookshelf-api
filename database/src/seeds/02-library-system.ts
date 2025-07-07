import { seed, reset } from "drizzle-seed";
import { DrizzleClient } from "../drizzle.js";

// Import referenced tables
import { user } from "../drizzle/user.js";
import { library } from "../drizzle/library.js";
import { book } from "../drizzle/book.js";

// Import library system tables
import { libraryBooks } from "../drizzle/libraryBooks.js";
import { libraryMember } from "../drizzle/libraryMember.js";
import { borrowRequest } from "../drizzle/borrowRequest.js";

export async function runSeed(drizzle: DrizzleClient) {
  // Reset library system tables (users, libraries, and books should already exist)
  await reset(drizzle, {
    libraryBooks,
    libraryMember,
    borrowRequest,
  });

  await seed(drizzle, {
    user,
    library,
    book,
    libraryBooks,
    libraryMember,
    borrowRequest,
  }).refine((funcs) => ({
    libraryBooks: {
      count: 200,
      columns: {
        id: funcs.uuid(),
        quantity: funcs.int({ minValue: 1, maxValue: 10 }),
        shelfLocation: funcs.valuesFromArray({ values: ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"] }),
        condition: funcs.valuesFromArray({ values: ["New", "Good", "Worn", "Damaged"] }),
        addedAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    libraryMember: {
      count: 50,
      columns: {
        id: funcs.uuid(),
        role: funcs.valuesFromArray({
          values: ["owner", "manager", "staff", "member"],
        }),
        permissions: funcs.default({ defaultValue: ["read", "borrow"] }),
        joinDate: funcs.date(),
        isActive: funcs.boolean(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },

    borrowRequest: {
      count: 100,
      columns: {
        id: funcs.uuid(),
        requestDate: funcs.date(),
        approvedDate: funcs.date(),
        dueDate: funcs.date({
          minDate: new Date(),
          maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
        returnDate: funcs.date(),
        status: funcs.valuesFromArray({
          values: ["pending", "approved", "rejected", "borrowed", "returned", "overdue"],
        }),
        notes: funcs.loremIpsum(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
      },
    },
  }));
}

