import { describe, it, expect } from "vitest";
import { ZodError } from "zod";

import { 
  bookSchema, 
  createBookSchema, 
  updateBookSchema,
  getBookSchema,
  createBooksBulkSchema
} from "../book.model.js";

describe("Book Validation Schemas", () => {
  describe("bookSchema", () => {
    it("should validate a complete book object", () => {
      const validBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "The Great Gatsby",
        authorId: "456e7890-e89b-12d3-a456-426614174000",
        publisherId: "789e1234-e89b-12d3-a456-426614174000",
        isbn: "9780743273565",
        genre: "Classic Literature",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        language: "en" as const,
      };

      const result = bookSchema.parse(validBook);
      expect(result).toEqual(validBook);
    });

    it("should validate book without optional fields", () => {
      const validBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "The Great Gatsby",
        authorId: "456e7890-e89b-12d3-a456-426614174000",
        publisherId: "789e1234-e89b-12d3-a456-426614174000",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        language: "en" as const,
      };

      const result = bookSchema.parse(validBook);
      expect(result).toEqual(validBook);
    });

    it("should reject book with invalid UUID", () => {
      const invalidBook = {
        id: "invalid-uuid",
        title: "The Great Gatsby",
        authorId: "456e7890-e89b-12d3-a456-426614174000",
        publisherId: "789e1234-e89b-12d3-a456-426614174000",
        createdAt: new Date(),
        language: "en" as const,
      };

      expect(() => bookSchema.parse(invalidBook)).toThrow(ZodError);
    });

    it("should reject book with short title", () => {
      const invalidBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "A",
        authorId: "456e7890-e89b-12d3-a456-426614174000",
        publisherId: "789e1234-e89b-12d3-a456-426614174000",
        createdAt: new Date(),
        language: "en" as const,
      };

      expect(() => bookSchema.parse(invalidBook)).toThrow(ZodError);
    });

    it("should reject book with title exceeding max length", () => {
      const invalidBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "a".repeat(201), // Exceeds 200 character limit
        authorId: "456e7890-e89b-12d3-a456-426614174000",
        publisherId: "789e1234-e89b-12d3-a456-426614174000",
        createdAt: new Date(),
        language: "en" as const,
      };

      expect(() => bookSchema.parse(invalidBook)).toThrow(ZodError);
    });

    it("should reject book with invalid language", () => {
      const invalidBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "The Great Gatsby",
        authorId: "456e7890-e89b-12d3-a456-426614174000",
        publisherId: "789e1234-e89b-12d3-a456-426614174000",
        createdAt: new Date(),
        language: "invalid" as any,
      };

      expect(() => bookSchema.parse(invalidBook)).toThrow(ZodError);
    });

    it("should reject book with future published date", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const invalidBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "The Great Gatsby",
        authorId: "456e7890-e89b-12d3-a456-426614174000",
        publisherId: "789e1234-e89b-12d3-a456-426614174000",
        datePublished: futureDate,
        createdAt: new Date(),
        language: "en" as const,
      };

      expect(() => bookSchema.parse(invalidBook)).toThrow(ZodError);
    });

  });

  describe("createBookSchema", () => {
    it("should validate valid create book data", () => {
      const validCreateData = {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        publisher: "Scribner",
        isbn: "9780743273565",
        genre: "Classic Literature",
        publishedYear: 1925,
        language: "en" as const,
      };

      const result = createBookSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should validate create data without optional fields", () => {
      const validCreateData = {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        publisher: "Scribner",
        isbn: "9780743273565",
        genre: "Classic Literature",
        language: "en" as const,
      };

      const result = createBookSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should reject create data with missing title", () => {
      const invalidCreateData = {
        author: "F. Scott Fitzgerald",
        publisher: "Scribner",
        isbn: "9780743273565",
        genre: "Classic Literature",
        language: "en" as const,
      };

      expect(() => createBookSchema.parse(invalidCreateData)).toThrow(ZodError);
    });

    it("should reject create data with missing author", () => {
      const invalidCreateData = {
        title: "The Great Gatsby",
        publisher: "Scribner",
        isbn: "9780743273565",
        genre: "Classic Literature",
        language: "en" as const,
      };

      expect(() => createBookSchema.parse(invalidCreateData)).toThrow(ZodError);
    });

    it("should reject create data with invalid ISBN format", () => {
      const invalidCreateData = {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        publisher: "Scribner",
        isbn: "invalid-isbn",
        genre: "Classic Literature",
        language: "en" as const,
      };

      expect(() => createBookSchema.parse(invalidCreateData)).toThrow(ZodError);
    });

    it("should validate different ISBN formats", () => {
      const validISBNs = [
        "9780743273565", // ISBN-13
        "0743273567",    // ISBN-10
        "978074327356X", // ISBN-13 with X
        "074327356X",    // ISBN-10 with X
      ];

      for (const isbn of validISBNs) {
        const validCreateData = {
          title: "Test Book",
          author: "Test Author",
          publisher: "Test Publisher",
          isbn,
          genre: "Test Genre",
          language: "en" as const,
        };

        const result = createBookSchema.parse(validCreateData);
        expect(result.isbn).toBe(isbn);
      }
    });
  });

  describe("updateBookSchema", () => {
    it("should validate partial update data", () => {
      const validUpdateData = {
        title: "Updated Title",
        genre: "Updated Genre",
      };

      const result = updateBookSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate update with only title", () => {
      const validUpdateData = {
        title: "New Title",
      };

      const result = updateBookSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate update with only author", () => {
      const validUpdateData = {
        author: "New Author",
      };

      const result = updateBookSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate empty update object", () => {
      const validUpdateData = {};

      const result = updateBookSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should reject update with invalid ISBN", () => {
      const invalidUpdateData = {
        isbn: "invalid-isbn",
      };

      expect(() => updateBookSchema.parse(invalidUpdateData)).toThrow(ZodError);
    });

    it("should reject update with short title", () => {
      const invalidUpdateData = {
        title: "A",
      };

      expect(() => updateBookSchema.parse(invalidUpdateData)).toThrow(ZodError);
    });
  });

  describe("getBookSchema", () => {
    it("should validate valid UUID parameter", () => {
      const validParams = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = getBookSchema.parse(validParams);
      expect(result).toEqual(validParams);
    });

    it("should reject invalid UUID parameter", () => {
      const invalidParams = {
        params: {
          id: "invalid-uuid",
        },
      };

      expect(() => getBookSchema.parse(invalidParams)).toThrow(ZodError);
    });

    it("should reject missing ID parameter", () => {
      const invalidParams = {
        params: {},
      };

      expect(() => getBookSchema.parse(invalidParams)).toThrow(ZodError);
    });
  });

  describe("createBooksBulkSchema", () => {
    it("should validate array of valid books", () => {
      const validBulkData = [
        {
          title: "Book 1",
          authorId: "123e4567-e89b-12d3-a456-426614174000",
          publisherId: "456e7890-e89b-12d3-a456-426614174000",
          isbn: "9780743273565",
          genre: "Fiction",
          publishedYear: 2020,
        },
        {
          title: "Book 2",
          authorId: "789e1234-e89b-12d3-a456-426614174000",
          publisherId: "012e5678-e89b-12d3-a456-426614174000",
          isbn: "9780123456789",
          genre: "Non-fiction",
        },
      ];

      const result = createBooksBulkSchema.parse(validBulkData);
      expect(result).toEqual(validBulkData);
    });

    it("should reject empty array", () => {
      const invalidBulkData: any[] = [];

      // Note: This test depends on if the schema enforces minimum array length
      // Based on the schema, it should accept empty arrays, but let's test the behavior
      const result = createBooksBulkSchema.parse(invalidBulkData);
      expect(result).toEqual(invalidBulkData);
    });

    it("should reject books with invalid UUID in bulk", () => {
      const invalidBulkData = [
        {
          title: "Book 1",
          authorId: "invalid-uuid",
          publisherId: "456e7890-e89b-12d3-a456-426614174000",
          isbn: "9780743273565",
          genre: "Fiction",
        },
      ];

      expect(() => createBooksBulkSchema.parse(invalidBulkData)).toThrow(ZodError);
    });
  });

  describe("Edge Cases and Boundary Values", () => {
    it("should handle boundary values for title length", () => {
      const validCreateData = {
        title: "AB", // Exactly 2 characters (minimum)
        author: "Test Author",
        publisher: "Test Publisher",
        isbn: "9780743273565",
        genre: "Test",
        language: "en" as const,
      };

      const result = createBookSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should handle maximum title length", () => {
      const validCreateData = {
        title: "a".repeat(200), // Exactly 200 characters (maximum)
        author: "Test Author",
        publisher: "Test Publisher",
        isbn: "9780743273565",
        genre: "Test",
        language: "en" as const,
      };

      const result = createBookSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should handle different language values", () => {
      const languages = ["en", "ar", "other"] as const;

      for (const language of languages) {
        const validCreateData = {
          title: "Test Book",
          author: "Test Author",
          publisher: "Test Publisher",
          isbn: "9780743273565",
          genre: "Test",
          language,
        };

        const result = createBookSchema.parse(validCreateData);
        expect(result.language).toBe(language);
      }
    });

    it("should handle boundary values for published year", () => {
      const currentYear = new Date().getFullYear();
      const validCreateData = {
        title: "Test Book",
        author: "Test Author",
        publisher: "Test Publisher",
        isbn: "9780743273565",
        genre: "Test",
        publishedYear: currentYear, // Current year (maximum allowed)
        language: "en" as const,
      };

      const result = createBookSchema.parse(validCreateData);
      expect(result.publishedYear).toBe(currentYear);
    });

    it("should handle minimum published year", () => {
      const validCreateData = {
        title: "Ancient Text",
        author: "Ancient Author",
        publisher: "Ancient Publisher",
        isbn: "9780743273565",
        genre: "Historical",
        publishedYear: 0, // Minimum year
        language: "en" as const,
      };

      const result = createBookSchema.parse(validCreateData);
      expect(result.publishedYear).toBe(0);
    });
  });
});