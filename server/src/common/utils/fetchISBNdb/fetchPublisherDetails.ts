import { callISBNdb } from "./callISBNdb.js";
import { schema } from "database";
export interface PublisherResponse {
  name: string;
  books: (typeof schema.book.$inferSelect)[];
}

export async function fetchPublisherDetails(
  name: string,
  options?: { page?: number; pageSize?: number; language?: string },
): Promise<PublisherResponse> {
  const params = new URLSearchParams({
    page: options?.page?.toString() ?? "1",
    pageSize: options?.pageSize?.toString() ?? "20",
    language: options?.language ?? "",
  });

  const response = await callISBNdb(`/publisher/${name}?${params.toString()}`);
  return response as PublisherResponse;
}
