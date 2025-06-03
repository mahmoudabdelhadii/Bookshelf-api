import type { DrizzleClient } from "database";
import { eq, schema } from "database";
import {
  ValidationError,
  ResourceAlreadyExistsError,
  NotFound,
  DatabaseError,
  BadRequest,
} from "../../errors.js";

export const UserService = {
  async createUser(
    drizzle: DrizzleClient,
    {
      id,
      username,
      email,
      firstName,
      lastName,
    }: {
      id: string;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    },
  ) {
    if (!id || !username || !email) {
      throw new ValidationError("ID, username, and email are required fields.");
    }

    const existingByEmail = await drizzle.query.user.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });
    if (existingByEmail) {
      throw new ResourceAlreadyExistsError("Email already in use.", { email });
    }

    const existingByUsername = await drizzle.query.user.findFirst({
      where: (u, { eq }) => eq(u.username, username),
    });
    if (existingByUsername) {
      throw new ResourceAlreadyExistsError("Username already in use.", { username });
    }

    try {
      const [newUser] = await drizzle
        .insert(schema.user)
        .values({ username, email, firstName, lastName })
        .returning();
      return newUser;
    } catch (err) {
      throw new DatabaseError("Failed to create user.", { originalError: err });
    }
  },

  async findAll(drizzle: DrizzleClient, limit = 50) {
    try {
      return await drizzle.query.user.findMany({ limit });
    } catch (err) {
      throw new DatabaseError("Failed to fetch users.", { originalError: err });
    }
  },

  async findById(drizzle: DrizzleClient, id: string) {
    try {
      const user = await drizzle.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, id),
      });
      if (user === undefined) {
        throw new NotFound("User not found.", { userId: id });
      }
      return user;
    } catch (err) {
      throw new DatabaseError("Failed to fetch user by ID.", { userId: id, originalError: err });
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
    if (!id) {
      throw new BadRequest("User ID is required.");
    }

    if (updates.email) {
      const email = updates.email;
      const existingByEmail = await drizzle.query.user.findFirst({
        where: (u, { eq }) => eq(u.email, email),
      });
      if (existingByEmail?.id !== undefined && existingByEmail.id !== id) {
        throw new ResourceAlreadyExistsError("Email already in use.", { email });
      }
    }

    if (updates.username) {
      const username = updates.username;
      const existingByUsername = await drizzle.query.user.findFirst({
        where: (u, { eq }) => eq(u.username, username),
      });
      if (existingByUsername?.id !== undefined && existingByUsername.id !== id) {
        throw new ResourceAlreadyExistsError("Username already in use.", { username });
      }
    }

    try {
      const updatedUsers = await drizzle
        .update(schema.user)
        .set(updates)
        .where(eq(schema.user.id, id))
        .returning();

      if (updatedUsers.length === 0) {
        throw new NotFound("User not found.", { userId: id });
      }
      const [updatedUser] = updatedUsers;

      return updatedUser;
    } catch (err) {
      throw new DatabaseError("Failed to update user.", { userId: id, originalError: err });
    }
  },

  async deleteUser(drizzle: DrizzleClient, id: string) {
    if (!id) {
      throw new BadRequest("User ID is required.");
    }

    try {
      const deletedUsers = await drizzle.delete(schema.user).where(eq(schema.user.id, id)).returning();
      if (deletedUsers.length === 0) {
        throw new NotFound("User not found.", { userId: id });
      }
      const [deletedUser] = deletedUsers;
      return deletedUser;
    } catch (err) {
      throw new DatabaseError("Failed to delete user.", { userId: id, originalError: err });
    }
  },
} as const;
