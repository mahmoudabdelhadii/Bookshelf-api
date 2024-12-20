import { callISBNdb } from "./callISBNdb.js";
import { BookDetails } from "./fetchBookDetails.js";
export interface BookSearchResponse {
    total: number;
    books: BookDetails[];
  }
  
  
  export async function searchBooks(
    query: string,
    options?: {
      page?: number;
      pageSize?: number;
      column?: "title" | "author" | "date_published" | "subjects" | "";
      year?: number;
      edition?: number;
      language?: string;
      shouldMatchAll?: boolean;
    }
  ): Promise<BookSearchResponse> {
    const params = new URLSearchParams({
      page: options?.page?.toString() ??"1",
      pageSize: options?.pageSize?.toString() ??"20",
      column: options?.column ??"",
      year: options?.year?.toString() ??"",
      edition: options?.edition?.toString() ??"",
      language: options?.language ??"",
      shouldMatchAll: options?.shouldMatchAll ? "1" : "0",
    });
  
    const response = await callISBNdb(`/books/${query}?${params.toString()}`);
    return response as BookSearchResponse;
  }