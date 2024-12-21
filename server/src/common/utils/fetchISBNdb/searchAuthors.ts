import { callISBNdb } from "./callISBNdb.js";
export interface AuthorSearchResponse {
  total: number;
  authors: string[];
}

export async function searchAuthors(
  query: string,
  options?: { page?: number; pageSize?: number },
): Promise<AuthorSearchResponse> {
  const params = new URLSearchParams({
    page: options?.page?.toString() ?? "1",
    pageSize: options?.pageSize?.toString() ?? "20",
  });

  const response = await callISBNdb(`/authors/${query}?${params.toString()}`);
  return response as AuthorSearchResponse;
}
