import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { BookService } from "./book.service.js";
import { createBookSchema, updateBookSchema, createBooksBulkSchema } from "./book.model.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import { isbndbQueue } from "../../services/isbndbQueue.js";
import { BookLookupService } from "../../services/bookLookup.js";
import { isbnService } from "../../services/isbnService.js";

class BooksController {
  public createBook: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    try {
      const parsed = createBookSchema.parse(req.body);
      const serviceResponse = await BookService.createBook(drizzle, parsed);
      return handleServiceResponse(serviceResponse, res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Failed to create book", _err, StatusCodes.UNPROCESSABLE_ENTITY),
        res,
      );
    }
  };

  public createBooksBulk: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;

    const books = createBooksBulkSchema.parse(req.body);
    try {
      const insertedBooks = await BookService.createBooksBulk(drizzle, books);
      return handleServiceResponse(
        ServiceResponse.success("Books created", insertedBooks, StatusCodes.CREATED),
        res,
      );
    } catch (err) {
      return handleServiceResponse(ServiceResponse.failure("Bulk creation failed", err), res);
    }
  };

  public updateBook: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    try {
      const parsed = updateBookSchema.parse(req.body);
      const updated = await BookService.updateBook(drizzle, req.params.id, parsed);
      return handleServiceResponse(ServiceResponse.success("Book updated", updated), res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Update failed", _err, StatusCodes.NOT_FOUND),
        res,
      );
    }
  };

  public getBook: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    try {
      const serviceResponse = await BookService.getBookById(drizzle, req.params.id);
      return handleServiceResponse(serviceResponse, res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Book not found", _err, StatusCodes.NOT_FOUND),
        res,
      );
    }
  };

  public getBooks: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { title, isbn, author, genre, publishedYear } = req.query as {
      title?: string;
      isbn?: string;
      author?: string;
      genre?: string;
      publishedYear?: string;
    };

    const filters = {
      title: title?.toString(),
      isbn: isbn?.toString(),
      author: author?.toString(),
      genre: genre?.toString(),
      publishedYear: publishedYear ? Number.parseInt(publishedYear.toString(), 10) : undefined,
    };

    try {
      const books = await BookService.getBooks(drizzle, filters);
      return handleServiceResponse(ServiceResponse.success("Books fetched", books), res);
    } catch (_err) {
      return handleServiceResponse(ServiceResponse.failure("Error fetching books", _err), res);
    }
  };

  public deleteBook: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    try {
      await BookService.deleteBook(drizzle, req.params.id);
      return handleServiceResponse(
        ServiceResponse.success("Book deleted", null, StatusCodes.NO_CONTENT),
        res,
      );
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Book not found", _err, StatusCodes.NOT_FOUND),
        res,
      );
    }
  };

  public getBookByISBN: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    try {
      const book = await BookService.getBookByISBN(drizzle, req.params.isbn);
      return handleServiceResponse(ServiceResponse.success("Book found", book), res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Book not found", _err, StatusCodes.NOT_FOUND),
        res,
      );
    }
  };

  public searchBooks: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const search = typeof req.query.search === "string" ? req.query.search : "";
    if (!search) {
      return handleServiceResponse(
        ServiceResponse.failure("Missing 'search' query param", null, StatusCodes.BAD_REQUEST),
        res,
      );
    }

    try {
      const books = await BookService.searchBooksByTrigram(drizzle, search);
      return handleServiceResponse(ServiceResponse.success("Search results", books), res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Search failed", _err, StatusCodes.INTERNAL_SERVER_ERROR),
        res,
      );
    }
  };

  public searchBooksWeighted: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const search = typeof req.query.search === "string" ? req.query.search : "";
    if (!search) {
      return handleServiceResponse(
        ServiceResponse.failure("Missing 'search' query param", null, StatusCodes.BAD_REQUEST),
        res,
      );
    }

    try {
      const books = await BookService.searchBooksByWeighted(drizzle, search);
      return handleServiceResponse(ServiceResponse.success("Weighted search results", books), res);
    } catch (err) {
      return handleServiceResponse(ServiceResponse.failure("Weighted search failed", err), res);
    }
  };
  public getAuthorDetails: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { name } = req.params;
    const { page = "1", pageSize = "20", language } = req.query;

    try {
      const data = await BookService.getAuthorDetails(
        drizzle,
        name,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
        language as "en" | "ar" | "other",
      );
      return handleServiceResponse(ServiceResponse.success("Author details fetched", data), res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Failed to fetch author details", _err, StatusCodes.NOT_FOUND),
        res,
      );
    }
  };

  public searchAuthors: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { query } = req.params;
    const { page = "1", pageSize = "20" } = req.query;

    try {
      const data = await BookService.searchAuthors(
        drizzle,
        query,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
      );
      return handleServiceResponse(ServiceResponse.success("Authors found", data), res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Failed to search authors", _err, StatusCodes.NOT_FOUND),
        res,
      );
    }
  };

  public getPublisherDetails: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { name } = req.params;
    const { page = "1", pageSize = "20", language } = req.query;

    try {
      const data = await BookService.getPublisherDetails(
        drizzle,
        name,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
        language as "en" | "ar" | "other",
      );
      return handleServiceResponse(ServiceResponse.success("Publisher details fetched", data), res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Failed to fetch publisher details", _err, StatusCodes.NOT_FOUND),
        res,
      );
    }
  };

  public searchPublishers: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { query } = req.params;
    const { page = "1", pageSize = "20" } = req.query;

    try {
      const data = await BookService.searchPublishers(
        drizzle,
        query,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
      );
      return handleServiceResponse(ServiceResponse.success("Publishers found", data), res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Failed to search publishers", _err, StatusCodes.NOT_FOUND),
        res,
      );
    }
  };

  public searchAll: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { index } = req.params;
    const { page = "1", pageSize = "20", isbn, isbn13, author, text, subject, publisher } = req.query;

    if (!["books", "authors", "publishers"].includes(index)) {
      return handleServiceResponse(
        ServiceResponse.failure(
          "Invalid index. Valid indices are 'books', 'authors', 'publishers'.",
          null,
          StatusCodes.BAD_REQUEST,
        ),
        res,
      );
    }

    try {
      const data = await BookService.searchAll(
        drizzle,
        index as "books" | "authors" | "publishers",
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
        {
          isbn: typeof isbn === "string" ? isbn : "",
          isbn13: typeof isbn13 === "string" ? isbn13 : "",
          author: typeof author === "string" ? author : "",
          text: typeof text === "string" ? text : "",
          subject: typeof subject === "string" ? subject : "",
          publisher: typeof publisher === "string" ? publisher : "",
        },
      );

      return handleServiceResponse(ServiceResponse.success("Search results", data), res);
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Search failed", _err, StatusCodes.INTERNAL_SERVER_ERROR),
        res,
      );
    }
  };

  // Queue a book lookup with priority
  public queueBookLookup: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { isbn } = req.params;
    const { priority = "low" } = req.body;

    if (!isbn) {
      return handleServiceResponse(
        ServiceResponse.failure("ISBN is required", null, StatusCodes.BAD_REQUEST),
        res,
      );
    }

    try {
      // Queue the book lookup with specified priority
      const result = await BookLookupService.getBookByISBN(drizzle, isbn, false);

      return handleServiceResponse(
        ServiceResponse.success("Book lookup completed", {
          book: result,
          queueStats: isbndbQueue.getQueueStats(),
        }),
        res,
      );
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Failed to queue book lookup", _err, StatusCodes.INTERNAL_SERVER_ERROR),
        res,
      );
    }
  };

  // Get queue status and cache statistics
  public getQueueStatus: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;

    try {
      const queueStats = isbndbQueue.getQueueStats();
      const cacheStats = await BookLookupService.getCacheStats(drizzle);

      return handleServiceResponse(
        ServiceResponse.success("Queue status retrieved", {
          queue: queueStats,
          cache: cacheStats,
        }),
        res,
      );
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Failed to get queue status", _err, StatusCodes.INTERNAL_SERVER_ERROR),
        res,
      );
    }
  };

  // Enhanced search with cache-first approach
  public searchBooksWithCache: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { query } = req.params;
    const { useQueue = "true", priority = "low" } = req.query;

    if (!query) {
      return handleServiceResponse(
        ServiceResponse.failure("Search query is required", null, StatusCodes.BAD_REQUEST),
        res,
      );
    }

    try {
      // First search local cache
      const cachedResults = await BookLookupService.searchCachedBooks(drizzle, query);

      if (cachedResults.length > 0) {
        return handleServiceResponse(
          ServiceResponse.success("Results found in cache", {
            books: cachedResults,
            source: "cache",
            total: cachedResults.length,
          }),
          res,
        );
      }

      // If no cached results and queue is enabled, search via ISBNDB
      if (useQueue === "true") {
        const serviceResponse = await BookService.searchAll(drizzle, "books", 1, 20, {
          text: query,
          isbn: "",
          isbn13: "",
          author: "",
          subject: "",
          publisher: "",
        });

        if (serviceResponse.success) {
          return handleServiceResponse(
            ServiceResponse.success("Results found via ISBNDB", {
              ...serviceResponse.responseObject,
              source: "isbndb",
            }),
            res,
          );
        }
      }

      return handleServiceResponse(
        ServiceResponse.success("No results found", {
          books: [],
          source: "none",
          total: 0,
        }),
        res,
      );
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Search failed", _err, StatusCodes.INTERNAL_SERVER_ERROR),
        res,
      );
    }
  };

  // Get ISBN service status and configuration
  public getISBNServiceStatus: RequestHandler = async (req, res) => {
    try {
      const config = isbnService.getConfig();
      const queueStats = isbndbQueue.getQueueStats();

      return handleServiceResponse(
        ServiceResponse.success("ISBN service status", {
          service: config,
          queue: queueStats,
        }),
        res,
      );
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Failed to get service status", _err, StatusCodes.INTERNAL_SERVER_ERROR),
        res,
      );
    }
  };

  // Direct ISBN book lookup (bypasses queue)
  public getBookByISBNDirect: RequestHandler = async (req, res) => {
    const { isbn } = req.params;
    const { withPrices = "false" } = req.query;

    if (!isbn) {
      return handleServiceResponse(
        ServiceResponse.failure("ISBN is required", null, StatusCodes.BAD_REQUEST),
        res,
      );
    }

    try {
      const book = await isbnService.getBookByISBN(isbn, withPrices === "true");

      return handleServiceResponse(
        ServiceResponse.success("Book found via direct ISBN lookup", {
          book: book.book,
          source: "isbndb-direct",
        }),
        res,
      );
    } catch (_err) {
      return handleServiceResponse(
        ServiceResponse.failure("Book not found", _err, StatusCodes.NOT_FOUND),
        res,
      );
    }
  };
}

export const booksController = new BooksController();
