import type { DrizzleClient } from "database";
import { eq, sql, schema } from "database";
import {
  BadRequest,
  NotFound,
  ResourceAlreadyExistsError,
  DatabaseError,
  ValidationError,
} from "../../errors.js";

export class BookService {
  static async createBook(
    drizzle: DrizzleClient,
    bookData: {
      title: string;
      author: string;
      isbn?: string;
      genre?: string;
      publishedYear?: number;
    }
  ) {
    
    if (!bookData.title || !bookData.author) {
      throw new ValidationError("Title and author are required fields.", { bookData });
    }

    
    if (bookData.isbn) {
      const existing = await drizzle.query.book.findFirst({
        where: (books, { eq }) => eq(books.isbn, bookData.isbn!),
      });
      if (existing) {
        throw new ResourceAlreadyExistsError(
          "A book with the provided ISBN already exists.",
          { isbn: bookData.isbn }
        );
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
    }[]
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
    console.log(book)
    return book;
  }

  static async getBooks(
    drizzle: DrizzleClient,
    {
      title,
      isbn,
      author,
      genre,
      publishedYear,
    }: {
      title?: string;
      isbn?: string;
      author?: string;
      genre?: string;
      publishedYear?: number;
    } = {}
  ) {
    try {
      return await drizzle.query.book.findMany({
        where: (b, { and, eq, ilike }) => {
          const conditions = [];
          if (title) conditions.push(ilike(b.title, `%${title}%`)); // Trigram index supports ILIKE for partial matches
          if (isbn) conditions.push(eq(b.isbn, isbn));
          if (author) conditions.push(ilike(b.author, `%${author}%`));
          if (genre) conditions.push(ilike(b.genre, `%${genre}%`));
          if (publishedYear) conditions.push(eq(b.publishedYear, publishedYear));
  
          return conditions.length > 0 ? and(...conditions) : undefined;
        },
        limit: 50,
      });
    } catch (err) {
      throw new DatabaseError("Error fetching books.", { originalError: err });
    }
  }

  static async searchBooksBySimilarity(drizzle: DrizzleClient, searchTerm: string) {
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
        `
      );
      return result.rows;
    } catch (err) {
      throw new DatabaseError("Error executing similarity search.", { searchTerm, originalError: err });
    }
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
    }>
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
  static async searchBooks(
    drizzle: DrizzleClient,
    searchTerm: string
  ): Promise<any[]> {
    if (!searchTerm) {
      throw new BadRequest("Search term is required.");
    }
  
    try {
      const result = await drizzle.execute(
        sql`
          SELECT *,
            ts_rank_cd(
              setweight(to_tsvector('english', title), 'A') ||
              setweight(to_tsvector('arabic', title), 'A'),
              plainto_tsquery(${searchTerm})
            ) AS rank,
            similarity(title, ${searchTerm}) AS trigram_similarity
          FROM ${schema.book}
          WHERE
            (
              to_tsvector('english', title) ||
              to_tsvector('arabic', title)
            ) @@ plainto_tsquery(${searchTerm}) OR
            title % ${searchTerm}
          ORDER BY rank DESC, trigram_similarity DESC
          LIMIT 50
        `
      );
      return result.rows;
    } catch (err) {
      throw new DatabaseError("Error executing combined search.", {
        searchTerm,
        originalError: err,
      });
    }
  }
  
  static async searchBooksWeighted(
    drizzle: DrizzleClient,
    searchTerm: string
  ): Promise<any[]> {
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
        `
      );
      return result.rows;
    } catch (err) {
      throw new DatabaseError("Error executing weighted search.", {
        searchTerm,
        originalError: err,
      });
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
}