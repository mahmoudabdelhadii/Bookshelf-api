import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { libraryBooksRouter } from "../libraryBooks.router.js";
import { LibraryBooksService } from "../libraryBooks.service.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import type { LibraryBook, CreateLibraryBook, UpdateLibraryBook } from "../libraryBooks.model.js";
import { setupTestDb } from "database/test-utils";

const mockLibraryBooksService = {
  findByLibraryId: vi.fn(),
  findById: vi.fn(),
  addBookToLibrary: vi.fn(),
  updateLibraryBook: vi.fn(),
  removeBookFromLibrary: vi.fn(),
  findAllLibraryBooks: vi.fn(),
};

Object.assign(LibraryBooksService, mockLibraryBooksService);

const mockLibraryBook: LibraryBook = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  libraryId: "123e4567-e89b-12d3-a456-426614174000",
  bookId: "123e4567-e89b-12d3-a456-426614174000",
  shelfLocation: "A1-Top",
  condition: "Excellent",
  addedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockLibraryBookWithDetails = {
  ...mockLibraryBook,
  book: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Test Book",
    author: "Test Author",
    isbn: "9781234567890",
    genre: "Fiction",
    publishedYear: 2023,
    language: "en" as const,
  },
  library: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Central Library",
    location: "Downtown",
  },
};

