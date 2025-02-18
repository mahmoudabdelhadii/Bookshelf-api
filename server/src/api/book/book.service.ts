import type { DrizzleClient } from "database";
import { eq, sql, schema } from "database";
import {
  BadRequest,
  NotFound,
  ResourceAlreadyExistsError,
  DatabaseError,
  ValidationError,
} from "../../errors.js";
import * as isbndb from "../../common/utils/fetchISBNdb/index.js";

export class BookService {
  static async createBook(
    drizzle: DrizzleClient,
    bookData: {
      title: string;
      author: string;
      isbn?: string;
      genre?: string;
      publishedYear?: number;
    },
  ) {
    if (!bookData.title || !bookData.author) {
      throw new ValidationError("Title and author are required fields.", { bookData });
    }

    if (bookData.isbn) {
      const existing = await drizzle.query.book.findFirst({
        where: (books, { eq }) => eq(books.isbn, bookData.isbn!),
      });
      if (existing) {
        throw new ResourceAlreadyExistsError("A book with the provided ISBN already exists.", {
          isbn: bookData.isbn,
        });
      }
    }

    try {
      const [insertedBook] = await drizzle.insert(schema.book).values(bookData).returning();
      return insertedBook;
    } catch (err) {
      throw new DatabaseError("Failed to create a new book.", { originalError: err });
    }
  }

  static async createBooksBulk(
    drizzle: DrizzleClient,
    bookList: {
      title: string;
      author: string;
      isbn?: string;
      genre?: string;
      publishedYear?: number;
    }[],
  ) {
    if (!Array.isArray(bookList) || bookList.length === 0) {
      throw new ValidationError("The 'books' array must contain at least one book.", { bookList });
    }

    try {
      return await drizzle.insert(schema.book).values(bookList).returning();
    } catch (err) {
      throw new DatabaseError("Failed to create books in bulk.", { originalError: err });
    }
  }

  static async getBookById(drizzle: DrizzleClient, bookId: string) {
    const book = await drizzle.query.book.findFirst({
      where: (b, { eq }) => eq(b.id, bookId),
    });

    if (!book) {
      throw new NotFound("Book not found.", { bookId });
    }
    console.log(book);
    return book;
  }

  static async updateBook(
    drizzle: DrizzleClient,
    bookId: string,
    updateData: Partial<{
      title: string;
      author: string;
      isbn: string;
      genre: string;
      publishedYear: number;
    }>,
  ) {
    try {
      const [updatedBook] = await drizzle
        .update(schema.book)
        .set(updateData)
        .where(eq(schema.book.id, bookId))
        .returning();

      if (!updatedBook) {
        throw new NotFound("Book not found.", { bookId });
      }

      return updatedBook;
    } catch (err) {
      throw new DatabaseError("Failed to update the book.", { bookId, originalError: err });
    }
  }

  static async deleteBook(drizzle: DrizzleClient, bookId: string) {
    try {
      const [deletedBook] = await drizzle.delete(schema.book).where(eq(schema.book.id, bookId)).returning();
      if (!deletedBook) {
        throw new NotFound("Book not found.", { bookId });
      }

      return deletedBook;
    } catch (err) {
      throw new DatabaseError("Failed to delete the book.", { bookId, originalError: err });
    }
  }

  static async getBooks(
    drizzle: DrizzleClient,
    {
      title,
      isbn,
      author,
      genre,
    }: {
      title?: string;
      isbn?: string;
      author?: string;
      genre?: string;
      datePublished?: Date;
    } = {},
  ) {
    try {
      return await drizzle.query.book.findMany({
        where: (b, { and, eq, ilike }) => {
          const conditions = [];
          if (title) conditions.push(ilike(b.title, `%${title}%`));
          if (isbn) conditions.push(eq(b.isbn, isbn));
          if (author) conditions.push(ilike(b.author, `%${author}%`));
          if (genre) conditions.push(ilike(b.genre, `%${genre}%`));

          return conditions.length > 0 ? and(...conditions) : undefined;
        },
        limit: 50,
      });
    } catch (err) {
      throw new DatabaseError("Error fetching books.", { originalError: err });
    }
  }

  static async searchBooksByTrigram(drizzle: DrizzleClient, searchTerm: string) {
    if (!searchTerm) {
      throw new BadRequest("Search term is required.");
    }

    try {
      const result = await drizzle.execute(
        sql`
          SELECT *, similarity(title, ${searchTerm}) as similarity
          FROM ${schema.book}
          WHERE title % ${searchTerm}
          ORDER BY similarity DESC
        `,
      );
      return result.rows;
    } catch (err) {
      throw new DatabaseError("Error executing trigram search.", { searchTerm, originalError: err });
    }
  }

  static async searchBooksByWeighted(drizzle: DrizzleClient, searchTerm: string) {
    if (!searchTerm) {
      throw new BadRequest("Search term is required.");
    }

    try {
      const result = await drizzle.execute(
        sql`
          SELECT *,
            ts_rank_cd(
              setweight(to_tsvector('english', title), 'A') ||
              setweight(to_tsvector('arabic', title), 'A') ||
              setweight(to_tsvector('english', description), 'B') ||
              setweight(to_tsvector('arabic', description), 'B'),
              plainto_tsquery(${searchTerm})
            ) AS rank
          FROM ${schema.book}
          WHERE
            (
              setweight(to_tsvector('english', title), 'A') ||
              setweight(to_tsvector('arabic', title), 'A') ||
              setweight(to_tsvector('english', description), 'B') ||
              setweight(to_tsvector('arabic', description), 'B')
            ) @@ plainto_tsquery(${searchTerm})
          ORDER BY rank DESC
          LIMIT 50
        `,
      );
      return result.rows;
    } catch (err) {
      throw new DatabaseError("Error executing weighted search.", { searchTerm, originalError: err });
    }
  }

