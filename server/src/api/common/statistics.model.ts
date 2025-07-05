import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

// Base statistic item schema
export const statisticItemSchema = z
  .object({
    label: z.string().openapi({ description: "Label for the statistic" }),
    value: z.number().openapi({ description: "Numeric value" }),
    percentage: z.number().min(0).max(100).optional().openapi({ description: "Percentage representation" }),
    change: z.number().optional().openapi({ description: "Change from previous period" }),
    changePercentage: z
      .number()
      .optional()
      .openapi({ description: "Percentage change from previous period" }),
  })
  .openapi({ description: "Individual statistic item" });

// Time-based statistic schema
export const timeBasedStatisticSchema = z
  .object({
    period: z.string().openapi({ description: "Time period (e.g., '2024-01', 'Q1-2024')" }),
    value: z.number().openapi({ description: "Value for this period" }),
    date: z.date().optional().openapi({ description: "Date for this data point" }),
  })
  .openapi({ description: "Time-based statistic data point" });

export const timeSeriesSchema = z
  .object({
    name: z.string().openapi({ description: "Name of the time series" }),
    data: z.array(timeBasedStatisticSchema).openapi({ description: "Time series data points" }),
    unit: z.string().optional().openapi({ description: "Unit of measurement" }),
  })
  .openapi({ description: "Time series statistics" });

// Library statistics
export const libraryStatisticsSchema = z
  .object({
    totalBooks: z.number().openapi({ description: "Total number of books in the library" }),
    availableBooks: z.number().openapi({ description: "Number of available books" }),
    borrowedBooks: z.number().openapi({ description: "Number of currently borrowed books" }),
    totalMembers: z.number().openapi({ description: "Total number of library members" }),
    activeMembers: z.number().openapi({ description: "Number of active members" }),
    totalBorrowRequests: z.number().openapi({ description: "Total borrow requests ever made" }),
    pendingRequests: z.number().openapi({ description: "Number of pending borrow requests" }),
    overdueBooks: z.number().openapi({ description: "Number of overdue books" }),
    averageBorrowDuration: z.number().optional().openapi({ description: "Average borrow duration in days" }),
    popularBooks: z
      .array(
        z.object({
          bookId: z.string().uuid(),
          title: z.string(),
          borrowCount: z.number(),
          author: z.string().optional(),
        }),
      )
      .openapi({ description: "Most popular books" }),
    booksBySubject: z
      .array(
        z.object({
          subjectId: z.string().uuid(),
          subjectName: z.string(),
          bookCount: z.number(),
        }),
      )
      .openapi({ description: "Books grouped by subject" }),
    memberActivity: timeSeriesSchema.optional().openapi({ description: "Member activity over time" }),
    borrowActivity: timeSeriesSchema.optional().openapi({ description: "Borrow activity over time" }),
  })
  .openapi({ description: "Comprehensive library statistics" });

// User statistics
export const userStatisticsSchema = z
  .object({
    totalBorrowedBooks: z.number().openapi({ description: "Total books borrowed by user" }),
    currentlyBorrowed: z.number().openapi({ description: "Currently borrowed books count" }),
    overdueBooks: z.number().openapi({ description: "Number of overdue books" }),
    totalLibraries: z.number().openapi({ description: "Number of libraries user is member of" }),
    favoriteGenres: z
      .array(
        z.object({
          subjectId: z.string().uuid(),
          subjectName: z.string(),
          borrowCount: z.number(),
        }),
      )
      .openapi({ description: "User's favorite genres by borrow count" }),
    favoriteAuthors: z
      .array(
        z.object({
          authorId: z.string().uuid(),
          authorName: z.string(),
          borrowCount: z.number(),
        }),
      )
      .openapi({ description: "User's favorite authors by borrow count" }),
    readingHistory: timeSeriesSchema.optional().openapi({ description: "Reading activity over time" }),
    averageReadingTime: z.number().optional().openapi({ description: "Average reading time in days" }),
    completionRate: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .openapi({ description: "Book completion rate percentage" }),
  })
  .openapi({ description: "User reading statistics" });

