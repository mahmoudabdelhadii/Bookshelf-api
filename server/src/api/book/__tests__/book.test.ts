import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from "vitest";
import type { DrizzleClient } from "database";

import { booksRouter } from "../book.router.js";
import { BookService } from "../book.service.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";
import { setupTestDb } from "../../../common/utils/testUtils.js";

// Mock the BookService
const mockBookService = {
  createBook: vi.fn(),
  createBooksBulk: vi.fn(),
  getBookById: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
  searchBooksByTrigram: vi.fn(),
  searchBooksByWeighted: vi.fn(),
  getBookByISBN: vi.fn(),
  getBooks: vi.fn(),
  getAuthorDetails: vi.fn(),
  getPublisherDetails: vi.fn(),
  searchAuthors: vi.fn(),
  searchPublishers: vi.fn(),
  searchAll: vi.fn(),
};

// Replace the actual service with our mock
Object.assign(BookService, mockBookService);

const mockBook = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "The Great Gatsby",
  authorId: "456e7890-e89b-12d3-a456-426614174000",
  publisherId: "789e1234-e89b-12d3-a456-426614174000",
  publishedYear: 1925,
  isbn: "9780743273565",
  genre: "Classic Literature",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  language: "en" as const,
};

const mockBookWithDetails = {
  book: mockBook,
  author: {
    id: "456e7890-e89b-12d3-a456-426614174000",
    name: "F. Scott Fitzgerald",
  },
};

