import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { bookSchema } from "../../api/book/book.model.js";
import { borrowRequestSchema } from "../../api/borrowRequest/borrowRequest.model.js";

extendZodWithOpenApi(z);

export const libraryStatsSchema = z
  .object({
    totalBooks: z.number().int().min(0).openapi({ description: "Total number of books in the library" }),
    availableBooks: z.number().int().min(0).openapi({ description: "Number of available books" }),
    borrowedBooks: z.number().int().min(0).openapi({ description: "Number of currently borrowed books" }),
    pendingRequests: z.number().int().min(0).openapi({ description: "Number of pending borrow requests" }),
    activeMembers: z.number().int().min(0).openapi({ description: "Number of active library members" }),
    monthlyBorrows: z.number().int().min(0).openapi({ description: "Number of books borrowed this month" }),
    popularBooks: z
      .array(
        bookSchema.extend({
          borrowCount: z
            .number()
            .int()
            .min(0)
            .openapi({ description: "Number of times this book has been borrowed" }),
        }),
      )
      .openapi({ description: "Most popular books in the library" }),
    recentActivity: z.array(borrowRequestSchema).openapi({ description: "Recent borrow request activity" }),
  })
  .openapi({ description: "Library statistics" });

export const userStatsSchema = z
  .object({
    totalBooksRead: z
      .number()
      .int()
      .min(0)
      .openapi({ description: "Total number of books the user has read" }),
    currentlyReading: z
      .number()
      .int()
      .min(0)
      .openapi({ description: "Number of books currently being read" }),
    favoriteGenre: z.string().nullable().openapi({ description: "User's most read genre" }),
    readingStreak: z.number().int().min(0).openapi({ description: "Current reading streak in days" }),
    librariesJoined: z
      .number()
      .int()
      .min(0)
      .openapi({ description: "Number of libraries the user is a member of" }),
    booksThisMonth: z.number().int().min(0).openapi({ description: "Number of books read this month" }),
    booksThisYear: z.number().int().min(0).openapi({ description: "Number of books read this year" }),
    averageRating: z.number().min(0).max(5).nullable().openapi({ description: "User's average book rating" }),
  })
  .openapi({ description: "User reading statistics" });

export const systemStatsSchema = z
  .object({
    totalUsers: z.number().int().min(0).openapi({ description: "Total number of registered users" }),
    totalLibraries: z.number().int().min(0).openapi({ description: "Total number of libraries" }),
    totalBooks: z.number().int().min(0).openapi({ description: "Total number of books in the system" }),
    totalBorrows: z.number().int().min(0).openapi({ description: "Total number of book borrows" }),
    activeUsers: z.number().int().min(0).openapi({ description: "Number of active users (last 30 days)" }),
    popularLibraries: z
      .array(
        z.object({
          id: z.string().uuid(),
          name: z.string(),
          memberCount: z.number().int().min(0),
          borrowCount: z.number().int().min(0),
        }),
      )
      .openapi({ description: "Most popular libraries" }),
    topGenres: z
      .array(
        z.object({
          genre: z.string(),
          bookCount: z.number().int().min(0),
          borrowCount: z.number().int().min(0),
        }),
      )
      .openapi({ description: "Most popular genres" }),
  })
  .openapi({ description: "System-wide statistics" });

export const monthlyStatsSchema = z
  .object({
    month: z.string().openapi({ description: "Month in YYYY-MM format" }),
    newUsers: z.number().int().min(0).openapi({ description: "New users registered this month" }),
    newLibraries: z.number().int().min(0).openapi({ description: "New libraries created this month" }),
    newBooks: z.number().int().min(0).openapi({ description: "New books added this month" }),
    totalBorrows: z.number().int().min(0).openapi({ description: "Total borrows this month" }),
    averageBorrowTime: z.number().min(0).openapi({ description: "Average borrow duration in days" }),
  })
  .openapi({ description: "Monthly statistics" });

export const bookStatsSchema = z
  .object({
    bookId: z.string().uuid().openapi({ description: "Book ID" }),
    title: z.string().openapi({ description: "Book title" }),
    totalCopies: z.number().int().min(0).openapi({ description: "Total copies across all libraries" }),
    availableCopies: z.number().int().min(0).openapi({ description: "Currently available copies" }),
    borrowedCopies: z.number().int().min(0).openapi({ description: "Currently borrowed copies" }),
    totalBorrows: z.number().int().min(0).openapi({ description: "Total number of times borrowed" }),
    averageRating: z.number().min(0).max(5).nullable().openapi({ description: "Average user rating" }),
    popularLibraries: z
      .array(
        z.object({
          libraryId: z.string().uuid(),
          libraryName: z.string(),
          borrowCount: z.number().int().min(0),
        }),
      )
      .openapi({ description: "Libraries where this book is most popular" }),
  })
  .openapi({ description: "Book statistics" });

export type LibraryStats = z.infer<typeof libraryStatsSchema>;
export type UserStats = z.infer<typeof userStatsSchema>;
export type SystemStats = z.infer<typeof systemStatsSchema>;
export type MonthlyStats = z.infer<typeof monthlyStatsSchema>;
export type BookStats = z.infer<typeof bookStatsSchema>;