// System-wide statistics
export const systemStatisticsSchema = z
  .object({
    totalUsers: z.number().openapi({ description: "Total registered users" }),
    activeUsers: z.number().openapi({ description: "Active users in the last 30 days" }),
    totalLibraries: z.number().openapi({ description: "Total number of libraries" }),
    totalBooks: z.number().openapi({ description: "Total books across all libraries" }),
    totalAuthors: z.number().openapi({ description: "Total unique authors" }),
    totalPublishers: z.number().openapi({ description: "Total unique publishers" }),
    totalBorrowRequests: z.number().openapi({ description: "Total borrow requests system-wide" }),
    activeBorrows: z.number().openapi({ description: "Currently active borrows" }),
    userGrowth: timeSeriesSchema.optional().openapi({ description: "User registration over time" }),
    libraryGrowth: timeSeriesSchema.optional().openapi({ description: "Library creation over time" }),
    borrowActivity: timeSeriesSchema.optional().openapi({ description: "Borrow activity system-wide" }),
    topLibraries: z
      .array(
        z.object({
          libraryId: z.string().uuid(),
          libraryName: z.string(),
          memberCount: z.number(),
          borrowCount: z.number(),
        }),
      )
      .openapi({ description: "Top libraries by activity" }),
    popularBooks: z
      .array(
        z.object({
          bookId: z.string().uuid(),
          title: z.string(),
          author: z.string(),
          borrowCount: z.number(),
          libraryCount: z.number(),
        }),
      )
      .openapi({ description: "Most popular books system-wide" }),
  })
  .openapi({ description: "System-wide statistics" });

// Book statistics
export const bookStatisticsSchema = z
  .object({
    totalCopies: z.number().openapi({ description: "Total copies across all libraries" }),
    availableCopies: z.number().openapi({ description: "Available copies for borrowing" }),
    totalBorrows: z.number().openapi({ description: "Total times this book has been borrowed" }),
    averageRating: z.number().min(0).max(5).optional().openapi({ description: "Average user rating" }),
    ratingCount: z.number().optional().openapi({ description: "Number of ratings received" }),
    librariesWithCopy: z.number().openapi({ description: "Number of libraries that have this book" }),
    borrowHistory: timeSeriesSchema.optional().openapi({ description: "Borrow history over time" }),
    libraryAvailability: z
      .array(
        z.object({
          libraryId: z.string().uuid(),
          libraryName: z.string(),
          totalCopies: z.number(),
          availableCopies: z.number(),
          borrowCount: z.number(),
        }),
      )
      .openapi({ description: "Availability across libraries" }),
  })
  .openapi({ description: "Book-specific statistics" });

// Author statistics
export const authorStatisticsSchema = z
  .object({
    totalBooks: z.number().openapi({ description: "Total books authored" }),
    totalBorrows: z.number().openapi({ description: "Total borrows across all books" }),
    averageRating: z
      .number()
      .min(0)
      .max(5)
      .optional()
      .openapi({ description: "Average rating across all books" }),
    popularBooks: z
      .array(
        z.object({
          bookId: z.string().uuid(),
          title: z.string(),
          borrowCount: z.number(),
          rating: z.number().optional(),
        }),
      )
      .openapi({ description: "Author's most popular books" }),
    publishingTimeline: z
      .array(
        z.object({
          year: z.number(),
          bookCount: z.number(),
          titles: z.array(z.string()).optional(),
        }),
      )
      .openapi({ description: "Publishing activity by year" }),
    genreDistribution: z
      .array(
        z.object({
          subjectId: z.string().uuid(),
          subjectName: z.string(),
          bookCount: z.number(),
        }),
      )
      .openapi({ description: "Books by genre/subject" }),
  })
  .openapi({ description: "Author statistics" });

// Publisher statistics
export const publisherStatisticsSchema = z
  .object({
    totalBooks: z.number().openapi({ description: "Total books published" }),
    totalBorrows: z.number().openapi({ description: "Total borrows across all books" }),
    averageRating: z
      .number()
      .min(0)
      .max(5)
      .optional()
      .openapi({ description: "Average rating across all books" }),
    topAuthors: z
      .array(
        z.object({
          authorId: z.string().uuid(),
          authorName: z.string(),
          bookCount: z.number(),
          borrowCount: z.number(),
        }),
      )
      .openapi({ description: "Top authors by book count" }),
    publishingTimeline: timeSeriesSchema.optional().openapi({ description: "Publishing activity over time" }),
    genreDistribution: z
      .array(
        z.object({
          subjectId: z.string().uuid(),
          subjectName: z.string(),
          bookCount: z.number(),
        }),
      )
      .openapi({ description: "Books by genre/subject" }),
  })
  .openapi({ description: "Publisher statistics" });