describe("LibraryBooks API endpoints", () => {
  let app: Express;
  let testDb: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const dbSetup = await setupTestDb("library-books-test");
    testDb = dbSetup.drizzle;
    close = dbSetup.close;

    app = express();
    app.use(express.json());

    app.use((req: any, res, next) => {
      req.drizzle = testDb;
      next();
    });

    app.use("/library-books", libraryBooksRouter);
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /library-books", () => {
    it("should return all library books successfully", async () => {
      const libraryBooks = [mockLibraryBookWithDetails];
      mockLibraryBooksService.findAllLibraryBooks.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "All library books found",
          responseObject: libraryBooks,
          statusCode: 200,
        }),
      );

      const response = await request(app).get("/library-books");
      const result = response.body as ServiceResponse<typeof libraryBooks>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.message).toBe("All library books found");
      expect(Array.isArray(result.responseObject)).toBe(true);
      expect(result.responseObject.length).toBe(1);
      expect(mockLibraryBooksService.findAllLibraryBooks).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /libraries/:libraryId/books", () => {
    it("should return books for a specific library successfully", async () => {
      const libraryBooks = [mockLibraryBookWithDetails];
      mockLibraryBooksService.findByLibraryId.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "Library books found",
          responseObject: libraryBooks,
          statusCode: 200,
        }),
      );

      const response = await request(app).get(`/libraries/${mockLibraryBook.libraryId}/books`);
      const result = response.body as ServiceResponse<typeof libraryBooks>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Library books found");
      expect(Array.isArray(result.responseObject)).toBe(true);
      expect(mockLibraryBooksService.findByLibraryId).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent library", async () => {
      mockLibraryBooksService.findByLibraryId.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Library not found",
          responseObject: null,
          statusCode: 404,
        }),
      );

      const response = await request(app).get("/libraries/non-existent-library/books");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Library not found");
    });

    it("should return 422 for invalid library ID", async () => {
      mockLibraryBooksService.findByLibraryId.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Library ID is required",
          responseObject: null,
          statusCode: 422,
        }),
      );

      const response = await request(app).get("/libraries");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });
  });

  describe("GET /library-books/:id", () => {
    it("should return a library book entry by ID successfully", async () => {
      mockLibraryBooksService.findById.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "Library book found",
          responseObject: mockLibraryBookWithDetails,
          statusCode: 200,
        }),
      );

      const response = await request(app).get(`/library-books/${mockLibraryBook.id}`);
      const result = response.body as ServiceResponse<typeof mockLibraryBookWithDetails>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.responseObject.id).toBe(mockLibraryBook.id);
      expect(mockLibraryBooksService.findById).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent library book entry", async () => {
      mockLibraryBooksService.findById.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Library book entry not found",
          responseObject: null,
          statusCode: 404,
        }),
      );

      const response = await request(app).get("/library-books/non-existent-id");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
    });
  });

  describe("POST /library-books", () => {
    const createLibraryBookData: CreateLibraryBook = {
      libraryId: "123e4567-e89b-12d3-a456-426614174000",
      bookId: "123e4567-e89b-12d3-a456-426614174000",
      shelfLocation: "B2-Middle",
      condition: "Good",
    };

    it("should add a book to library successfully", async () => {
      mockLibraryBooksService.addBookToLibrary.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "Book added to library successfully",
          responseObject: mockLibraryBook,
          statusCode: 201,
        }),
      );

      const response = await request(app).post("/library-books").send(createLibraryBookData);
      const result = response.body as ServiceResponse<LibraryBook>;

      expect(response.statusCode).toBe(StatusCodes.CREATED);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Book added to library successfully");
      expect(result.responseObject.libraryId).toBe(createLibraryBookData.libraryId);
      expect(result.responseObject.bookId).toBe(createLibraryBookData.bookId);
      expect(mockLibraryBooksService.addBookToLibrary).toHaveBeenCalledTimes(1);
    });

    it("should return 422 for missing required fields", async () => {
      mockLibraryBooksService.addBookToLibrary.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Library ID is required",
          responseObject: null,
          statusCode: 422,
        }),
      );

      const response = await request(app).post("/library-books").send({ bookId: "some-book-id" });
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });

    it("should return 404 for non-existent library", async () => {
      mockLibraryBooksService.addBookToLibrary.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Library not found",
          responseObject: null,
          statusCode: 404,
        }),
      );

      const response = await request(app).post("/library-books").send(createLibraryBookData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Library not found");
    });

    it("should return 404 for non-existent book", async () => {
      mockLibraryBooksService.addBookToLibrary.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Book not found", responseObject: null, statusCode: 404 }),
      );

      const response = await request(app).post("/library-books").send(createLibraryBookData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Book not found");
    });

    it("should return 409 for duplicate book in library", async () => {
      mockLibraryBooksService.addBookToLibrary.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Book is already in this library",
          responseObject: null,
          statusCode: 409,
        }),
      );

      const response = await request(app).post("/library-books").send(createLibraryBookData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.CONFLICT);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Book is already in this library");
    });
  });

  describe("PATCH /library-books/:id", () => {
    const updateData: UpdateLibraryBook = {
      shelfLocation: "C3-Bottom",
      condition: "Fair",
    };

    it("should update library book details successfully", async () => {
      const updatedLibraryBook = { ...mockLibraryBook, ...updateData };
      mockLibraryBooksService.updateLibraryBook.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "Library book updated successfully",
          responseObject: updatedLibraryBook,
          statusCode: 200,
        }),
      );

      const response = await request(app).patch(`/library-books/${mockLibraryBook.id}`).send(updateData);
      const result = response.body as ServiceResponse<LibraryBook>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.responseObject.shelfLocation).toBe(updateData.shelfLocation);
      expect(result.responseObject.condition).toBe(updateData.condition);
      expect(mockLibraryBooksService.updateLibraryBook).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent library book entry", async () => {
      mockLibraryBooksService.updateLibraryBook.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Library book entry not found",
          responseObject: null,
          statusCode: 404,
        }),
      );

      const response = await request(app).patch("/library-books/non-existent-id").send(updateData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
    });
  });

  describe("DELETE /library-books/:id", () => {
    it("should remove book from library successfully", async () => {
      mockLibraryBooksService.removeBookFromLibrary.mockImplementation(() =>
        Promise.resolve({
          success: true,
          message: "Book removed from library successfully",
          responseObject: null,
          statusCode: 204,
        }),
      );

      const response = await request(app).delete(`/library-books/${mockLibraryBook.id}`);

      expect(response.statusCode).toBe(StatusCodes.NO_CONTENT);
      expect(mockLibraryBooksService.removeBookFromLibrary).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent library book entry", async () => {
      mockLibraryBooksService.removeBookFromLibrary.mockImplementation(() =>
        Promise.resolve({
          success: false,
          message: "Library book entry not found",
          responseObject: null,
          statusCode: 404,
        }),
      );

      const response = await request(app).delete("/library-books/non-existent-id");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
    });
  });
});
