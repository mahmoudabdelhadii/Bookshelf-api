import type { Request, RequestHandler, Response } from "express";
import { BookService } from "./book.service.js";

class BooksController {
  public createBook: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    try {
      const book = await BookService.createBook(drizzle, req.body);
      return res.status(201).json(book);
    } catch (error: any) {
      return res.status(error.statusCode ?? 400).json({ message: error.message });
    }
  };

  public createBooksBulk: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { books } = req.body;
    try {
      const insertedBooks = await BookService.createBooksBulk(drizzle, books);
      return res.status(201).json(insertedBooks);
    } catch (error: any) {
      return res.status(error.statusCode ?? 400).json({ message: error.message });
    }
  };

  public getBook: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const id = req.params.id;
    try {
      const book = await BookService.getBookById(drizzle, id);
      return res.json(book);
    } catch (error: any) {
      return res.status(error.statusCode ?? 404).json({ message: error.message });
    }
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
    try {
      const books = await BookService.getBooks(drizzle, filters);
      return res.json(books);
    } catch (error: any) {
      return res.status(error.statusCode ?? 400).json({ message: error.message });
    }
  };

  public searchBooks: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { search } = req.query as { search: string };
    if (!search) {
      return res.status(400).json({ message: "Missing 'search' query param" });
    }

    try {
      const books = await BookService.searchBooksByTrigram(drizzle, search);
      return res.json(books);
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({ message: error.message });
    }
  };

  public updateBook: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const id = req.params.id;
    try {
      const updatedBook = await BookService.updateBook(drizzle, id, req.body);
      return res.json(updatedBook);
    } catch (error: any) {
      return res.status(error.statusCode ?? 404).json({ message: error.message });
    }
  };

  public deleteBook: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const id = req.params.id;
    try {
      await BookService.deleteBook(drizzle, id);
      return res.sendStatus(204);
    } catch (error: any) {
      return res.status(error.statusCode ?? 404).json({ message: error.message });
    }
  };

  public getAuthorDetails: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { name } = req.params;
    const { page = "1", pageSize = "20", language } = req.query;
    try {
      const data = await BookService.getAuthorDetails(
        drizzle,
        name,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
        language as "en" | "ar" | "other",
      );
      return res.json(data);
    } catch (error: any) {
      return res.status(error.statusCode ?? 404).json({ message: error.message });
    }
  };

  public searchAuthors: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { query } = req.params;
    const { page = "1", pageSize = "20" } = req.query;
    try {
      const data = await BookService.searchAuthors(
        drizzle,
        query,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
      );
      return res.json(data);
    } catch (error: any) {
      return res.status(error.statusCode ?? 404).json({ message: error.message });
    }
  };

  public getBookByISBN: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { isbn } = req.params;
    const { with_prices } = req.query;
    try {
      const data = await BookService.getBookByISBN(drizzle, isbn);
      return res.json(data);
    } catch (error: any) {
      return res.status(error.statusCode ?? 404).json({ message: error.message });
    }
  };
  public searchBooksWeighted: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { search } = req.query as { search: string };
    if (!search) {
      return res.status(400).json({ message: "Missing 'search' query param" });
    }

    try {
      const books = await BookService.searchBooksByWeighted(drizzle, search);
      return res.json(books);
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({ message: error.message });
    }
  };

  public getPublisherDetails: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { name } = req.params;
    const { page = "1", pageSize = "20", language } = req.query;
    try {
      const data = await BookService.getPublisherDetails(
        drizzle,
        name,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
        language as "en" | "ar" | "other",
      );
      return res.json(data);
    } catch (error: any) {
      return res.status(error.statusCode ?? 404).json({ message: error.message });
    }
  };

  public searchPublishers: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { query } = req.params;
    const { page = "1", pageSize = "20" } = req.query;
    try {
      const data = await BookService.searchPublishers(
        drizzle,
        query,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
      );
      return res.json(data);
    } catch (error: any) {
      return res.status(error.statusCode ?? 404).json({ message: error.message });
    }
  };

  public searchAll: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { index } = req.params;
    const { page = "1", pageSize = "20", isbn, isbn13, author, text, subject, publisher } = req.query;

    try {
      if (!["books", "authors", "publishers"].includes(index)) {
        return res
          .status(400)
          .json({ message: "Invalid index. Valid indices are 'books', 'authors', 'publishers'." });
      }

      const data = await BookService.searchAll(
        drizzle,
        index as "books" | "authors" | "publishers",
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
        {
          isbn: isbn as string | undefined,
          isbn13: isbn13 as string | undefined,
          author: author as string | undefined,
          text: text as string | undefined,
          subject: subject as string | undefined,
          publisher: publisher as string | undefined,
        },
      );

      return res.json({ data });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({ message: error.message });
    }
  };
}

export const booksController = new BooksController();
