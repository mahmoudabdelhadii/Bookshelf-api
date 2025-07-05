import { Router } from "express";
import { booksController } from "./book.controller.js";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { bookSchema, getBookSchema, createBookSchema, updateBookSchema } from "./book.model.js";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
export const booksRegistry = new OpenAPIRegistry();

export const booksRouter = Router();

booksRegistry.register("Book", bookSchema.openapi("Book"));

booksRegistry.registerPath({
  method: "post",
  path: "/books",
  tags: ["Books"],
  request: {
    body: {
      description: "Create a new book",
      required: true,
      content: {
        "application/json": {
          schema: createBookSchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(bookSchema, "Book created successfully", 201),
  },
});
booksRouter.post("/", booksController.createBook);

const createBooksBulkSchema = z.object({
  books: z.array(createBookSchema),
});

booksRegistry.registerPath({
  method: "post",
  path: "/books/bulk",
  tags: ["Books"],
  request: {
    body: {
      description: "Bulk create multiple books",
      required: true,
      content: {
        "application/json": {
          schema: createBooksBulkSchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(z.array(bookSchema), "Books created successfully", 201),
  },
});
booksRouter.post("/bulk", booksController.createBooksBulk);

booksRegistry.registerPath({
  method: "get",
  path: "/books/{id}",
  tags: ["Books"],
  request: {
    params: getBookSchema.shape.params,
  },
  responses: {
    ...createApiResponse(bookSchema, "Book fetched successfully"),
  },
});
booksRouter.get("/:id", booksController.getBook);

booksRegistry.registerPath({
  method: "patch",
  path: "/books/{id}",
  tags: ["Books"],
  request: {
    params: getBookSchema.shape.params,
    body: {
      description: "Partial update of a book",
      required: true,
      content: {
        "application/json": {
          schema: updateBookSchema,
        },
      },
    },
  },
  responses: {
    ...createApiResponse(bookSchema, "Book updated successfully"),
  },
});
booksRouter.patch("/:id", booksController.updateBook);

booksRegistry.registerPath({
  method: "delete",
  path: "/books/{id}",
  tags: ["Books"],
  request: { params: getBookSchema.shape.params },
  responses: {
    204: {
      description: "Book deleted successfully",
    },
    404: {
      description: "Book not found",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
});
booksRouter.delete("/:id", booksController.deleteBook);

const listBooksQuerySchema = z.object({
  title: z.string().optional(),
  isbn: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  publishedYear: z.number().optional(),
});

booksRegistry.registerPath({
  method: "get",
  path: "/books",
  tags: ["Books"],
  request: { query: listBooksQuerySchema },
  responses: {
    ...createApiResponse(z.array(bookSchema), "Books fetched successfully"),
  },
});
booksRouter.get("/", booksController.getBooks);

const searchBooksQuerySchema = z.object({
  search: z.string(),
});

booksRegistry.registerPath({
  method: "get",
  path: "/books/search",
  tags: ["Books"],
  request: { query: searchBooksQuerySchema },
  responses: {
    ...createApiResponse(z.array(bookSchema), "Books searched successfully"),
  },
});
booksRouter.get("/search", booksController.searchBooks);

const weightedSearchQuerySchema = z.object({
  search: z.string(),
});

booksRegistry.registerPath({
  method: "get",
  path: "/books/weighted-search",
  tags: ["Books"],
  request: { query: weightedSearchQuerySchema },
  responses: {
    ...createApiResponse(z.array(bookSchema), "Books fetched successfully using weighted search"),
  },
});
booksRouter.get("/weighted-search", booksController.searchBooksWeighted);

booksRegistry.registerPath({
  method: "get",
  path: "/author/{name}",
  tags: ["Author"],
  request: { params: z.object({ name: z.string() }) },
  responses: createApiResponse(z.any(), "Author details fetched successfully"),
});
booksRouter.get("/author/:name", booksController.getAuthorDetails);

booksRegistry.registerPath({
  method: "get",
  path: "/authors/{query}",
  tags: ["Author"],
  request: { params: z.object({ query: z.string() }) },
  responses: createApiResponse(z.any(), "Authors found"),
});
booksRouter.get("/authors/:query", booksController.searchAuthors);

booksRegistry.registerPath({
  method: "get",
  path: "/publisher/{name}",
  tags: ["Publisher"],
  request: { params: z.object({ name: z.string() }) },
  responses: createApiResponse(z.any(), "Publisher details fetched"),
});
booksRouter.get("/publisher/:name", booksController.getPublisherDetails);

booksRegistry.registerPath({
  method: "get",
  path: "/publishers/{query}",
  tags: ["Publisher"],
  request: { params: z.object({ query: z.string() }) },
  responses: createApiResponse(z.array(z.any()), "Publishers found"),
});
booksRouter.get("/publishers/:query", booksController.searchPublishers);

booksRegistry.registerPath({
  method: "get",
  path: "/search/{index}",
  tags: ["Search"],
  request: { params: z.object({ index: z.enum(["books", "authors", "publishers"]) }) },
  responses: createApiResponse(z.any(), "Search results"),
});
booksRouter.get("/search/:index", booksController.searchAll);


booksRegistry.registerPath({
  method: "post",
  path: "/books/queue/{isbn}",
  tags: ["Books", "Queue"],
  request: {
    params: z.object({ isbn: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            priority: z.enum(["high", "low"]).optional().default("low"),
          }),
        },
      },
    },
  },
  responses: createApiResponse(z.any(), "Book lookup queued successfully"),
});
booksRouter.post("/queue/:isbn", booksController.queueBookLookup);

booksRegistry.registerPath({
  method: "get",
  path: "/books/queue/status",
  tags: ["Books", "Queue"],
  responses: createApiResponse(
    z.object({
      queue: z.object({
        length: z.number(),
        processing: z.boolean(),
      }),
      cache: z.object({
        totalBooks: z.number(),
        totalAuthors: z.number(),
        totalPublishers: z.number(),
      }),
    }),
    "Queue status retrieved",
  ),
});
booksRouter.get("/queue/status", booksController.getQueueStatus);

booksRegistry.registerPath({
  method: "get",
  path: "/books/search-cached/{query}",
  tags: ["Books", "Search", "Cache"],
  request: {
    params: z.object({ query: z.string() }),
    query: z.object({
      useQueue: z.string().optional().default("true"),
      priority: z.enum(["high", "low"]).optional().default("low"),
    }),
  },
  responses: createApiResponse(z.any(), "Search results with cache"),
});
booksRouter.get("/search-cached/:query", booksController.searchBooksWithCache);


booksRegistry.registerPath({
  method: "get",
  path: "/books/service/status",
  tags: ["Books", "Service"],
  responses: createApiResponse(
    z.object({
      service: z.object({
        enabled: z.boolean(),
        hasApiKey: z.boolean(),
        baseUrl: z.string(),
      }),
      queue: z.object({
        length: z.number(),
        processing: z.boolean(),
      }),
    }),
    "ISBN service status",
  ),
});
booksRouter.get("/service/status", booksController.getISBNServiceStatus);

booksRegistry.registerPath({
  method: "get",
  path: "/books/isbn-direct/{isbn}",
  tags: ["Books", "ISBN"],
  request: {
    params: z.object({ isbn: z.string() }),
    query: z.object({
      withPrices: z.string().optional().default("false"),
    }),
  },
  responses: createApiResponse(z.any(), "Book found via direct ISBN lookup"),
});
booksRouter.get("/isbn-direct/:isbn", booksController.getBookByISBNDirect);
