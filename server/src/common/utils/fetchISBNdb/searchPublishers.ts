import { callISBNdb } from "./callISBNdb.js";
type ISBNdbPublisherResponse = {
  name?: string;
  [key: string]: any;
};
export interface PublisherSearchResponse {
  total: number;
  publishers: ISBNdbPublisherResponse[];
}

export async function searchPublishers(
  query: string,
  options?: { page?: number; pageSize?: number },
): Promise<PublisherSearchResponse> {
  const params = new URLSearchParams({
    page: options?.page?.toString() ?? "1",
    pageSize: options?.pageSize?.toString() ?? "20",
  });

  const response = await callISBNdb<{ total: number; publishers: ISBNdbPublisherResponse[] }>(
    `/publishers/${query}?${params.toString()}`,
  );
  return response;
}
