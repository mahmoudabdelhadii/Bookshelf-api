import { callISBNdb } from "./callISBNdb.js";
import type { AuthorQueryResults as ISBNdbAuthorQueryResults } from "../../types/shared/isbndbAPI.js";

export async function searchAuthors(
  query: string,
  options?: { page?: number; pageSize?: number },
): Promise<ISBNdbAuthorQueryResults> {
  const params = new URLSearchParams({
    page: options?.page?.toString() ?? "1",
    pageSize: options?.pageSize?.toString() ?? "20",
  });

  const response = await callISBNdb<ISBNdbAuthorQueryResults>(`/authors/${query}?${params.toString()}`);
  return response;
}
