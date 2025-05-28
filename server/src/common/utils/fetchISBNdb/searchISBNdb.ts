import { callISBNdb } from "./callISBNdb.js";
import type { AuthorQueryResults as AuthorSearchResponse } from "../../types/shared/isbndbAPI.js";
import type { BookSearchResponse } from "./searchBooks.js";
import type { PublisherSearchResponse } from "./searchPublishers.js";

interface SearchParams {
  page?: number;
  pageSize?: number;
  isbn?: string;
  isbn13?: string;
  author?: string;
  text?: string;
  subject?: string;
  publisher?: string;
}

type SearchResponse = {
  data: BookSearchResponse | AuthorSearchResponse | PublisherSearchResponse;
};

export async function searchISBNdb(
  index: "books" | "authors" | "publishers",
  params: SearchParams,
): Promise<SearchResponse> {
  if (!["books", "authors", "publishers"].includes(index)) {
    throw new Error(`Invalid index: ${index}. Valid indices are books, authors, publishers.`);
  }

  const queryParams = new URLSearchParams();

  if (params.page !== undefined) queryParams.set("page", params.page.toString());
  if (params.pageSize !== undefined) queryParams.set("pageSize", params.pageSize.toString());
  if (params.isbn) queryParams.set("isbn", params.isbn);
  if (params.isbn13) queryParams.set("isbn13", params.isbn13);
  if (params.author) queryParams.set("author", params.author);
  if (params.text) queryParams.set("text", params.text);
  if (params.publisher) queryParams.set("publisher", params.publisher);

  try {
    const response = await callISBNdb(`/search/${index}?${queryParams.toString()}`);

    switch (index) {
      case "books":
        return {
          data: {
            total: (response as BookSearchResponse).total ?? 0,
            books: (response as BookSearchResponse).books ?? [],
          },
        };
      case "authors":
        return {
          data: {
            total: (response as AuthorSearchResponse).total ?? 0,
            authors: (response as AuthorSearchResponse).authors ?? [],
          },
        };
      case "publishers":
        return {
          data: {
            total: (response as PublisherSearchResponse).total ?? 0,
            publishers: (response as PublisherSearchResponse).publishers ?? [],
          },
        };
      default:
        throw new Error("Unexpected index type");
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch search results: ${error.message}`);
  }
}
