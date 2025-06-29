import type { DrizzleClient } from "database";
import { schema, eq } from "database";
import type { Library, CreateLibrary, UpdateLibrary } from "./library.model.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import { DatabaseError, NotFound, ValidationError, ResourceAlreadyExistsError } from "../../errors.js";

export const LibraryService = {
  findAll: async (drizzle: DrizzleClient): Promise<ServiceResponse<Library[] | null>> => {
    try {
      const libraries = await drizzle.query.library.findMany({
        orderBy: (libraries, { desc }) => [desc(libraries.createdAt)],
      });
      return ServiceResponse.success("Libraries found", libraries);
    } catch (err) {
      const dbError = new DatabaseError("Failed to retrieve libraries", { originalError: err });
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findById: async (drizzle: DrizzleClient, id: string): Promise<ServiceResponse<Library | null>> => {
    if (!id.trim()) {
      const validationError = new ValidationError("Library ID is required");
      return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
    }

    try {
      const library = await drizzle.query.library.findFirst({
        where: (libraries, { eq }) => eq(libraries.id, id),
      });
      if (!library) {
        const notFoundError = new NotFound("Library not found", { libraryId: id });
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }
      return ServiceResponse.success("Library found", library);
    } catch (err) {
      const dbError = new DatabaseError("Failed to retrieve library", {
        libraryId: id,
        originalError: err,
      });
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  create: async (
    drizzle: DrizzleClient,
    libraryData: CreateLibrary,
    ownerId: string,
  ): Promise<ServiceResponse<Library | null>> => {
    if (!libraryData.name.trim()) {
      const validationError = new ValidationError("Library name is required");
      return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
    }

    try {
      const existingLibrary = await drizzle.query.library.findFirst({
        where: (libraries, { eq }) => eq(libraries.name, libraryData.name.trim()),
      });

      if (existingLibrary) {
        const conflictError = new ResourceAlreadyExistsError("Library with this name already exists", {
          libraryName: libraryData.name,
        });
        return ServiceResponse.failure(conflictError.message, null, conflictError.statusCode);
      }

      const [newLibrary] = await drizzle
        .insert(schema.library)
        .values({
          ...libraryData,
          name: libraryData.name.trim(),
          ownerId,
        })
        .returning();

      return ServiceResponse.success("Library created successfully", newLibrary, 201);
    } catch (err) {
      const dbError = new DatabaseError("Failed to create library", { libraryData, originalError: err });
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  update: async (
    drizzle: DrizzleClient,
    id: string,
    libraryData: UpdateLibrary,
  ): Promise<ServiceResponse<Library | null>> => {
    if (!id.trim()) {
      const validationError = new ValidationError("Library ID is required");
      return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
    }

    if (Object.keys(libraryData).length === 0) {
      const validationError = new ValidationError("At least one field must be provided for update");
      return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
    }

    try {
      const existingLibrary = await drizzle.query.library.findFirst({
        where: (libraries, { eq }) => eq(libraries.id, id),
      });

      if (!existingLibrary) {
        const notFoundError = new NotFound("Library not found", { libraryId: id });
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }
      const libraryName = libraryData.name;
      if (libraryName) {
        const nameConflict = await drizzle.query.library.findFirst({
          where: (libraries, { and, eq, ne }) =>
            and(eq(libraries.name, libraryName.trim()), ne(libraries.id, id)),
        });

        if (nameConflict) {
          const conflictError = new ResourceAlreadyExistsError("Library with this name already exists", {
            libraryName: libraryData.name,
          });
          return ServiceResponse.failure(conflictError.message, null, conflictError.statusCode);
        }
      }

      const updateData = {
        ...libraryData,
        ...(libraryData.name && { name: libraryData.name.trim() }),
      };

      const [updatedLibrary] = await drizzle
        .update(schema.library)
        .set(updateData)
        .where(eq(schema.library.id, id))
        .returning();

      return ServiceResponse.success("Library updated successfully", updatedLibrary);
    } catch (err) {
      const dbError = new DatabaseError("Failed to update library", {
        libraryId: id,
        updateData: libraryData,
        originalError: err,
      });
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  delete: async (drizzle: DrizzleClient, id: string): Promise<ServiceResponse> => {
    if (!id.trim()) {
      const validationError = new ValidationError("Library ID is required");
      return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
    }

    try {
      const existingLibrary = await drizzle.query.library.findFirst({
        where: (libraries, { eq }) => eq(libraries.id, id),
      });

      if (!existingLibrary) {
        const notFoundError = new NotFound("Library not found", { libraryId: id });
        return ServiceResponse.failure(notFoundError.message, null, notFoundError.statusCode);
      }

      const associatedBooks = await drizzle.query.libraryBooks.findFirst({
        where: (libraryBooks, { eq }) => eq(libraryBooks.libraryId, id),
      });

      if (associatedBooks) {
        const conflictError = new ValidationError(
          "Cannot delete library that contains books. Please remove all books first.",
          {
            libraryId: id,
            libraryName: existingLibrary.name,
          },
        );
        return ServiceResponse.failure(conflictError.message, null, 409);
      }

      await drizzle.delete(schema.library).where(eq(schema.library.id, id));
      return ServiceResponse.success("Library deleted successfully", null, 204);
    } catch (err) {
      const dbError = new DatabaseError("Failed to delete library", { libraryId: id, originalError: err });
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },
};
