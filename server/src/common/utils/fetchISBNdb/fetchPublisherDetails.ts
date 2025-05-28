import { callISBNdb } from "./callISBNdb.js";
import type {
  Publisher as ISBNdbPublisherResponse,
} from "../../types/shared/isbndbAPI.js";

export async function fetchPublisherDetails(
  name: string,
  options?: { page?: number; pageSize?: number; language?: string },
): Promise<ISBNdbPublisherResponse> {
  const params = new URLSearchParams({
    page: options?.page?.toString() ?? "1",
    pageSize: options?.pageSize?.toString() ?? "20",
    language: options?.language ?? "",
  });

  const response = await callISBNdb<ISBNdbPublisherResponse>(
    `/publisher/${name}?${params.toString()}`,
  );
  return response;
}
