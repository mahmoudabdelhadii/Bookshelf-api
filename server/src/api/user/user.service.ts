import type { DrizzleClient } from "database";
import { eq, schema } from "database";
import { ValidationError, NotFoundError, DatabaseError, ConflictError } from "../../errors.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import type { User, CreateUser } from "./user.model.js";

export const UserService = {
  async createUser(drizzle: DrizzleClient, userData: CreateUser) {
    try {
      if (!userData.username.trim()) {
        const validationError = new ValidationError("Username is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }
      if (!userData.email.trim()) {
        const validationError = new ValidationError("Email is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      const existingByEmail = await drizzle.query.user.findFirst({
        where: (u, { eq }) => eq(u.email, userData.email),
      });
      if (existingByEmail) {
        const conflictError = new ConflictError("User with this email already exists");
        return ServiceResponse.failure(
          conflictError.message,
          { email: userData.email },
          conflictError.statusCode,
        );
      }

      const existingByUsername = await drizzle.query.user.findFirst({
        where: (u, { eq }) => eq(u.username, userData.username),
      });
      if (existingByUsername) {
        const conflictError = new ConflictError("User with this username already exists");
        return ServiceResponse.failure(
          conflictError.message,
          { username: userData.username },
          conflictError.statusCode,
        );
      }

      const [newUser] = await drizzle.insert(schema.user).values(userData).returning();

      return ServiceResponse.success("User created successfully", newUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to create user: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  async findAll(drizzle: DrizzleClient, limit = 50) {
    try {
      const users = await drizzle.query.user.findMany({ limit });
      return ServiceResponse.success("Users retrieved successfully", users);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to fetch users: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { originalError: errorMessage }, dbError.statusCode);
    }
  },

  async findById(
    drizzle: DrizzleClient,
    id: string,
  ): Promise<ServiceResponse<User | null | Record<string, unknown>>> {
    try {
      if (!id.trim()) {
        const validationError = new ValidationError("User ID is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      const user = await drizzle.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, id),
      });

      if (!user) {
        const notFoundError = new NotFoundError("User", id);
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }

      return ServiceResponse.success("User found", user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to fetch user: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { userId: id, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },

  async updateUser(
    drizzle: DrizzleClient,
    id: string,
    updates: {
      username?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
    },
  ) {
    try {
      if (!id.trim()) {
        const validationError = new ValidationError("User ID is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      const hasUpdates = Object.values(updates).some((value) => value !== undefined && value !== null);
      if (!hasUpdates) {
        const validationError = new ValidationError("At least one field must be provided for update");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      if (updates.email?.trim()) {
        const existingByEmail = await drizzle.query.user.findFirst({
          where: (u, { eq }) => eq(u.email, updates.email!),
        });
        if (existingByEmail && existingByEmail.id !== id) {
          const conflictError = new ConflictError("User with this email already exists");
          return ServiceResponse.failure(
            conflictError.message,
            { email: updates.email },
            conflictError.statusCode,
          );
        }
      }

      if (updates.username?.trim()) {
        const existingByUsername = await drizzle.query.user.findFirst({
          where: (u, { eq }) => eq(u.username, updates.username!),
        });
        if (existingByUsername && existingByUsername.id !== id) {
          const conflictError = new ConflictError("User with this username already exists");
          return ServiceResponse.failure(
            conflictError.message,
            { username: updates.username },
            conflictError.statusCode,
          );
        }
      }

      const updatedUsers = await drizzle
        .update(schema.user)
        .set(updates)
        .where(eq(schema.user.id, id))
        .returning();

      if (updatedUsers.length === 0) {
        const notFoundError = new NotFoundError("User", id);
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }

      const [updatedUser] = updatedUsers;
      return ServiceResponse.success("User updated successfully", updatedUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to update user: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { userId: id, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },

  async deleteUser(drizzle: DrizzleClient, id: string) {
    try {
      if (!id.trim()) {
        const validationError = new ValidationError("User ID is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      const deletedUsers = await drizzle.delete(schema.user).where(eq(schema.user.id, id)).returning();

      if (deletedUsers.length === 0) {
        const notFoundError = new NotFoundError("User", id);
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }

      return ServiceResponse.success("User deleted successfully", null, 204);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to delete user: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { userId: id, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },
} as const;