  static async getBookByISBN(drizzle: DrizzleClient, isbn: string) {
    const localBook = await drizzle.query.book.findFirst({
      where: (b, { eq }) => eq(b.isbn, isbn),
    });

    if (localBook) return { book: localBook };

    const newBook = await isbndb.fetchBookDetails(isbn);
    if (!newBook) throw new NotFound("Book not found");

    await drizzle.insert(schema.book).values(newBook).onConflictDoNothing();

    return { book: newBook };
  }

  static async getAuthorDetails(
    drizzle: DrizzleClient,
    name: string,
    page: number = 1,
    pageSize: number = 20,
    language?: "en" | "ar" | "other",
  ) {
    const localAuthor = await drizzle.query.author.findFirst({
      where: (a, { eq }) => eq(a.name, name),
    });

    if (localAuthor) {
      const books = await drizzle.query.book.findMany({
        where: (b, { eq, and }) => and(eq(b.author, name), language ? eq(b.language, language) : sql`TRUE`),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      return { author: localAuthor.name, books };
    }

    const authorDetails = await isbndb.fetchAuthorDetails(name, { page, pageSize, language });
    if (!authorDetails.author) throw new NotFound("Author not found");

    await drizzle.insert(schema.author).values({ name: authorDetails.author }).onConflictDoNothing();
    if (authorDetails.books && authorDetails.books.length > 0) {
      const books = authorDetails.books.map((b) => b);
      await drizzle.insert(schema.book).values(books).onConflictDoNothing();
    }

    return authorDetails;
  }

  static async searchAuthors(drizzle: DrizzleClient, query: string, page: number = 1, pageSize: number = 20) {
    const authorsData = await isbndb.searchAuthors(query, { page, pageSize });
    if (!authorsData.authors || authorsData.authors.length === 0) throw new NotFound("No authors found");

    await drizzle
      .insert(schema.author)
      .values(authorsData.authors.map((name) => ({ name })))
      .onConflictDoNothing();

    return authorsData;
  }

  static async getPublisherDetails(
    drizzle: DrizzleClient,
    name: string,
    page: number = 1,
    pageSize: number = 20,
    language?: (typeof schema.book.language.enumValues)[number],
  ) {
    const localPublisher = await drizzle.query.publisher.findFirst({
      where: (p, { eq }) => eq(p.name, name),
    });

    if (localPublisher) {
      const books = await drizzle.query.book.findMany({
        where: (b, { eq, and }) =>
          and(eq(b.publisher, name), language ? eq(b.language, language) : undefined),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      return { publisher: localPublisher.name, books };
    }

    const publisherDetails = await isbndb.fetchPublisherDetails(name, { page, pageSize, language });
    if (!publisherDetails.name) throw new NotFound("Publisher not found");

    await drizzle.insert(schema.publisher).values({ name: publisherDetails.name }).onConflictDoNothing();
    if (publisherDetails.books && publisherDetails.books.length > 0) {
      const books = publisherDetails.books.map((b) => b);
      await drizzle.insert(schema.book).values(books).onConflictDoNothing();
    }

    return publisherDetails;
  }

  static async searchPublishers(
    drizzle: DrizzleClient,
    query: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const publishersData = await isbndb.searchPublishers(query, { page, pageSize });
    if (!publishersData.publishers || publishersData.publishers.length === 0)
      throw new NotFound("No publishers found");

    await drizzle
      .insert(schema.publisher)
      .values(publishersData.publishers.map((name) => ({ name })))
      .onConflictDoNothing();

    return publishersData;
  }

  static async searchAll(
    drizzle: DrizzleClient,
    index: "books" | "authors" | "publishers",
    page: number = 1,
    pageSize: number = 20,
    filters: {
      isbn?: string;
      isbn13?: string;
      author?: string;
      text?: string;
      subject?: string;
      publisher?: string;
    } = {},
  ) {
    const data = await isbndb.searchISBNdb(index, { page, pageSize, ...filters });

    //   switch (index) {
    //     case "books":
    //       if (data.books && data.books.length > 0) {
    //         await drizzle.insert(schema.book).values(data.books.map((b) => b.book)).onConflictDoNothing();
    //       }
    //       return data;

    //     case "authors":
    //       if (data.authors && data.authors.length > 0) {
    //         await drizzle.insert(schema.author).values(data.authors.map((name) => ({ name }))).onConflictDoNothing();
    //       }
    //       return data;

    //     case "publishers":
    //       if (data.publishers && data.publishers.length > 0) {
    //         await drizzle.insert(schema.publisher).values(data.publishers.map((name) => ({ name }))).onConflictDoNothing();
    //       }
    //       return data;

    //     default:
    //       throw new BadRequest("Invalid search index");
    //   }
    // }
  }
}
