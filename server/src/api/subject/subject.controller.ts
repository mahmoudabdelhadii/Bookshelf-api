import type { Request, RequestHandler, Response } from "express";
import { SubjectService } from "./subject.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import type { CreateSubject, UpdateSubject } from "./subject.model.js";

class SubjectController {
  public getSubjects: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await SubjectService.findAll(req.drizzle);
    return handleServiceResponse(serviceResponse, res);
  };

  public getSubject: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await SubjectService.findById(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };

  public getSubjectHierarchy: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await SubjectService.getHierarchy(req.drizzle);
    return handleServiceResponse(serviceResponse, res);
  };

  public createSubject: RequestHandler = async (req: Request, res: Response) => {
    const subjectData: CreateSubject = req.body;
    const serviceResponse = await SubjectService.create(req.drizzle, subjectData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateSubject: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const subjectData: UpdateSubject = req.body;
    const serviceResponse = await SubjectService.update(req.drizzle, id, subjectData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteSubject: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await SubjectService.delete(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const subjectController = new SubjectController();
