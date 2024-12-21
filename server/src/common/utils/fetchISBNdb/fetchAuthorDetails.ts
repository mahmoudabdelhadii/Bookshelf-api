import { callISBNdb } from "./callISBNdb.js";
interface AuthorBook {
  title: string;
  titleLong?: string;
  isbn: string;
  isbn13?: string;
  language?: string;
  datePublished?: string;
  overview?: string;
  authors?: string[];
  subjects?: string[];
}

export interface AuthorResponse {
  author: string;
  books: AuthorBook[];
}

export async function fetchAuthorDetails(
  name: string,
  options?: { page?: number; pageSize?: number; language?: string },
): Promise<AuthorResponse> {
  const params = new URLSearchParams({
    page: options?.page?.toString() ?? "1",
    pageSize: options?.pageSize?.toString() ?? "20",
    language: options?.language ?? "",
  });

  const response = await callISBNdb(`/author/${name}?${params.toString()}`);
  return response as AuthorResponse;
}
