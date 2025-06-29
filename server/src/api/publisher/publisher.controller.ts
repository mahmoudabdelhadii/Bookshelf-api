import type { Request, RequestHandler, Response } from "express";
import { PublisherService } from "./publisher.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import type { CreatePublisher, UpdatePublisher } from "./publisher.model.js";

class PublisherController {
  public getPublishers: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await PublisherService.findAll(req.drizzle);
    return handleServiceResponse(serviceResponse, res);
  };

  public getPublisher: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await PublisherService.findById(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };

  public getPublisherByName: RequestHandler = async (req: Request, res: Response) => {
    const name = req.params.name;
    const serviceResponse = await PublisherService.findByName(req.drizzle, name);
    return handleServiceResponse(serviceResponse, res);
  };

  public searchPublishers: RequestHandler = async (req: Request, res: Response) => {
    const query = req.params.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const serviceResponse = await PublisherService.search(req.drizzle, query, page, pageSize);
    return handleServiceResponse(serviceResponse, res);
  };

  public createPublisher: RequestHandler = async (req: Request, res: Response) => {
    const publisherData: CreatePublisher = req.body;
    const serviceResponse = await PublisherService.create(req.drizzle, publisherData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updatePublisher: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const publisherData: UpdatePublisher = req.body;
    const serviceResponse = await PublisherService.update(req.drizzle, id, publisherData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deletePublisher: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await PublisherService.delete(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const publisherController = new PublisherController();