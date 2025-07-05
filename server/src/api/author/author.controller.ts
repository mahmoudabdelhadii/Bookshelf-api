import type { Request, RequestHandler, Response } from "express";
import { AuthorService } from "./author.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import type { CreateAuthor, UpdateAuthor } from "./author.model.js";

class AuthorController {
  public getAuthors: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await AuthorService.findAll(req.drizzle);
    return handleServiceResponse(serviceResponse, res);
  };

  public getAuthor: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await AuthorService.findById(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };

  public getAuthorByName: RequestHandler = async (req: Request, res: Response) => {
    const name = req.params.name;
    const serviceResponse = await AuthorService.findByName(req.drizzle, name);
    return handleServiceResponse(serviceResponse, res);
  };

  public searchAuthors: RequestHandler = async (req: Request, res: Response) => {
    const query = req.params.query;
    const page = parseInt(req.query.page as string) ?? 1;
    const pageSize = parseInt(req.query.pageSize as string) ?? 20;
    const serviceResponse = await AuthorService.search(req.drizzle, query, page, pageSize);
    return handleServiceResponse(serviceResponse, res);
  };

  public createAuthor: RequestHandler = async (req: Request, res: Response) => {
    const authorData: CreateAuthor = req.body;
    const serviceResponse = await AuthorService.create(req.drizzle, authorData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateAuthor: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const authorData: UpdateAuthor = req.body;
    const serviceResponse = await AuthorService.update(req.drizzle, id, authorData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteAuthor: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await AuthorService.delete(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const authorController = new AuthorController();
