import type { Request, RequestHandler, Response } from "express";
import { BookService } from "./book.service.js";

class BooksController {
  public createBook: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    try {
      const book = await BookService.createBook(drizzle, req.body);
      return res.status(201).json(book);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  public createBooksBulk: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { books } = req.body;
    try {
      const insertedBooks = await BookService.createBooksBulk(drizzle, books);
      return res.status(201).json(insertedBooks);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  public getBook: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const id = req.params.id;
    const book = await BookService.getBookById(drizzle, id);
    if (!book) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.json(book);
  };

  public getBooks: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { title, isbn, author, genre, publishedYear } = req.query;
    const filters = {
      title: title as string | undefined,
      isbn: isbn as string | undefined,
      author: author as string | undefined,
      genre: genre as string | undefined,
      publishedYear: publishedYear ? Number.parseInt(publishedYear as string, 10) : undefined,
    };
    const books = await BookService.getBooks(drizzle, filters);
    return res.json(books);
  };

  public searchBooks: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { search } = req.query;
    if (!search || typeof search !== "string") {
      return res.status(400).json({ message: "Missing 'search' query param" });
    }

    const books = await BookService.searchBooksBySimilarity(drizzle, search);
    return res.json(books);
  };

  public searchBooksWeighted: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { search } = req.query;
    if (!search || typeof search !== "string") {
      return res.status(400).json({ message: "Missing 'search' query param" });
    }

    try {
      const books = await BookService.searchBooksWeighted(drizzle, search);
      return res.json(books);
    } catch (error: any) {
      return res.status(500).json({ message: "Error performing weighted search.", error: error.message });
    }
  };

  public searchBooksBySimilarity: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { search } = req.query;
    if (!search || typeof search !== "string") {
      return res.status(400).json({ message: "Missing 'search' query param" });
    }

    try {
      const books = await BookService.searchBooks(drizzle, search);
      return res.json(books);
    } catch (error: any) {
      return res.status(500).json({ message: "Error performing similarity search.", error: error.message });
    }
  };

  public updateBook: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const id = req.params.id;
    const updatedBook = await BookService.updateBook(drizzle, id, req.body);
    if (!updatedBook) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.json(updatedBook);
  };

  public deleteBook: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const id = req.params.id;
    const deletedBook = await BookService.deleteBook(drizzle, id);
    if (!deletedBook) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.sendStatus(204);
  };
}

export const booksController = new BooksController();