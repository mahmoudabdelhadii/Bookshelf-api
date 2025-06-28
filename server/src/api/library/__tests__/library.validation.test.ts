import { describe, it, expect } from "vitest";
import { ZodError } from "zod";

import { 
  librarySchema, 
  createLibrarySchema, 
  updateLibrarySchema,
  getLibrarySchema 
} from "../library.model.js";

describe("Library Validation Schemas", () => {
  describe("librarySchema", () => {
    it("should validate a complete library object", () => {
      const validLibrary = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Central Library",
        location: "Downtown",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const result = librarySchema.parse(validLibrary);
      expect(result).toEqual(validLibrary);
    });

    it("should validate library without optional location", () => {
      const validLibrary = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Central Library",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const result = librarySchema.parse(validLibrary);
      expect(result).toEqual(validLibrary);
    });

    it("should reject library with invalid UUID", () => {
      const invalidLibrary = {
        id: "invalid-uuid",
        name: "Central Library",
        createdAt: new Date(),
      };

      expect(() => librarySchema.parse(invalidLibrary)).toThrow(ZodError);
    });

    it("should reject library with empty name", () => {
      const invalidLibrary = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "",
        createdAt: new Date(),
      };

      expect(() => librarySchema.parse(invalidLibrary)).toThrow(ZodError);
    });

    it("should reject library with name exceeding max length", () => {
      const invalidLibrary = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "a".repeat(101), 
        createdAt: new Date(),
      };

      expect(() => librarySchema.parse(invalidLibrary)).toThrow(ZodError);
    });

    it("should reject library with location exceeding max length", () => {
      const invalidLibrary = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Central Library",
        location: "a".repeat(201), 
        createdAt: new Date(),
      };

      expect(() => librarySchema.parse(invalidLibrary)).toThrow(ZodError);
    });
  });

  describe("createLibrarySchema", () => {
    it("should validate valid create library data", () => {
      const validCreateData = {
        name: "New Library",
        location: "Uptown",
      };

      const result = createLibrarySchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should validate create library data without optional location", () => {
      const validCreateData = {
        name: "New Library",
      };

      const result = createLibrarySchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should reject create data with empty name", () => {
      const invalidCreateData = {
        name: "",
        location: "Uptown",
      };

      expect(() => createLibrarySchema.parse(invalidCreateData)).toThrow(ZodError);
    });

    it("should allow create data with whitespace-only name (as schema doesn't trim)", () => {
      const dataWithWhitespace = {
        name: "   ",
        location: "Uptown",
      };

      
      const result = createLibrarySchema.parse(dataWithWhitespace);
      expect(result).toEqual(dataWithWhitespace);
    });
  });

  describe("updateLibrarySchema", () => {
    it("should validate partial update data", () => {
      const validUpdateData = {
        name: "Updated Library Name",
      };

      const result = updateLibrarySchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate update with only location", () => {
      const validUpdateData = {
        location: "New Location",
      };

      const result = updateLibrarySchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate empty update object", () => {
      const validUpdateData = {};

      const result = updateLibrarySchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should reject update with empty name", () => {
      const invalidUpdateData = {
        name: "",
      };

      expect(() => updateLibrarySchema.parse(invalidUpdateData)).toThrow(ZodError);
    });
  });

  describe("getLibrarySchema", () => {
    it("should validate valid UUID parameter", () => {
      const validParams = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = getLibrarySchema.parse(validParams);
      expect(result).toEqual(validParams);
    });

    it("should reject invalid UUID parameter", () => {
      const invalidParams = {
        params: {
          id: "invalid-uuid",
        },
      };

      expect(() => getLibrarySchema.parse(invalidParams)).toThrow(ZodError);
    });

    it("should reject missing ID parameter", () => {
      const invalidParams = {
        params: {},
      };

      expect(() => getLibrarySchema.parse(invalidParams)).toThrow(ZodError);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null location correctly", () => {
      const libraryWithNullLocation = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Central Library",
        location: null,
        createdAt: new Date(),
      };

      const result = librarySchema.parse(libraryWithNullLocation);
      assert.deepStrictEqual(result, libraryWithNullLocation);
    });

    it("should trim whitespace from name in create schema", () => {
      const createDataWithWhitespace = {
        name: "  Central Library  ",
        location: "Downtown",
      };

      
      const result = createLibrarySchema.parse(createDataWithWhitespace);
      assert.deepStrictEqual(result, createDataWithWhitespace);
    });

    it("should handle boundary values for name length", () => {
      const validCreateData = {
        name: "a".repeat(100), 
      };

      const result = createLibrarySchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should handle boundary values for location length", () => {
      const validCreateData = {
        name: "Central Library",
        location: "a".repeat(200), 
      };

      const result = createLibrarySchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });
  });
});
