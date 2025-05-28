import { callISBNdb } from "./callISBNdb.js";
import type { Book as ISBNdbBookResponse } from "../../types/shared/isbndbAPI.js";

export interface BookSearchResponse {
  total: number;
  books: ISBNdbBookResponse[];
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
  },
): Promise<BookSearchResponse> {
  const params = new URLSearchParams({
    page: options?.page?.toString() ?? "1",
    pageSize: options?.pageSize?.toString() ?? "20",
    column: options?.column ?? "",
    year: options?.year?.toString() ?? "",
    edition: options?.edition?.toString() ?? "",
    language: options?.language ?? "",
    shouldMatchAll: options?.shouldMatchAll ? "1" : "0",
  });

  const response = await callISBNdb<{ total: number; books: ISBNdbBookResponse[] }>(
    `/books/${query}?${params.toString()}`,
  );
  return response;
}
