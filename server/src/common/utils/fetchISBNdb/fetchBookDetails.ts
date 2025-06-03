import { NotFound } from "../../../errors.js";
import { callISBNdb } from "./callISBNdb.js";
import type { Book as ISBNdbBookResponse } from "../../types/shared/isbndbAPI.js";

export async function fetchBookDetails(isbn: string): Promise<ISBNdbBookResponse> {
  try {
    const response = await callISBNdb<ISBNdbBookResponse>(`/book/${isbn}`);
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Not found") {
      throw new NotFound(`Book with ISBN ${isbn} not found.`);
    }
    throw error;
  }
}
