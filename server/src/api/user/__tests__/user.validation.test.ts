import { describe, it, expect } from "vitest";
import { ZodError } from "zod";

import { 
  userSchema, 
  createUserSchema, 
  updateUserSchema,
  GetUserSchema 
} from "../user.model.js";

describe("User Validation Schemas", () => {
  describe("userSchema", () => {
    it("should validate a complete user object", () => {
      const validUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        role: "user" as const,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const result = userSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it("should reject user with invalid UUID", () => {
      const invalidUser = {
        id: "invalid-uuid",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => userSchema.parse(invalidUser)).toThrow(ZodError);
    });

    it("should reject user with invalid email", () => {
      const invalidUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => userSchema.parse(invalidUser)).toThrow(ZodError);
    });

    it("should reject user with short username", () => {
      const invalidUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "j",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => userSchema.parse(invalidUser)).toThrow(ZodError);
    });

    it("should reject user with long username", () => {
      const invalidUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "a".repeat(51),
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => userSchema.parse(invalidUser)).toThrow(ZodError);
    });
  });

  describe("createUserSchema", () => {
    it("should validate valid create user data", () => {
      const validCreateData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "johndoe",
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      const result = createUserSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should reject create data with missing username", () => {
      const invalidCreateData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      expect(() => createUserSchema.parse(invalidCreateData)).toThrow(ZodError);
    });

    it("should reject create data with missing email", () => {
      const invalidCreateData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
      };

      expect(() => createUserSchema.parse(invalidCreateData)).toThrow(ZodError);
    });

    it("should reject create data with invalid email format", () => {
      const invalidCreateData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "johndoe",
        email: "not-an-email",
        firstName: "John",
        lastName: "Doe",
      };

      expect(() => createUserSchema.parse(invalidCreateData)).toThrow(ZodError);
    });
  });

  describe("updateUserSchema", () => {
    it("should validate partial update data", () => {
      const validUpdateData = {
        username: "newusername",
        email: "new.email@example.com",
      };

      const result = updateUserSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate update with only username", () => {
      const validUpdateData = {
        username: "newusername",
      };

      const result = updateUserSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate update with only email", () => {
      const validUpdateData = {
        email: "new.email@example.com",
      };

      const result = updateUserSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should validate empty update object", () => {
      const validUpdateData = {};

      const result = updateUserSchema.parse(validUpdateData);
      expect(result).toEqual(validUpdateData);
    });

    it("should reject update with invalid email", () => {
      const invalidUpdateData = {
        email: "invalid-email",
      };

      expect(() => updateUserSchema.parse(invalidUpdateData)).toThrow(ZodError);
    });

    it("should reject update with short username", () => {
      const invalidUpdateData = {
        username: "a",
      };

      expect(() => updateUserSchema.parse(invalidUpdateData)).toThrow(ZodError);
    });
  });

  describe("GetUserSchema", () => {
    it("should validate valid UUID parameter", () => {
      const validParams = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = GetUserSchema.parse(validParams);
      expect(result).toEqual(validParams);
    });

    it("should reject invalid UUID parameter", () => {
      const invalidParams = {
        params: {
          id: "invalid-uuid",
        },
      };

      expect(() => GetUserSchema.parse(invalidParams)).toThrow(ZodError);
    });

    it("should reject missing ID parameter", () => {
      const invalidParams = {
        params: {},
      };

      expect(() => GetUserSchema.parse(invalidParams)).toThrow(ZodError);
    });
  });

  describe("Edge Cases", () => {
    it("should handle boundary values for username length", () => {
      const validCreateData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "ab", 
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      const result = createUserSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should handle maximum username length", () => {
      const validCreateData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "a".repeat(50), 
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      const result = createUserSchema.parse(validCreateData);
      expect(result).toEqual(validCreateData);
    });

    it("should handle different email formats", () => {
      const validEmails = [
        "user@domain.com",
        "user.name@domain.co.uk",
        "user+tag@domain.org",
        "123@domain.net",
      ];

      for (const email of validEmails) {
        const validCreateData = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          username: "testuser",
          email,
          firstName: "John",
          lastName: "Doe",
        };

        const result = createUserSchema.parse(validCreateData);
        expect(result.email).toBe(email);
      }
    });
  });
});
