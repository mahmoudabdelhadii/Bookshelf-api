import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter.js";
import { userRegistry } from "@/api/user/user.router.js";
import { booksRegistry } from "@/api/book/book.router.js";
import { authRegistry } from "@/api/auth/auth.router.js";
import { libraryRegistry } from "@/api/library/library.router.js";
import { libraryBooksRegistry } from "@/api/libraryBooks/libraryBooks.router.js";
import { subjectRegistry } from "@/api/subject/subject.router.js";
import { publisherRegistry } from "@/api/publisher/publisher.router.js";
import { borrowRequestRegistry } from "@/api/borrowRequest/borrowRequest.router.js";
import { libraryMemberRegistry } from "@/api/libraryMember/libraryMember.router.js";

export function generateOpenAPIDocument() {
  const registry = new OpenAPIRegistry([
    healthCheckRegistry,
    userRegistry,
    booksRegistry,
    libraryRegistry,
    libraryBooksRegistry,
    authRegistry,
    subjectRegistry,
    publisherRegistry,
    // borrowRequestRegistry,
    // libraryMemberRegistry,
    authRegistry,
  ]);
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Bookshelf API",
      description: "A comprehensive API for managing books, libraries, users, and library collections",
    },
    externalDocs: {
      description: "View the raw OpenAPI Specification in JSON format",
      url: "/swagger.json",
    },
  });
}
