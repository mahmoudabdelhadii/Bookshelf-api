import type { DrizzleClient } from "database";
import { eq, sql, schema, ilike, and, ne } from "database";
import { NotFoundError, ConflictError, DatabaseError, ValidationError } from "../../errors.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import type { CreateAuthor, UpdateAuthor } from "./author.model.js";

export const AuthorService = {
  findAll: async (drizzle: DrizzleClient) => {
    try {
      const authors = await drizzle.query.author.findMany({
        orderBy: [schema.author.name],
      });
      return ServiceResponse.success("Authors retrieved successfully", authors);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve authors: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findById: async (drizzle: DrizzleClient, id: string) => {
    try {
      const author = await drizzle.query.author.findFirst({
        where: eq(schema.author.id, id),
      });

      if (!author) {
        throw new NotFoundError("Author not found");
      }

      return ServiceResponse.success("Author retrieved successfully", author);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve author: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findByName: async (drizzle: DrizzleClient, name: string) => {
    try {
      const author = await drizzle.query.author.findFirst({
        where: eq(schema.author.name, name),
      });

      if (!author) {
        throw new NotFoundError("Author not found");
      }

      return ServiceResponse.success("Author retrieved successfully", author);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve author: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  search: async (drizzle: DrizzleClient, query: string, page = 1, pageSize = 20) => {
    try {
      const offset = (page - 1) * pageSize;
      const authors = await drizzle.query.author.findMany({
        where: ilike(schema.author.name, `%${query}%`),
        limit: pageSize,
        offset,
        orderBy: [schema.author.name],
      });

      return ServiceResponse.success("Authors search completed", authors);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to search authors: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  create: async (drizzle: DrizzleClient, authorData: CreateAuthor) => {
    try {
      if (!authorData.name.trim()) {
        const validationError = new ValidationError("Author name is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      const existingAuthor = await drizzle.query.author.findFirst({
        where: eq(schema.author.name, authorData.name.trim()),
      });

      if (existingAuthor) {
        const conflictError = new ConflictError("Author with this name already exists");
        return ServiceResponse.failure(
          conflictError.message,
          { name: authorData.name },
          conflictError.statusCode,
        );
      }

      const [newAuthor] = await drizzle
        .insert(schema.author)
        .values({
          name: authorData.name.trim(),
        })
        .returning();

      return ServiceResponse.success("Author created successfully", newAuthor, 201);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to create author: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { authorData, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },

  update: async (drizzle: DrizzleClient, id: string, authorData: UpdateAuthor) => {
    try {
      const existingAuthor = await drizzle.query.author.findFirst({
        where: eq(schema.author.id, id),
      });

      if (!existingAuthor) {
        throw new NotFoundError("Author not found");
      }

      if (authorData.name) {
        const nameConflict = await drizzle.query.author.findFirst({
          where: and(eq(schema.author.name, authorData.name.trim()), ne(schema.author.id, id)),
        });

        if (nameConflict) {
          const conflictError = new ConflictError("Author with this name already exists");
          return ServiceResponse.failure(
            conflictError.message,
            { name: authorData.name },
            conflictError.statusCode,
          );
        }
      }

      const updateData = {
        ...authorData,
        ...(authorData.name && { name: authorData.name.trim() }),
      };

      const [updatedAuthor] = await drizzle
        .update(schema.author)
        .set({ name: updateData.name })
        .where(eq(schema.author.id, id))
        .returning();

      return ServiceResponse.success("Author updated successfully", updatedAuthor);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to update author: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { id, authorData, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },

  delete: async (drizzle: DrizzleClient, id: string) => {
    try {
      const existingAuthor = await drizzle.query.author.findFirst({
        where: eq(schema.author.id, id),
      });

      if (!existingAuthor) {
        throw new NotFoundError("Author not found");
      }

      const booksCount = await drizzle
        .select({ count: sql<number>`count(*)` })
        .from(schema.book)
        .where(eq(schema.book.authorId, id));

      if (booksCount[0].count > 0) {
        const conflictError = new ConflictError("Cannot delete author with existing books");
        return ServiceResponse.failure(
          conflictError.message,
          { bookCount: booksCount[0].count },
          conflictError.statusCode,
        );
      }

      await drizzle.delete(schema.author).where(eq(schema.author.id, id));

      return ServiceResponse.success("Author deleted successfully", null);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ConflictError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to delete author: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { id, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },
};