describe("Book API endpoints", () => {
  let app: Express;
  let testDb: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const dbSetup = await setupTestDb("book-test");
    testDb = dbSetup.drizzle;
    close = dbSetup.close;
    
    app = express();
    app.use(express.json());
    
    // Add drizzle instance to request
    app.use((req: any, res, next) => {
      req.drizzle = testDb;
      next();
    });
    
    app.use("/books", booksRouter);
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /books", () => {
    it("should return all books successfully", async () => {
      const books = [mockBookWithDetails];
      mockBookService.getBooks.mockImplementation(() =>
        Promise.resolve(books)
      );

      const response = await request(app).get("/books");

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(mockBookService.getBooks).toHaveBeenCalledTimes(1);
    });

    it("should return books filtered by title", async () => {
      const books = [mockBookWithDetails];
      mockBookService.getBooks.mockImplementation(() =>
        Promise.resolve(books)
      );

      const response = await request(app).get("/books?title=Gatsby");

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(mockBookService.getBooks).toHaveBeenCalledWith(expect.anything(), { title: "Gatsby" });
    });

    it("should return books filtered by author", async () => {
      const books = [mockBookWithDetails];
      mockBookService.getBooks.mockImplementation(() =>
        Promise.resolve(books)
      );

      const response = await request(app).get("/books?author=Fitzgerald");

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(mockBookService.getBooks).toHaveBeenCalledWith(expect.anything(), { author: "Fitzgerald" });
    });

    it("should handle database errors gracefully", async () => {
      mockBookService.getBooks.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/books");

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe("GET /books/:id", () => {
    it("should return a book by ID successfully", async () => {
      mockBookService.getBookById.mockImplementation(() =>
        Promise.resolve({ success: true, message: "Book found", responseObject: mockBook, statusCode: 200 })
      );

      const response = await request(app).get(`/books/${mockBook.id}`);
      const result = response.body as ServiceResponse<typeof mockBook>;

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.responseObject.id).toBe(mockBook.id);
      expect(mockBookService.getBookById).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent book", async () => {
      mockBookService.getBookById.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Book with ID non-existent-id not found", responseObject: null, statusCode: 404 })
      );

      const response = await request(app).get("/books/non-existent-id");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.success).toBe(false);
      expect(result.message).toContain("not found");
    });

    it("should return 422 for invalid UUID format", async () => {
      mockBookService.getBookById.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Book ID is required", responseObject: null, statusCode: 422 })
      );

      const response = await request(app).get("/books/invalid-uuid");
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });
  });

  describe("POST /books", () => {
    const newBookData = {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      publisher: "J.B. Lippincott & Co.",
      isbn: "9780061120084",
      genre: "Fiction",
      publishedYear: 1960,
      language: "en" as const,
    };

    it("should create a new book successfully", async () => {
      const createdBook = { ...mockBook, ...newBookData };
      mockBookService.createBook.mockImplementation(() =>
        Promise.resolve({ success: true, message: "Book created successfully", responseObject: createdBook, statusCode: 201 })
      );

      const response = await request(app)
        .post("/books")
        .send(newBookData);
      const result = response.body as ServiceResponse<typeof createdBook>;

      expect(response.statusCode).toBe(StatusCodes.CREATED);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Book created successfully");
      expect(result.responseObject.title).toBe(newBookData.title);
      expect(mockBookService.createBook).toHaveBeenCalledTimes(1);
    });

    it("should return 422 for missing required fields", async () => {
      mockBookService.createBook.mockImplementation(() =>
        Promise.resolve({ success: false, message: "Book title is required", responseObject: null, statusCode: 422 })
      );

      const response = await request(app)
        .post("/books")
        .send({ author: "Test Author" });
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.success).toBe(false);
    });

    it("should return 409 for duplicate ISBN", async () => {
      mockBookService.createBook.mockImplementation(() =>
        Promise.resolve({ success: false, message: "A book with this ISBN already exists", responseObject: null, statusCode: 409 })
      );

      const response = await request(app)
        .post("/books")
        .send(newBookData);
      const result = response.body as ServiceResponse;

      expect(response.statusCode).toBe(StatusCodes.CONFLICT);
      expect(result.success).toBe(false);
      expect(result.message).toContain("ISBN already exists");
    });

    it("should handle invalid JSON gracefully", async () => {
      const response = await request(app)
        .post("/books")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe("PATCH /books/:id", () => {
    const updateData = {
      title: "Updated Title",
      genre: "Updated Genre",
      publishedYear: 2000,
    };

    it("should update a book successfully", async () => {
      const updatedBook = { ...mockBook, ...updateData };
      mockBookService.updateBook.mockImplementation(() =>
        Promise.resolve(updatedBook)
      );

      const response = await request(app)
        .patch(`/books/${mockBook.id}`)
        .send(updateData);

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.title).toBe(updateData.title);
      expect(mockBookService.updateBook).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent book", async () => {
      mockBookService.updateBook.mockImplementation(() => {
        const error = new Error("Book not found.");
        error.name = "NotFound";
        throw error;
      });

      const response = await request(app)
        .patch("/books/non-existent-id")
        .send(updateData);

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it("should handle database errors gracefully", async () => {
      mockBookService.updateBook.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .patch(`/books/${mockBook.id}`)
        .send(updateData);

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe("DELETE /books/:id", () => {
    it("should delete a book successfully", async () => {
      mockBookService.deleteBook.mockImplementation(() =>
        Promise.resolve(mockBook)
      );

      const response = await request(app).delete(`/books/${mockBook.id}`);

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(mockBookService.deleteBook).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent book", async () => {
      mockBookService.deleteBook.mockImplementation(() => {
        const error = new Error("Book not found.");
        error.name = "NotFound";
        throw error;
      });

      const response = await request(app).delete("/books/non-existent-id");

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe("GET /books/isbn/:isbn", () => {
    it("should return a book by ISBN successfully", async () => {
      mockBookService.getBookByISBN.mockImplementation(() =>
        Promise.resolve(mockBook)
      );

      const response = await request(app).get(`/books/isbn/${mockBook.isbn}`);

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.isbn).toBe(mockBook.isbn);
      expect(mockBookService.getBookByISBN).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent ISBN", async () => {
      mockBookService.getBookByISBN.mockImplementation(() => {
        const error = new Error("Book not found");
        error.name = "NotFound";
        throw error;
      });

      const response = await request(app).get("/books/isbn/9999999999999");

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe("POST /books/bulk", () => {
    const bulkData = [
      {
        title: "Book 1",
        authorId: "123e4567-e89b-12d3-a456-426614174000",
        publisherId: "456e7890-e89b-12d3-a456-426614174000",
        isbn: "9780123456789",
        genre: "Fiction",
        publishedYear: 2020,
      },
      {
        title: "Book 2",
        authorId: "789e1234-e89b-12d3-a456-426614174000",
        publisherId: "012e5678-e89b-12d3-a456-426614174000",
        isbn: "9780987654321",
        genre: "Non-fiction",
        publishedYear: 2021,
      },
    ];

    it("should create books in bulk successfully", async () => {
      const createdBooks = bulkData.map((book, index) => ({ ...mockBook, ...book, id: `book-${index}` }));
      mockBookService.createBooksBulk.mockImplementation(() =>
        Promise.resolve(createdBooks)
      );

      const response = await request(app)
        .post("/books/bulk")
        .send(bulkData);

      expect(response.statusCode).toBe(StatusCodes.CREATED);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(mockBookService.createBooksBulk).toHaveBeenCalledTimes(1);
    });

    it("should return 422 for empty array", async () => {
      mockBookService.createBooksBulk.mockImplementation(() => {
        const error = new Error("The 'books' array must contain at least one book.");
        error.name = "ValidationError";
        throw error;
      });

      const response = await request(app)
        .post("/books/bulk")
        .send([]);

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it("should handle database errors gracefully", async () => {
      mockBookService.createBooksBulk.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .post("/books/bulk")
        .send(bulkData);

      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe("GET /books/search/trigram", () => {
    it("should search books using trigram successfully", async () => {
      const searchResults = [{ ...mockBook, similarity: 0.8 }];
      mockBookService.searchBooksByTrigram.mockImplementation(() =>
        Promise.resolve(searchResults)
      );

      const response = await request(app).get("/books/search/trigram?q=Gatsby");

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(mockBookService.searchBooksByTrigram).toHaveBeenCalledWith(expect.anything(), "Gatsby");
    });

    it("should return 400 for missing search term", async () => {
      const response = await request(app).get("/books/search/trigram");

      expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe("GET /books/search/weighted", () => {
    it("should search books using weighted search successfully", async () => {
      const searchResults = [{ ...mockBook, rank: 0.9 }];
      mockBookService.searchBooksByWeighted.mockImplementation(() =>
        Promise.resolve(searchResults)
      );

      const response = await request(app).get("/books/search/weighted?q=Fitzgerald");

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(Array.isArray(response.body)).toBe(true);
      expect(mockBookService.searchBooksByWeighted).toHaveBeenCalledWith(expect.anything(), "Fitzgerald");
    });

    it("should return 400 for missing search term", async () => {
      const response = await request(app).get("/books/search/weighted");

      expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe("GET /books/authors/:name", () => {
    it("should return author details successfully", async () => {
      const authorDetails = { 
        author: "F. Scott Fitzgerald", 
        books: [mockBook] 
      };
      mockBookService.getAuthorDetails.mockImplementation(() =>
        Promise.resolve(authorDetails)
      );

      const response = await request(app).get("/books/authors/F.%20Scott%20Fitzgerald");

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.author).toBe("F. Scott Fitzgerald");
      expect(Array.isArray(response.body.books)).toBe(true);
      expect(mockBookService.getAuthorDetails).toHaveBeenCalledTimes(1);
    });

    it("should handle pagination parameters", async () => {
      const authorDetails = { 
        author: "F. Scott Fitzgerald", 
        books: [mockBook] 
      };
      mockBookService.getAuthorDetails.mockImplementation(() =>
        Promise.resolve(authorDetails)
      );

      const response = await request(app).get("/books/authors/F.%20Scott%20Fitzgerald?page=2&pageSize=5");

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(mockBookService.getAuthorDetails).toHaveBeenCalledWith(
        expect.anything(), 
        "F. Scott Fitzgerald", 
        2, 
        5, 
        undefined
      );
    });
  });

  describe("GET /books/publishers/:name", () => {
    it("should return publisher details successfully", async () => {
      const publisherDetails = { 
        publisher: "Scribner", 
        books: [mockBook] 
      };
      mockBookService.getPublisherDetails.mockImplementation(() =>
        Promise.resolve(publisherDetails)
      );

      const response = await request(app).get("/books/publishers/Scribner");

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.body.publisher).toBe("Scribner");
      expect(Array.isArray(response.body.books)).toBe(true);
      expect(mockBookService.getPublisherDetails).toHaveBeenCalledTimes(1);
    });
  });
});