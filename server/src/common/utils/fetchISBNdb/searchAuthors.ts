import { callISBNdb } from "./callISBNdb.js";

type ISBNdbAuthorQueryResults = {
  authors?: any[];
  [key: string]: any;
};
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
