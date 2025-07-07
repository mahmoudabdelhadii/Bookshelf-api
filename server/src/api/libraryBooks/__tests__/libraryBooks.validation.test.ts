import { describe, it, expect } from "vitest";
import { ZodError } from "zod";

import { 
  libraryBookSchema, 
  libraryBookWithDetailsSchema,
  createLibraryBookSchema, 
  updateLibraryBookSchema,
  getLibraryBookSchema,
  getLibraryBooksSchema
} from "../libraryBooks.model.js";

describe("LibraryBooks Validation Schemas", () => {
  describe("libraryBookSchema", () => {
    it("should validate a complete library book object", () => {
      const validLibraryBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        shelfLocation: "A1-Top",
        condition: "Excellent",
        addedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const result = libraryBookSchema.parse(validLibraryBook);
      expect(result).toEqual(validLibraryBook);
    });

    it("should validate library book without optional fields", () => {
      const validLibraryBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        addedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const result = libraryBookSchema.parse(validLibraryBook);
      expect(result).toEqual(validLibraryBook);
    });

    it("should handle null values for optional fields", () => {
      const libraryBookWithNulls = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        shelfLocation: null,
        condition: null,
        addedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const result = libraryBookSchema.parse(libraryBookWithNulls);
      assert.deepStrictEqual(result, libraryBookWithNulls);
    });

    it("should reject library book with invalid UUID", () => {
      const invalidLibraryBook = {
        id: "invalid-uuid",
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        addedAt: new Date(),
      };

      expect(() => libraryBookSchema.parse(invalidLibraryBook)).toThrow(ZodError);
    });

    it("should reject shelf location exceeding max length", () => {
      const invalidLibraryBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        shelfLocation: "a".repeat(101), 
        addedAt: new Date(),
      };

      expect(() => libraryBookSchema.parse(invalidLibraryBook)).toThrow(ZodError);
    });

    it("should reject condition exceeding max length", () => {
      const invalidLibraryBook = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        condition: "a".repeat(51), 
        addedAt: new Date(),
      };

      expect(() => libraryBookSchema.parse(invalidLibraryBook)).toThrow(ZodError);
    });
  });

  describe("libraryBookWithDetailsSchema", () => {
    it("should validate library book with book and library details", () => {
      const validLibraryBookWithDetails = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        shelfLocation: "A1-Top",
        condition: "Excellent",
        addedAt: new Date("2024-01-01T00:00:00.000Z"),
        book: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          title: "Test Book",
          author: "Test Author",
          isbn: "9781234567890",
          genre: "Fiction",
          publishedYear: 2023,
          language: "en",
        },
        library: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Central Library",
          location: "Downtown",
        },
      };

      const result = libraryBookWithDetailsSchema.parse(validLibraryBookWithDetails);
      expect(result).toEqual(validLibraryBookWithDetails);
    });

    it("should validate with library location as undefined", () => {
      const validLibraryBookWithDetails = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        addedAt: new Date("2024-01-01T00:00:00.000Z"),
        book: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          title: "Test Book",
          author: "Test Author",
          language: "ar",
        },
        library: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Central Library",
        },
      };

      const result = libraryBookWithDetailsSchema.parse(validLibraryBookWithDetails);
      expect(result).toEqual(validLibraryBookWithDetails);
    });
  });

  describe("createLibraryBookSchema", () => {
    it("should validate valid create library book data", () => {
      const validCreateData = {
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        shelfLocation: "B2-Middle",
        condition: "Good",
      };

      const result = createLibraryBookSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should validate create data without optional fields", () => {
      const validCreateData = {
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = createLibraryBookSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should reject create data with invalid library UUID", () => {
      const invalidCreateData = {
        libraryId: "invalid-uuid",
        bookId: "book-123e4567-e89b-12d3-a456-426614174000",
      };

      expect(() => createLibraryBookSchema.parse(invalidCreateData)).toThrow(ZodError);
    });

    it("should reject create data with missing required fields", () => {
      const invalidCreateData = {
        libraryId: "lib-123e4567-e89b-12d3-a456-426614174000",
        
      };

      expect(() => createLibraryBookSchema.parse(invalidCreateData)).toThrow(ZodError);
    });
  });

  describe("updateLibraryBookSchema", () => {
    it("should validate update with both optional fields", () => {
      const validUpdateData = {
        shelfLocation: "C3-Bottom",
        condition: "Fair",
      };

      const result = updateLibraryBookSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate update with only shelf location", () => {
      const validUpdateData = {
        shelfLocation: "D4-Top",
      };

      const result = updateLibraryBookSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate update with only condition", () => {
      const validUpdateData = {
        condition: "Poor",
      };

      const result = updateLibraryBookSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate empty update object", () => {
      const validUpdateData = {};

      const result = updateLibraryBookSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should reject update with shelf location exceeding max length", () => {
      const invalidUpdateData = {
        shelfLocation: "a".repeat(101),
      };

      expect(() => updateLibraryBookSchema.parse(invalidUpdateData)).toThrow(ZodError);
    });
  });

  describe("getLibraryBookSchema", () => {
    it("should validate valid UUID parameter", () => {
      const validParams = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = getLibraryBookSchema.parse(validParams);
      expect(result).toEqual(validParams);
    });

    it("should reject invalid UUID parameter", () => {
      const invalidParams = {
        params: {
          id: "invalid-uuid",
        },
      };

      expect(() => getLibraryBookSchema.parse(invalidParams)).toThrow(ZodError);
    });
  });

  describe("getLibraryBooksSchema", () => {
    it("should validate valid library ID parameter", () => {
      const validParams = {
        params: {
          libraryId: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = getLibraryBooksSchema.parse(validParams);
      expect(result).toEqual(validParams);
    });

    it("should reject invalid library UUID parameter", () => {
      const invalidParams = {
        params: {
          libraryId: "invalid-uuid",
        },
      };

      expect(() => getLibraryBooksSchema.parse(invalidParams)).toThrow(ZodError);
    });
  });

  describe("Edge Cases and Boundary Values", () => {
    it("should handle boundary values for shelf location length", () => {
      const validCreateData = {
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        shelfLocation: "a".repeat(100), 
      };

      const result = createLibraryBookSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should handle boundary values for condition length", () => {
      const validCreateData = {
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        condition: "a".repeat(50), 
      };

      const result = createLibraryBookSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should handle different language values in book details", () => {
      const validLibraryBookWithDetails = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        libraryId: "123e4567-e89b-12d3-a456-426614174000",
        bookId: "123e4567-e89b-12d3-a456-426614174000",
        addedAt: new Date("2024-01-01T00:00:00.000Z"),
        book: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          title: "كتاب عربي",
          author: "مؤلف عربي",
          language: "ar",
        },
        library: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "المكتبة المركزية",
        },
      };

      const result = libraryBookWithDetailsSchema.parse(validLibraryBookWithDetails);
      expect(result).toEqual(validLibraryBookWithDetails);
    });
  });
});
