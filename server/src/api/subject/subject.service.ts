import type { DrizzleClient } from "database";
import { eq, sql, schema, and, ne, isNull } from "database";
import {
  NotFoundError,
  ConflictError,
  DatabaseError,
  ValidationError,
} from "../../errors.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import type { Subject, CreateSubject, UpdateSubject } from "./subject.model.js";

export const SubjectService = {
  findAll: async (drizzle: DrizzleClient) => {
    try {
      const subjects = await drizzle.query.subject.findMany({
        orderBy: [schema.subject.name],
      });
      return ServiceResponse.success("Subjects retrieved successfully", subjects);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve subjects: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  findById: async (drizzle: DrizzleClient, id: string) => {
    try {
      const subject = await drizzle.query.subject.findFirst({
        where: eq(schema.subject.id, id),
      });

      if (!subject) {
        throw new NotFoundError("Subject not found");
      }

      return ServiceResponse.success("Subject retrieved successfully", subject);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve subject: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  getHierarchy: async (drizzle: DrizzleClient) => {
    try {
      // Get all root subjects (no parent)
      const rootSubjects = await drizzle.query.subject.findMany({
        where: isNull(schema.subject.parent),
        orderBy: [schema.subject.name],
      });

      // Build hierarchy recursively
      const buildHierarchy = async (parentId: string): Promise<any[]> => {
        const children = await drizzle.query.subject.findMany({
          where: eq(schema.subject.parent, parentId),
          orderBy: [schema.subject.name],
        });

        const childrenWithSubChildren = await Promise.all(
          children.map(async (child) => ({
            ...child,
            children: await buildHierarchy(child.id),
          }))
        );

        return childrenWithSubChildren;
      };

      const hierarchy = await Promise.all(
        rootSubjects.map(async (root) => ({
          ...root,
          children: await buildHierarchy(root.id),
        }))
      );

      return ServiceResponse.success("Subject hierarchy retrieved successfully", hierarchy);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to retrieve subject hierarchy: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, null, dbError.statusCode);
    }
  },

  create: async (drizzle: DrizzleClient, subjectData: CreateSubject) => {
    try {
      if (!subjectData.name.trim()) {
        const validationError = new ValidationError("Subject name is required");
        return ServiceResponse.failure(validationError.message, null, validationError.statusCode);
      }

      const existingSubject = await drizzle.query.subject.findFirst({
        where: eq(schema.subject.name, subjectData.name.trim()),
      });

      if (existingSubject) {
        const conflictError = new ConflictError("Subject with this name already exists");
        return ServiceResponse.failure(conflictError.message, { name: subjectData.name }, conflictError.statusCode);
      }

      // Validate parent exists if provided
      if (subjectData.parent) {
        const parentSubject = await drizzle.query.subject.findFirst({
          where: eq(schema.subject.id, subjectData.parent),
        });

        if (!parentSubject) {
          const validationError = new ValidationError("Parent subject not found");
          return ServiceResponse.failure(validationError.message, { parentId: subjectData.parent }, validationError.statusCode);
        }
      }

      const [newSubject] = await drizzle
        .insert(schema.subject)
        .values({
          ...subjectData,
          name: subjectData.name.trim(),
        })
        .returning();

      return ServiceResponse.success("Subject created successfully", newSubject, 201);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to create subject: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { subjectData, originalError: errorMessage }, dbError.statusCode);
    }
  },

  update: async (drizzle: DrizzleClient, id: string, subjectData: UpdateSubject) => {
    try {
      const existingSubject = await drizzle.query.subject.findFirst({
        where: eq(schema.subject.id, id),
      });

      if (!existingSubject) {
        throw new NotFoundError("Subject not found");
      }

      if (subjectData.name) {
        const nameConflict = await drizzle.query.subject.findFirst({
          where: and(
            eq(schema.subject.name, subjectData.name.trim()),
            ne(schema.subject.id, id)
          ),
        });

        if (nameConflict) {
          const conflictError = new ConflictError("Subject with this name already exists");
          return ServiceResponse.failure(conflictError.message, { name: subjectData.name }, conflictError.statusCode);
        }
      }

      // Validate parent exists if provided and prevent circular reference
      if (subjectData.parent) {
        if (subjectData.parent === id) {
          const validationError = new ValidationError("Subject cannot be its own parent");
          return ServiceResponse.failure(validationError.message, { parentId: subjectData.parent }, validationError.statusCode);
        }

        const parentSubject = await drizzle.query.subject.findFirst({
          where: eq(schema.subject.id, subjectData.parent),
        });

        if (!parentSubject) {
          const validationError = new ValidationError("Parent subject not found");
          return ServiceResponse.failure(validationError.message, { parentId: subjectData.parent }, validationError.statusCode);
        }
      }

      const updateData = {
        ...subjectData,
        ...(subjectData.name && { name: subjectData.name.trim() }),
        updatedAt: new Date(),
      };

      const [updatedSubject] = await drizzle
        .update(schema.subject)
        .set(updateData)
        .where(eq(schema.subject.id, id))
        .returning();

      return ServiceResponse.success("Subject updated successfully", updatedSubject);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to update subject: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { id, subjectData, originalError: errorMessage }, dbError.statusCode);
    }
  },

  delete: async (drizzle: DrizzleClient, id: string) => {
    try {
      const existingSubject = await drizzle.query.subject.findFirst({
        where: eq(schema.subject.id, id),
      });

      if (!existingSubject) {
        throw new NotFoundError("Subject not found");
      }

      // Check if subject has books
      const booksCount = await drizzle
        .select({ count: sql<number>`count(*)` })
        .from(schema.book)
        .where(eq(schema.book.subjectId, id));

      if (booksCount[0].count > 0) {
        const conflictError = new ConflictError("Cannot delete subject with existing books");
        return ServiceResponse.failure(conflictError.message, { bookCount: booksCount[0].count }, conflictError.statusCode);
      }

      // Check if subject has child subjects
      const childrenCount = await drizzle
        .select({ count: sql<number>`count(*)` })
        .from(schema.subject)
        .where(eq(schema.subject.parent, id));

      if (childrenCount[0].count > 0) {
        const conflictError = new ConflictError("Cannot delete subject with child subjects");
        return ServiceResponse.failure(conflictError.message, { childrenCount: childrenCount[0].count }, conflictError.statusCode);
      }

      await drizzle.delete(schema.subject).where(eq(schema.subject.id, id));

      return ServiceResponse.success("Subject deleted successfully", null);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ConflictError) {
        return ServiceResponse.failure(err.message, null, err.statusCode);
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const dbError = new DatabaseError(`Failed to delete subject: ${errorMessage}`);
      return ServiceResponse.failure(dbError.message, { id, originalError: errorMessage }, dbError.statusCode);
    }
  },
};