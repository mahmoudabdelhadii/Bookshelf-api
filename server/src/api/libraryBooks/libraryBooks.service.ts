import type { DrizzleClient } from "database";
import { eq, schema } from "database";
import type { LibraryBook, CreateLibraryBook, UpdateLibraryBook } from "./libraryBooks.model.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import { DatabaseError, NotFound, ValidationError, ResourceAlreadyExistsError } from "../../errors.js";

export const LibraryBooksService = {
  findByLibraryId: async (
    drizzle: DrizzleClient,
    libraryId: string,
  ): Promise<ServiceResponse<LibraryBook[] | null>> => {
    if (!libraryId.trim()) {
      const validationError = new ValidationError("Library ID is required");
      return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
    }

    try {
      const library = await drizzle.query.library.findFirst({
        where: (libraries, { eq }) => eq(libraries.id, libraryId),
      });

      if (!library) {
        const notFoundError = new NotFound("Library not found", { libraryId });
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }

      const libraryBooks = await drizzle.query.libraryBooks.findMany({
        where: (libraryBooks, { eq }) => eq(libraryBooks.libraryId, libraryId),
        with: {
          book: true,
          library: true,
        },
        orderBy: (libraryBooks, { desc }) => [desc(libraryBooks.addedAt)],
      });
      return ServiceResponse.success("Library books found", libraryBooks);
    } catch (err) {
      const dbError = new DatabaseError("Failed to retrieve library books", {
        libraryId,
        originalError: err,
      });
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findById: async (drizzle: DrizzleClient, id: string): Promise<ServiceResponse<LibraryBook | null>> => {
    try {
      const libraryBook = await drizzle.query.libraryBooks.findFirst({
        where: (libraryBooks, { eq }) => eq(libraryBooks.id, id),
        with: {
          book: true,
          library: true,
        },
      });
      if (!libraryBook) {
        return ServiceResponse.failure("Library book entry not found", null, 404);
      }
      return ServiceResponse.success("Library book found", libraryBook);
    } catch (err) {
      return ServiceResponse.failure("An error occurred while finding library book.", null, 500);
    }
  },

  addBookToLibrary: async (
    drizzle: DrizzleClient,
    libraryBookData: CreateLibraryBook,
  ): Promise<ServiceResponse<LibraryBook | null>> => {
    if (!libraryBookData.libraryId.trim()) {
      const validationError = new ValidationError("Library ID is required");
      return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
    }

    if (!libraryBookData.bookId.trim()) {
      const validationError = new ValidationError("Book ID is required");
      return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
    }

    try {
      const library = await drizzle.query.library.findFirst({
        where: (libraries, { eq }) => eq(libraries.id, libraryBookData.libraryId),
      });
      if (!library) {
        const notFoundError = new NotFound("Library not found", { libraryId: libraryBookData.libraryId });
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }

      const book = await drizzle.query.book.findFirst({
        where: (books, { eq }) => eq(books.id, libraryBookData.bookId),
      });
      if (!book) {
        const notFoundError = new NotFound("Book not found", { bookId: libraryBookData.bookId });
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }

      const existingEntry = await drizzle.query.libraryBooks.findFirst({
        where: (libraryBooks, { and, eq }) =>
          and(
            eq(libraryBooks.libraryId, libraryBookData.libraryId),
            eq(libraryBooks.bookId, libraryBookData.bookId),
          ),
      });
      if (existingEntry) {
        const conflictError = new ResourceAlreadyExistsError("Book is already in this library", {
          libraryId: libraryBookData.libraryId,
          bookId: libraryBookData.bookId,
          libraryName: library.name,
          bookTitle: book.title,
        });
        return ServiceResponse.failure(conflictError.message, null, conflictError.statusCode);
      }

      const [newLibraryBook] = await drizzle.insert(schema.libraryBooks).values(libraryBookData).returning();
      return ServiceResponse.success("Book added to library successfully", newLibraryBook, 201);
    } catch (err) {
      const dbError = new DatabaseError("Failed to add book to library", {
        libraryBookData,
        originalError: err,
      });
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  updateLibraryBook: async (
    drizzle: DrizzleClient,
    id: string,
    libraryBookData: UpdateLibraryBook,
  ): Promise<ServiceResponse<LibraryBook | null>> => {
    try {
      const existingLibraryBook = await drizzle.query.libraryBooks.findFirst({
        where: (libraryBooks, { eq }) => eq(libraryBooks.id, id),
      });

      if (!existingLibraryBook) {
        return ServiceResponse.failure("Library book entry not found", null, 404);
      }

      const [updatedLibraryBook] = await drizzle
        .update(schema.libraryBooks)
        .set(libraryBookData)
        .where(eq(schema.libraryBooks.id, id))
        .returning();

      return ServiceResponse.success("Library book updated successfully", updatedLibraryBook);
    } catch (err) {
      const errorMessage = `Error updating library book with id ${id}: ${(err as Error).message}`;
      return ServiceResponse.failure("An error occurred while updating library book.", null, 500);
    }
  },

  removeBookFromLibrary: async (drizzle: DrizzleClient, id: string): Promise<ServiceResponse> => {
    try {
      const existingLibraryBook = await drizzle.query.libraryBooks.findFirst({
        where: (libraryBooks, { eq }) => eq(libraryBooks.id, id),
      });

      if (!existingLibraryBook) {
        return ServiceResponse.failure("Library book entry not found", null, 404);
      }

      await drizzle.delete(schema.libraryBooks).where(eq(schema.libraryBooks.id, id));
      return ServiceResponse.success("Book removed from library successfully", null, 204);
    } catch (err) {
      const errorMessage = `Error removing book from library with id ${id}: ${(err as Error).message}`;
      return ServiceResponse.failure("An error occurred while removing book from library.", null, 500);
    }
  },

  findAllLibraryBooks: async (drizzle: DrizzleClient): Promise<ServiceResponse<any[] | null>> => {
    try {
      const libraryBooks = await drizzle.query.libraryBooks.findMany({
        with: {
          book: true,
          library: true,
        },
        orderBy: (libraryBooks, { desc }) => [desc(libraryBooks.addedAt)],
      });
      return ServiceResponse.success("All library books found", libraryBooks);
    } catch (err) {
      const errorMessage = `Error finding all library books: ${(err as Error).message}`;
      return ServiceResponse.failure("An error occurred while retrieving library books.", null, 500);
    }
  },
};
