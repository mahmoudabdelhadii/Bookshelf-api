import type { Request, RequestHandler, Response } from "express";
import { LibraryService } from "./library.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import type { CreateLibrary, UpdateLibrary } from "./library.model.js";

class LibraryController {
  public getLibraries: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await LibraryService.findAll(req.drizzle);
    return handleServiceResponse(serviceResponse, res);
  };

  public getLibrary: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await LibraryService.findById(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createLibrary: RequestHandler = async (req: Request, res: Response) => {
    const libraryData: CreateLibrary = req.body;

    const ownerId = "placeholder-owner-id";
    const serviceResponse = await LibraryService.create(req.drizzle, libraryData, ownerId);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateLibrary: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const libraryData: UpdateLibrary = req.body;
    const serviceResponse = await LibraryService.update(req.drizzle, id, libraryData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteLibrary: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await LibraryService.delete(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const libraryController = new LibraryController();
