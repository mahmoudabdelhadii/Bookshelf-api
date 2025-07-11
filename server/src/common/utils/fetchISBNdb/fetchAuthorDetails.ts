import { callISBNdb } from "./callISBNdb.js";

type ISBNdbAuthorResponse = any;

export async function fetchAuthorDetails(
  name: string,
  options?: { page?: number; pageSize?: number; language?: string },
): Promise<ISBNdbAuthorResponse> {
  const params = new URLSearchParams({
    page: options?.page?.toString() ?? "1",
    pageSize: options?.pageSize?.toString() ?? "20",
    language: options?.language ?? "",
  });

  const response = await callISBNdb<ISBNdbAuthorResponse>(`/author/${name}?${params.toString()}`);
  return response;
}
