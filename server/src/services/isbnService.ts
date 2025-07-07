import { env } from "../common/utils/envConfig.js";
import { logger } from "database";
import type { Book, Author, Publisher, AuthorQueryResults } from "../common/types/shared/isbndbAPI.js";

export interface ISBNSearchOptions {
  page?: number;
  pageSize?: number;
  column?: "title" | "author" | "date_published" | "subjects" | "";
  year?: number;
  edition?: number;
  language?: string;
  shouldMatchAll?: boolean;
}
function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};

  const result: Record<string, string> = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

export interface AuthorSearchOptions {
  page?: number;
  pageSize?: number;
  language?: string;
}

export interface PublisherSearchOptions {
  page?: number;
  pageSize?: number;
  language?: string;
}

export interface BookSearchResult {
  total?: number;
  books?: Book[];
}

export interface ISBNServiceError {
  message: string;
  code: number;
  details?: unknown;
}

class ISBNService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly enabled: boolean;

  constructor() {
    this.apiKey = env.ISBNDB_API_KEY;
    this.baseUrl = "https://api2.isbndb.com";
    this.enabled = env.ISBNDB_ENABLED && this.apiKey.length > 0;
  }

  private async makeRequest<T>(path: string, options?: RequestInit): Promise<T> {
    if (!this.enabled) {
      throw new Error("ISBNdb service is not enabled or API key is missing");
    }

    const url = `${this.baseUrl}${path}`;
    logger.debug("Making ISBNdb request to: %s", url);

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.apiKey,
        ...normalizeHeaders(options?.headers),
      },
    });

    if (!response.ok) {
      const errorMessage = `ISBNdb API error: ${response.status} ${response.statusText}`;
      logger.error({ url, status: response.status, errorMessage }, "ISBNdb API error");

      if (response.status === 404) {
        throw new Error("Not found");
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    logger.debug({ url, dataType: typeof data }, "ISBNdb response received");

    return data as T;
  }

  async getBookByISBN(isbn: string, withPrices?: boolean): Promise<Book> {
    const cleanISBN = isbn.replace(/[^0-9X]/gi, "");
    const path = `/book/${cleanISBN}${withPrices ? "?with_prices=1" : ""}`;

    try {
      const response = await this.makeRequest<Book>(path);
      logger.info("Book found via ISBNdb: %s", cleanISBN);
      return response;
    } catch (err) {
      logger.error({ error: err }, "Failed to fetch book by ISBN: %s", cleanISBN);
      throw err;
    }
  }

  async searchBooks(query: string, options: ISBNSearchOptions = {}): Promise<BookSearchResult> {
    const params = new URLSearchParams({
      page: options.page?.toString() ?? "1",
      pageSize: options.pageSize?.toString() ?? "20",
      column: options.column ?? "",
      ...(options.year && { year: options.year.toString() }),
      ...(options.edition && { edition: options.edition.toString() }),
      ...(options.language && { language: options.language }),
      shouldMatchAll: options.shouldMatchAll ? "1" : "0",
    });

    const path = `/books/${encodeURIComponent(query)}?${params.toString()}`;

    try {
      const response = await this.makeRequest<BookSearchResult>(path);
      logger.info(
        {
          total: response.total,
          resultsCount: response.books?.length ?? 0,
        },
        "Books search completed for query: %s",
        query,
      );
      return response;
    } catch (err) {
      logger.error({ error: err }, "Failed to search books: %s", query);
      throw err;
    }
  }

  async getAuthorDetails(name: string, options: AuthorSearchOptions = {}): Promise<Author> {
    const params = new URLSearchParams({
      page: options.page?.toString() ?? "1",
      pageSize: options.pageSize?.toString() ?? "20",
      ...(options.language && { language: options.language }),
    });

    const path = `/author/${encodeURIComponent(name)}?${params.toString()}`;

    try {
      const response = await this.makeRequest<Author>(path);
      logger.info(
        {
          booksCount: response.books?.length ?? 0,
        },
        "Author details found: %s",
        name,
      );
      return response;
    } catch (err) {
      logger.error({ error: err }, "Failed to fetch author details: %s", name);
      throw err;
    }
  }

  async searchAuthors(
    query: string,
    options: { page?: number; pageSize?: number } = {},
  ): Promise<AuthorQueryResults> {
    const params = new URLSearchParams({
      page: options.page?.toString() ?? "1",
      pageSize: options.pageSize?.toString() ?? "20",
    });

    const path = `/authors/${encodeURIComponent(query)}?${params.toString()}`;

    try {
      const response = await this.makeRequest<AuthorQueryResults>(path);
      logger.info(
        {
          total: response.total,
          resultsCount: response.authors?.length ?? 0,
        },
        "Authors search completed for query: %s",
        query,
      );
      return response;
    } catch (err) {
      logger.error({ error: err }, "Failed to search authors: %s", query);
      throw err;
    }
  }

  async getPublisherDetails(name: string, options: PublisherSearchOptions = {}): Promise<Publisher> {
    const params = new URLSearchParams({
      page: options.page?.toString() ?? "1",
      pageSize: options.pageSize?.toString() ?? "20",
      ...(options.language && { language: options.language }),
    });

    const path = `/publisher/${encodeURIComponent(name)}?${params.toString()}`;

    try {
      const response = await this.makeRequest<Publisher>(path);
      logger.info(
        {
          booksCount: response.books?.length ?? 0,
        },
        "Publisher details found: %s",
        name,
      );
      return response;
    } catch (err) {
      logger.error({ error: err }, "Failed to fetch publisher details: %s", name);
      throw err;
    }
  }

  async searchPublishers(
    query: string,
    options: { page?: number; pageSize?: number } = {},
  ): Promise<{ publishers?: Publisher[] }> {
    const params = new URLSearchParams({
      page: options.page?.toString() ?? "1",
      pageSize: options.pageSize?.toString() ?? "20",
    });

    const path = `/publishers/${encodeURIComponent(query)}?${params.toString()}`;

    try {
      const response = await this.makeRequest<{ publishers?: Publisher[] }>(path);
      logger.info(
        {
          resultsCount: response.publishers?.length ?? 0,
        },
        "Publishers search completed for query: %s",
        query,
      );
      return response;
    } catch (err) {
      logger.error({ error: err }, "Failed to search publishers: %s", query);
      throw err;
    }
  }

  async searchAll(
    index: "books" | "authors" | "publishers" | "subjects",
    filters: {
      page?: number;
      pageSize?: number;
      isbn?: string;
      isbn13?: string;
      author?: string;
      text?: string;
      subject?: string;
      publisher?: string;
    } = {},
  ): Promise<unknown> {
    const params = new URLSearchParams({
      page: filters.page?.toString() ?? "1",
      pageSize: filters.pageSize?.toString() ?? "20",
      ...(filters.isbn && { isbn: filters.isbn }),
      ...(filters.isbn13 && { isbn13: filters.isbn13 }),
      ...(filters.author && { author: filters.author }),
      ...(filters.text && { text: filters.text }),
      ...(filters.subject && { subject: filters.subject }),
      ...(filters.publisher && { publisher: filters.publisher }),
    });

    const path = `/search/${index}?${params.toString()}`;

    try {
      const response = await this.makeRequest<unknown>(path);
      logger.info({ filters }, "Search all completed for index: %s", index);
      return response;
    } catch (err) {
      logger.error({ error: err, filters }, "Failed to search all for index: %s", index);
      throw err;
    }
  }

  async getStats(): Promise<unknown> {
    const path = "/stats";

    try {
      const response = await this.makeRequest<unknown>(path);
      logger.info("ISBNdb stats retrieved");
      return response;
    } catch (err) {
      logger.error({ error: err }, "Failed to get ISBNdb stats");
      throw err;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getConfig(): { enabled: boolean; hasApiKey: boolean; baseUrl: string } {
    return {
      enabled: this.enabled,
      hasApiKey: this.apiKey.length > 0,
      baseUrl: this.baseUrl,
    };
  }
}

export const isbnService = new ISBNService();
