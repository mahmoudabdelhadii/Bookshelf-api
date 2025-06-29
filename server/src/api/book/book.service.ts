import type { DrizzleClient } from "database";
import { eq, sql, schema, ilike, and, or } from "database";
import {
  NotFoundError,
  ConflictError,
  DatabaseError,
  ValidationError,
  NotFound,
  BadRequest,
} from "../../errors.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import * as isbndb from "../../common/utils/fetchISBNdb/index.js";
import type { Book, CreateBookWithIds } from "./book.model.js";

type Language = (typeof schema.book.language.enumValues)[number];

export const BookService = {
  createBook: async (
    drizzle: DrizzleClient,
    bookData: {
      title: string;
      author: string;
      publisher: string;
      isbn?: string;
      genre?: string;
      publishedYear?: number;
      language: (typeof schema.book.language.enumValues)[number];
    },
  ) => {
    try {
      if (!bookData.title.trim()) {
        const validationError = new ValidationError("Book title is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }
      if (!bookData.author.trim()) {
        const validationError = new ValidationError("Book author is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }
      if (!bookData.publisher.trim()) {
        const validationError = new ValidationError("Book publisher is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      const { isbn, title, author, publisher, genre, publishedYear, language } = bookData;

      if (isbn?.trim()) {
        const existing = await drizzle.query.book.findFirst({
          where: (b, { eq }) => eq(b.isbn, isbn),
        });
        if (existing) {
          const conflictError = new ConflictError("A book with this ISBN already exists");
          return ServiceResponse.failure(conflictError.message, { isbn }, conflictError.statusCode);
        }
      }

      let authorRec = await drizzle.query.author.findFirst({
        where: (a, { eq }) => eq(a.name, author),
      });
      if (!authorRec) {
        [authorRec] = await drizzle.insert(schema.author).values({ name: author }).returning();
      }

      let publisherRec = await drizzle.query.publisher.findFirst({
        where: (p, { eq }) => eq(p.name, publisher),
      });
      if (!publisherRec) {
        [publisherRec] = await drizzle.insert(schema.publisher).values({ name: publisher }).returning();
      }

      const insertData = {
        title,
        authorId: authorRec.id,
        publisherId: publisherRec.id,
        isbn,
        genre,
        publishedYear,
        language,
      };
      const [insertedBook] = await drizzle.insert(schema.book).values(insertData).returning();

      return ServiceResponse.success("Book created successfully", insertedBook, 201);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to create book: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  createBooksBulk: async (
    drizzle: DrizzleClient,
    bookList: CreateBookWithIds[],
  ) => {
    if (!Array.isArray(bookList) || bookList.length === 0) {
      throw new ValidationError("The 'books' array must contain at least one book.", { bookList });
    }

    try {
      return await drizzle.insert(schema.book).values(bookList).returning();
    } catch (err) {
      throw new DatabaseError("Failed to create books in bulk.", { originalError: err });
    }
  },

  getBookById: async (drizzle: DrizzleClient, bookId: string) => {
    try {
      if (!bookId.trim()) {
        const validationError = new ValidationError("Book ID is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      const book = await drizzle.query.book.findFirst({
        where: (b, { eq }) => eq(b.id, bookId),
      });

      if (!book) {
        const notFoundError = new NotFoundError("Book", bookId);
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }

      return ServiceResponse.success("Book found", book);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to fetch book: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { bookId, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },

  updateBook: async (
    drizzle: DrizzleClient,
    bookId: string,
    updateData: Partial<{
      title: string;
      author: string;
      isbn: string;
      genre: string;
      publishedYear: number;
    }>,
  ) => {
    try {
      const [updatedBook] = await drizzle
        .update(schema.book)
        .set(updateData)
        .where(eq(schema.book.id, bookId))
        .returning();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!updatedBook) {
        throw new NotFound("Book not found.", { bookId });
      }

      return updatedBook;
    } catch (err) {
      throw new DatabaseError("Failed to update the book.", { bookId, originalError: err });
    }
  },

  deleteBook: async (drizzle: DrizzleClient, bookId: string) => {
    try {
      const deletedBooks = await drizzle.delete(schema.book).where(eq(schema.book.id, bookId)).returning();

      if (deletedBooks.length === 0) {
        throw new NotFound("Book not found.", { bookId });
      }
      const [deletedBook] = deletedBooks;

      return deletedBook;
    } catch (err) {
      throw new DatabaseError("Failed to delete the book.", { bookId, originalError: err });
    }
  },

  searchBooksByTrigram: async (drizzle: DrizzleClient, searchTerm: string) => {
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
  },

  searchBooksByWeighted: async (drizzle: DrizzleClient, searchTerm: string) => {
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
  },

  getBookByISBN: async (drizzle: DrizzleClient, isbn: string) => {
    const localBook = await drizzle.query.book.findFirst({
      where: (b, { eq }) => eq(b.isbn, isbn),
    });

    if (localBook) {
      return localBook;
    }

    const bookInfo = await isbndb.fetchBookDetails(isbn);
    if (!bookInfo) {
      throw new NotFound("Book not found");
    }

    const createdBook = await BookService.createBook(drizzle, {
      title: bookInfo.title ?? "",
      author: "Unknown Author",
      publisher: "Unknown Publisher",
      isbn: bookInfo.isbn,
      genre: undefined,
      publishedYear: undefined,
      language: "other" as Language,
    });
    return createdBook;
  },

  getBooks: async (
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
    } = {},
  ) => {
    try {
      const conditions = [sql`TRUE`];
      if (title) conditions.push(ilike(schema.book.title, `%${title}%`));
      if (isbn) conditions.push(eq(schema.book.isbn, isbn));
      if (author) conditions.push(ilike(schema.author.name, `%${author}%`));
      if (genre) conditions.push(ilike(schema.book.genre, `%${genre}%`));

      return await drizzle
        .select({
          book: schema.book,
          author: schema.author,
        })
        .from(schema.book)
        .leftJoin(schema.author, eq(schema.book.authorId, schema.author.id))
        .where(and(...conditions))
        .limit(50);
    } catch (err) {
      throw new DatabaseError("Error fetching books.", { originalError: err });
    }
  },

  getAuthorDetails: async (
    drizzle: DrizzleClient,
    name: string,
    page = 1,
    pageSize = 20,
    language?: Language,
  ) => {
    const offset = (page - 1) * pageSize;
    const localAuthor = await drizzle.query.author.findFirst({
      where: (a, { eq }) => eq(a.name, name),
    });

    if (localAuthor) {
      const books = await drizzle
        .select()
        .from(schema.book)
        .where(
          and(
            eq(schema.book.authorId, localAuthor.id),
            language ? eq(schema.book.language, language) : sql`TRUE`,
          ),
        )
        .limit(pageSize)
        .offset(offset);

      return { author: localAuthor.name, books };
    }

    const authorDetails = await isbndb.fetchAuthorDetails(name, { page, pageSize, language });
    if (!authorDetails.author) {
      throw new NotFound("Author not found");
    }

    await drizzle.insert(schema.author).values({ name: authorDetails.author }).onConflictDoNothing();
    return authorDetails;
  },

  getPublisherDetails: async (
    drizzle: DrizzleClient,
    name: string,
    page = 1,
    pageSize = 20,
    language?: Language,
  ) => {
    const offset = (page - 1) * pageSize;
    const localPublisher = await drizzle.query.publisher.findFirst({
      where: (p, { eq }) => eq(p.name, name),
    });

    if (localPublisher) {
      const books = await drizzle
        .select()
        .from(schema.book)
        .where(
          and(
            eq(schema.book.publisherId, localPublisher.id),
            language ? eq(schema.book.language, language) : sql`TRUE`,
          ),
        )
        .limit(pageSize)
        .offset(offset);

      return { publisher: localPublisher.name, books };
    }

    const publisherDetails = await isbndb.fetchPublisherDetails(name, { page, pageSize, language });
    if (!publisherDetails.name) {
      throw new NotFound("Publisher not found");
    }

    await drizzle.insert(schema.publisher).values({ name: publisherDetails.name }).onConflictDoNothing();
    return publisherDetails;
  },

  searchAuthors: async (drizzle: DrizzleClient, query: string, page = 1, pageSize = 20) => {
    const authorsData = await isbndb.searchAuthors(query, { page, pageSize });
    const authors = authorsData.authors ?? [];
    if (authors.length === 0) {
      throw new NotFound("No authors found");
    }
    await drizzle
      .insert(schema.author)
      .values(authors.map((name: string) => ({ name })))
      .onConflictDoNothing();
    return authorsData;
  },

  searchPublishers: async (drizzle: DrizzleClient, query: string, page = 1, pageSize = 20) => {
    const publishersData = await isbndb.searchPublishers(query, { page, pageSize });
    const publishers = publishersData.publishers;
    if (publishers.length === 0) {
      throw new NotFound("No publishers found");
    }
    await drizzle
      .insert(schema.publisher)
      .values(
        publishers
          .map((p) => p.name)
          .filter((n): n is string => Boolean(n))
          .map((name) => ({ name })),
      )
      .onConflictDoNothing();
    return publishersData;
  },

  searchAll: async (
    drizzle: DrizzleClient,
    index: "books" | "authors" | "publishers",
    page = 1,
    pageSize = 20,
    filters: {
      isbn?: string;
      isbn13?: string;
      author?: string;
      text?: string;
      subject?: string;
      publisher?: string;
    } = {},
  ) => {
    const offset = (page - 1) * pageSize;
    const conditions = [sql`TRUE`];

    if (filters.isbn) conditions.push(ilike(schema.book.isbn, `%${filters.isbn}%`));
    if (filters.isbn13) conditions.push(ilike(schema.book.isbn13, `%${filters.isbn13}%`));

    if (filters.text) {
      const clauses = [
        ilike(schema.book.title, `%${filters.text}%`),
        ilike(schema.book.overview, `%${filters.text}%`),
        ilike(schema.book.synopsis, `%${filters.text}%`),
      ];
      const textSearch = or(...clauses);
      if (textSearch) {
        conditions.push(textSearch);
      }
    }

    if (filters.author) conditions.push(ilike(schema.author.name, `%${filters.author}%`));
    if (filters.subject) conditions.push(ilike(schema.subject.name, `%${filters.subject}%`));
    if (filters.publisher) conditions.push(ilike(schema.publisher.name, `%${filters.publisher}%`));

    const finalWhereClause = and(...conditions);
    switch (index) {
      case "books": {
        const books = await drizzle
          .select({
            book: schema.book,
            author: schema.author,
            publisher: schema.publisher,
            subject: schema.subject,
          })
          .from(schema.book)
          .leftJoin(schema.author, eq(schema.book.authorId, schema.author.id))
          .leftJoin(schema.publisher, eq(schema.book.publisherId, schema.publisher.id))
          .leftJoin(schema.subject, eq(schema.book.subjectId, schema.subject.id))
          .where(finalWhereClause)
          .limit(pageSize)
          .offset(offset);

        return { books };
      }

      case "authors": {
        const authors = await drizzle.query.author.findMany({
          where: (a, { ilike }) => (filters.author ? ilike(a.name, `%${filters.author}%`) : undefined),
          limit: pageSize,
          offset,
        });
        return { authors };
      }

      case "publishers": {
        const publishers = await drizzle.query.publisher.findMany({
          where: (p, { ilike }) => (filters.publisher ? ilike(p.name, `%${filters.publisher}%`) : undefined),
          limit: pageSize,
          offset,
        });
        return { publishers };
      }

      default:
        throw new BadRequest("Invalid search index");
    }
  },
};