// Analytics dashboard response
export const analyticsDashboardSchema = z
  .object({
    overview: z
      .object({
        totalBooks: statisticItemSchema,
        totalUsers: statisticItemSchema,
        totalLibraries: statisticItemSchema,
        activeBorrows: statisticItemSchema,
      })
      .openapi({ description: "Key overview metrics" }),
    trends: z
      .object({
        userGrowth: timeSeriesSchema,
        borrowActivity: timeSeriesSchema,
        libraryGrowth: timeSeriesSchema,
      })
      .openapi({ description: "Trending data" }),
    topPerformers: z
      .object({
        popularBooks: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            author: z.string(),
            borrowCount: z.number(),
          }),
        ),
        activeLibraries: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            memberCount: z.number(),
            borrowCount: z.number(),
          }),
        ),
        topAuthors: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            bookCount: z.number(),
            borrowCount: z.number(),
          }),
        ),
      })
      .openapi({ description: "Top performing entities" }),
    insights: z
      .array(
        z.object({
          type: z.enum(["info", "warning", "success", "trend"]),
          title: z.string(),
          description: z.string(),
          value: z.number().optional(),
          change: z.number().optional(),
        }),
      )
      .openapi({ description: "Key insights and alerts" }),
  })
  .openapi({ description: "Analytics dashboard data" });

// Statistical summary schema for any entity
export const statisticalSummarySchema = z
  .object({
    count: z.number().openapi({ description: "Total count" }),
    average: z.number().optional().openapi({ description: "Average value" }),
    median: z.number().optional().openapi({ description: "Median value" }),
    min: z.number().optional().openapi({ description: "Minimum value" }),
    max: z.number().optional().openapi({ description: "Maximum value" }),
    standardDeviation: z.number().optional().openapi({ description: "Standard deviation" }),
    percentiles: z
      .object({
        p25: z.number(),
        p50: z.number(),
        p75: z.number(),
        p90: z.number(),
        p95: z.number(),
      })
      .optional()
      .openapi({ description: "Percentile values" }),
  })
  .openapi({ description: "Statistical summary" });

// Report generation schema
export const reportConfigSchema = z
  .object({
    type: z.enum(["library", "user", "system", "book", "author", "publisher"]).openapi({
      description: "Type of report to generate",
    }),
    entityId: z.string().uuid().optional().openapi({
      description: "Specific entity ID if applicable",
    }),
    dateRange: z
      .object({
        startDate: z.date(),
        endDate: z.date(),
      })
      .openapi({ description: "Date range for the report" }),
    metrics: z.array(z.string()).openapi({
      description: "Specific metrics to include",
    }),
    format: z.enum(["json", "pdf", "csv", "excel"]).default("json").openapi({
      description: "Output format for the report",
    }),
    includeCharts: z.boolean().default(false).openapi({
      description: "Whether to include chart data",
    }),
  })
  .openapi({ description: "Report configuration" });

// Export types
export type StatisticItem = z.infer<typeof statisticItemSchema>;
export type TimeBasedStatistic = z.infer<typeof timeBasedStatisticSchema>;
export type TimeSeries = z.infer<typeof timeSeriesSchema>;
export type LibraryStatistics = z.infer<typeof libraryStatisticsSchema>;
export type UserStatistics = z.infer<typeof userStatisticsSchema>;
export type SystemStatistics = z.infer<typeof systemStatisticsSchema>;
export type BookStatistics = z.infer<typeof bookStatisticsSchema>;
export type AuthorStatistics = z.infer<typeof authorStatisticsSchema>;
export type PublisherStatistics = z.infer<typeof publisherStatisticsSchema>;
export type AnalyticsDashboard = z.infer<typeof analyticsDashboardSchema>;
export type StatisticalSummary = z.infer<typeof statisticalSummarySchema>;
export type ReportConfig = z.infer<typeof reportConfigSchema>;
