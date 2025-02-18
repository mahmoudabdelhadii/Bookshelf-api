import { NotFound } from "../../../errors.js";
import { callISBNdb } from "./callISBNdb.js";
import { schema } from "database";
export interface BookDetails {
  title: string;
  titleLong?: string;
  isbn: string;
  isbn13?: string;
  deweyDecimal?: string;
  binding?: string;
  publisher?: string;
  language?: (typeof schema.book.language.enumValues)[number];
  datePublished?: string;
  edition?: string;
  pages?: number;
  overview?: string;
  image?: string;
  excerpt?: string;
  synopsis?: string;
  authors?: string[];
  subjects?: string[];
}

export async function fetchBookDetails(isbn: string): Promise<BookDetails> {
  try {
    const response = await callISBNdb(`/book/${isbn}`);
    return response as BookDetails;
  } catch (error: any) {
    if (error.message === "Not found") {
      throw new NotFound(`Book with ISBN ${isbn} not found.`);
    }
    throw error;
  }
}
