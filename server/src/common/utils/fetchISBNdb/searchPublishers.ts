import { callISBNdb } from "./callISBNdb.js";

export interface PublisherSearchResponse {
  total: number;
  publishers: string[];
}

export async function searchPublishers(
  query: string,
  options?: { page?: number; pageSize?: number },
): Promise<PublisherSearchResponse> {
  const params = new URLSearchParams({
    page: options?.page?.toString() ?? "1",
    pageSize: options?.pageSize?.toString() ?? "20",
  });

  const response = await callISBNdb(`/publishers/${query}?${params.toString()}`);
  return response as PublisherSearchResponse;
}
