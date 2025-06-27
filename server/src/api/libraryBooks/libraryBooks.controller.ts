import type { Request, RequestHandler, Response } from "express";
import { LibraryBooksService } from "./libraryBooks.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import type { CreateLibraryBook, UpdateLibraryBook } from "./libraryBooks.model.js";

class LibraryBooksController {
  public getLibraryBooks: RequestHandler = async (req: Request, res: Response) => {
    const libraryId = req.params.libraryId;
    const serviceResponse = await LibraryBooksService.findByLibraryId(req.drizzle, libraryId);
    return handleServiceResponse(serviceResponse, res);
  };

  public getAllLibraryBooks: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await LibraryBooksService.findAllLibraryBooks(req.drizzle);
    return handleServiceResponse(serviceResponse, res);
  };

  public getLibraryBook: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await LibraryBooksService.findById(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };

  public addBookToLibrary: RequestHandler = async (req: Request, res: Response) => {
    const libraryBookData: CreateLibraryBook = req.body;
    const serviceResponse = await LibraryBooksService.addBookToLibrary(req.drizzle, libraryBookData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateLibraryBook: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const libraryBookData: UpdateLibraryBook = req.body;
    const serviceResponse = await LibraryBooksService.updateLibraryBook(req.drizzle, id, libraryBookData);
    return handleServiceResponse(serviceResponse, res);
  };

  public removeBookFromLibrary: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await LibraryBooksService.removeBookFromLibrary(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const libraryBooksController = new LibraryBooksController();