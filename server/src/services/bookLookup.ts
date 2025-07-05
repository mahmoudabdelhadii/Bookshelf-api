import { eq, schema, type DrizzleClient, logger, count } from "database";
import { isbnService } from "./isbnService.js";
import type { Book as ISBNdbBook } from "../common/types/shared/isbndbAPI.js";

export const BookLookupService = {
  // Get book by ISBN - checks DB first, then queues ISBNDB lookup if not found
  getBookByISBN: async (drizzle: DrizzleClient, isbn: string, forceRefresh = false) => {
    try {
      const cleanISBN = isbn.replace(/[^0-9X]/gi, "");

      if (!forceRefresh) {
        const cachedBook = await drizzle.query.book.findFirst({
          where: eq(schema.book.isbn, cleanISBN),
          with: {
            author: true,
            publisher: true,
          },
        });

        if (cachedBook) {
          logger.info("Book found in cache: %s", cleanISBN);
          return {
            title: cachedBook.title,
            title_long: cachedBook.title,
            isbn: cachedBook.isbn,
            isbn13: cachedBook.isbn13,
            publisher: cachedBook.publisher.name,
            date_published: cachedBook.publishedYear?.toString(),
            pages: cachedBook.pages,
            overview: cachedBook.overview,
            image: cachedBook.image,
            authors: cachedBook.author ? [cachedBook.author.name] : [],
            subjects: [],
            cached: true,
          };
        }
      }

      // If not in cache and ISBNDB is enabled, fetch from API
      if (isbnService.isEnabled()) {
        try {
          logger.info("Fetching book from ISBNDB: %s", cleanISBN);
          const isbndbData = await isbnService.getBookByISBN(cleanISBN);

          if (isbndbData.book) {
            await BookLookupService.cacheBook(drizzle, isbndbData.book);
            return isbndbData.book;
          }
        } catch (err) {
          logger.error({ error: err }, "Failed to fetch book from ISBNDB: %s", cleanISBN);
        }
      }

      return null;
    } catch (err) {
      logger.error({ error: err }, "Error in getBookByISBN: %s", isbn);
      throw err;
    }
  },

  // Cache a book from ISBNDB data into our database
  cacheBook: async (drizzle: DrizzleClient, isbndbBook: NonNullable<ISBNdbBook["book"]>): Promise<void> => {
    try {
      // First, ensure we have authors and publishers
      let authorId: string;
      let publisherId: string;

      if (isbndbBook.authors && isbndbBook.authors.length > 0) {
        authorId = await BookLookupService.ensureAuthor(drizzle, isbndbBook.authors[0]);
      } else {
        authorId = await BookLookupService.ensureAuthor(drizzle, "Unknown Author");
      }

      if (isbndbBook.publisher) {
        publisherId = await BookLookupService.ensurePublisher(drizzle, isbndbBook.publisher);
      } else {
        publisherId = await BookLookupService.ensurePublisher(drizzle, "Unknown Publisher");
      }

      // Check if book already exists (only if we have an ISBN)
      let existingBook = null;
      if (isbndbBook.isbn) {
        existingBook = await drizzle.query.book.findFirst({
          where: eq(schema.book.isbn, isbndbBook.isbn),
        });
      }

      if (!existingBook) {
        // Insert new book
        await drizzle.insert(schema.book).values({
          isbn: isbndbBook.isbn ?? null,
          isbn13: isbndbBook.isbn13 ?? null,
          title: isbndbBook.title ?? "Unknown Title",
          overview: isbndbBook.overview ?? isbndbBook.synopsis ?? null,
          publishedYear: isbndbBook.date_published ? new Date(isbndbBook.date_published).getFullYear() : null,
          pages: isbndbBook.pages ?? null,
          image: isbndbBook.image ?? null,
          authorId,
          publisherId,
        });

        logger.info("Cached book in database: %s", isbndbBook.isbn);
      } else if (isbndbBook.isbn) {
        // Update existing book (only if we have an ISBN)
        await drizzle
          .update(schema.book)
          .set({
            title: isbndbBook.title ?? "Unknown Title",
            overview: isbndbBook.overview ?? isbndbBook.synopsis ?? null,
            publishedYear: isbndbBook.date_published
              ? new Date(isbndbBook.date_published).getFullYear()
              : null,
            pages: isbndbBook.pages ?? null,
            image: isbndbBook.image ?? null,
            authorId,
            publisherId,
          })
          .where(eq(schema.book.isbn, isbndbBook.isbn));

        logger.info("Updated cached book in database: %s", isbndbBook.isbn);
      }
    } catch (err) {
      logger.error({ error: err }, "Error caching book: %s", isbndbBook.isbn);
    }
  },

  // Ensure author exists in database
  ensureAuthor: async (drizzle: DrizzleClient, authorName: string): Promise<string> => {
    try {
      // Check if author exists
      const existingAuthor = await drizzle.query.author.findFirst({
        where: eq(schema.author.name, authorName),
      });

      if (existingAuthor) {
        return existingAuthor.id;
      }

      // Create new author
      const [newAuthor] = await drizzle
        .insert(schema.author)
        .values({
          name: authorName,
        })
        .returning();

      return newAuthor.id;
    } catch (err) {
      logger.error({ error: err }, "Error ensuring author: %s", authorName);
      throw err;
    }
  },

  // Ensure publisher exists in database
  ensurePublisher: async (drizzle: DrizzleClient, publisherName: string): Promise<string> => {
    try {
      // Check if publisher exists
      const existingPublisher = await drizzle.query.publisher.findFirst({
        where: eq(schema.publisher.name, publisherName),
      });

      if (existingPublisher) {
        return existingPublisher.id;
      }

      // Create new publisher
      const [newPublisher] = await drizzle
        .insert(schema.publisher)
        .values({
          name: publisherName,
        })
        .returning();

      return newPublisher.id;
    } catch (err) {
      logger.error({ error: err }, "Error ensuring publisher: %s", publisherName);
      throw err;
    }
  },

  // Search cached books with proper pagination
  searchCachedBooks: async (drizzle: DrizzleClient, query: string, limit = 20) => {
    try {
      const results = await drizzle.query.book.findMany({
        where: (b, { ilike }) => ilike(b.title, `%${query}%`),
        with: {
          author: true,
          publisher: true,
        },
        limit,
      });

      return results.map((result) => ({
        title: result.title,
        title_long: result.title,
        isbn: result.isbn,
        isbn13: result.isbn13,
        publisher: result.publisher.name,
        date_published: result.publishedYear?.toString(),
        pages: result.pages,
        overview: result.overview,
        image: result.image,
        authors: result.author ? [result.author.name] : [],
        subjects: [],
        cached: true,
      }));
    } catch (err) {
      logger.error({ error: err }, "Error searching cached books: %s", query);
      return [];
    }
  },

  // Search books using ISBNdb API with proper typing
  searchBooksViaISBNdb: async (
    query: string,
    options?: {
      page?: number;
      pageSize?: number;
      column?: "title" | "author" | "date_published" | "subjects" | "";
    },
  ) => {
    try {
      if (!isbnService.isEnabled()) {
        logger.warn("ISBNdb service is not enabled");
        return [];
      }

      const searchResult = await isbnService.searchBooks(query, options);

      if (!searchResult.books) {
        return [];
      }

      return searchResult.books.map((bookWrapper) => {
        const book = bookWrapper.book;
        return {
          title: book?.title,
          title_long: book?.title_long ?? book?.title,
          isbn: book?.isbn,
          isbn13: book?.isbn13,
          publisher: book?.publisher,
          date_published: book?.date_published,
          pages: book?.pages ?? 0,
          overview: book?.overview,
          synopsis: book?.synopsis,
          image: book?.image,
          authors: book?.authors ?? [],
          subjects: book?.subjects ?? [],
          cached: false,
          source: "isbndb",
        };
      });
    } catch (err) {
      logger.error({ error: err }, "Error searching books via ISBNdb: %s", query);
      return [];
    }
  },

  // Get cache statistics efficiently
  getCacheStats: async (
    drizzle: DrizzleClient,
  ): Promise<{ totalBooks: number; totalAuthors: number; totalPublishers: number }> => {
    try {
      const [bookCount] = await drizzle.select({ count: count(schema.book.id) }).from(schema.book);
      const [authorCount] = await drizzle.select({ count: count(schema.author.id) }).from(schema.author);
      const [publisherCount] = await drizzle
        .select({ count: count(schema.publisher.id) })
        .from(schema.publisher);

      return {
        totalBooks: bookCount.count,
        totalAuthors: authorCount.count,
        totalPublishers: publisherCount.count,
      };
    } catch (err) {
      logger.error({ error: err }, "Error getting cache stats");
      return { totalBooks: 0, totalAuthors: 0, totalPublishers: 0 };
    }
  },
};
