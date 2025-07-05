import type { DrizzleClient } from "database";
import { eq, sql, schema, ilike, and, ne } from "database";
import { NotFoundError, ConflictError, DatabaseError, ValidationError } from "../../errors.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import type { CreatePublisher, UpdatePublisher } from "./publisher.model.js";

export const PublisherService = {
  findAll: async (drizzle: DrizzleClient) => {
    try {
      const publishers = await drizzle.query.publisher.findMany({
        orderBy: [schema.publisher.name],
      });
      return ServiceResponse.success("Publishers retrieved successfully", publishers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve publishers: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findById: async (drizzle: DrizzleClient, id: string) => {
    try {
      const publisher = await drizzle.query.publisher.findFirst({
        where: eq(schema.publisher.id, id),
      });

      if (!publisher) {
        throw new NotFoundError("Publisher not found");
      }

      return ServiceResponse.success("Publisher retrieved successfully", publisher);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve publisher: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findByName: async (drizzle: DrizzleClient, name: string) => {
    try {
      const publisher = await drizzle.query.publisher.findFirst({
        where: eq(schema.publisher.name, name),
      });

      if (!publisher) {
        throw new NotFoundError("Publisher not found");
      }

      return ServiceResponse.success("Publisher retrieved successfully", publisher);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve publisher: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  search: async (drizzle: DrizzleClient, query: string, page = 1, pageSize = 20) => {
    try {
      const offset = (page - 1) * pageSize;
      const publishers = await drizzle.query.publisher.findMany({
        where: ilike(schema.publisher.name, `%${query}%`),
        limit: pageSize,
        offset,
        orderBy: [schema.publisher.name],
      });

      return ServiceResponse.success("Publishers search completed", publishers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to search publishers: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  create: async (drizzle: DrizzleClient, publisherData: CreatePublisher) => {
    try {
      if (!publisherData.name.trim()) {
        const validationError = new ValidationError("Publisher name is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      const existingPublisher = await drizzle.query.publisher.findFirst({
        where: eq(schema.publisher.name, publisherData.name.trim()),
      });

      if (existingPublisher) {
        const conflictError = new ConflictError("Publisher with this name already exists");
        return ServiceResponse.failure(
          conflictError.message,
          { name: publisherData.name },
          conflictError.statusCode,
        );
      }

      const [newPublisher] = await drizzle
        .insert(schema.publisher)
        .values({
          ...publisherData,
          name: publisherData.name.trim(),
        })
        .returning();

      return ServiceResponse.success("Publisher created successfully", newPublisher, 201);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to create publisher: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { publisherData, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },

  update: async (drizzle: DrizzleClient, id: string, publisherData: UpdatePublisher) => {
    try {
      const existingPublisher = await drizzle.query.publisher.findFirst({
        where: eq(schema.publisher.id, id),
      });

      if (!existingPublisher) {
        throw new NotFoundError("Publisher not found");
      }

      if (publisherData.name) {
        const nameConflict = await drizzle.query.publisher.findFirst({
          where: and(eq(schema.publisher.name, publisherData.name.trim()), ne(schema.publisher.id, id)),
        });

        if (nameConflict) {
          const conflictError = new ConflictError("Publisher with this name already exists");
          return ServiceResponse.failure(
            conflictError.message,
            { name: publisherData.name },
            conflictError.statusCode,
          );
        }
      }

      const updateData = {
        ...publisherData,
        ...(publisherData.name && { name: publisherData.name.trim() }),
        updatedAt: new Date(),
      };

      const [updatedPublisher] = await drizzle
        .update(schema.publisher)
        .set(updateData)
        .where(eq(schema.publisher.id, id))
        .returning();

      return ServiceResponse.success("Publisher updated successfully", updatedPublisher);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to update publisher: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { id, publisherData, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },

  delete: async (drizzle: DrizzleClient, id: string) => {
    try {
      const existingPublisher = await drizzle.query.publisher.findFirst({
        where: eq(schema.publisher.id, id),
      });

      if (!existingPublisher) {
        throw new NotFoundError("Publisher not found");
      }

      // Check if publisher has books
      const booksCount = await drizzle
        .select({ count: sql<number>`count(*)` })
        .from(schema.book)
        .where(eq(schema.book.publisherId, id));

      if (booksCount[0].count > 0) {
        const conflictError = new ConflictError("Cannot delete publisher with existing books");
        return ServiceResponse.failure(
          conflictError.message,
          { bookCount: booksCount[0].count },
          conflictError.statusCode,
        );
      }

      await drizzle.delete(schema.publisher).where(eq(schema.publisher.id, id));

      return ServiceResponse.success("Publisher deleted successfully", null);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ConflictError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to delete publisher: ${errorMessage}`);
      return ServiceResponse.failure(
        dbError.message,
        { id, originalError: errorMessage },
        dbError.statusCode,
      );
    }
  },
};
