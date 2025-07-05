import type { Request, RequestHandler, Response } from "express";
import { BorrowRequestService } from "./borrowRequest.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import type { CreateBorrowRequest, UpdateBorrowRequest } from "./borrowRequest.model.js";

class BorrowRequestController {
  public getBorrowRequests: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      userId: req.query.userId as string,
      libraryId: req.query.libraryId as string,
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };

    const serviceResponse = await BorrowRequestService.findAll(req.drizzle, filters);
    return handleServiceResponse(serviceResponse, res);
  };

  public getBorrowRequest: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await BorrowRequestService.findById(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };

  public getUserBorrowRequests: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;

    const serviceResponse = await BorrowRequestService.findByUser(req.drizzle, userId, page, pageSize);
    return handleServiceResponse(serviceResponse, res);
  };

  public getLibraryBorrowRequests: RequestHandler = async (req: Request, res: Response) => {
    const libraryId = req.params.libraryId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;

    const serviceResponse = await BorrowRequestService.findByLibrary(req.drizzle, libraryId, page, pageSize);
    return handleServiceResponse(serviceResponse, res);
  };

  public createBorrowRequest: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user?.id; // Assuming user ID comes from auth middleware
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const requestData: CreateBorrowRequest = req.body;
    const serviceResponse = await BorrowRequestService.create(req.drizzle, userId, requestData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateBorrowRequest: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const updatedBy = req.user?.id; // Assuming user ID comes from auth middleware
    const updateData: UpdateBorrowRequest = req.body;

    const serviceResponse = await BorrowRequestService.update(req.drizzle, id, updateData, updatedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteBorrowRequest: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await BorrowRequestService.delete(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };

  public approveBorrowRequest: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const approvedBy = req.user?.id;

    if (!approvedBy) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const updateData: UpdateBorrowRequest = {
      status: "approved",
      ...req.body, // Allow override of due date
    };

    const serviceResponse = await BorrowRequestService.update(req.drizzle, id, updateData, approvedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public rejectBorrowRequest: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const rejectedBy = req.user?.id;

    const updateData: UpdateBorrowRequest = {
      status: "rejected",
      notes: req.body.notes, // Allow rejection reason
    };

    const serviceResponse = await BorrowRequestService.update(req.drizzle, id, updateData, rejectedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public borrowBook: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;

    const updateData: UpdateBorrowRequest = {
      status: "borrowed",
    };

    const serviceResponse = await BorrowRequestService.update(req.drizzle, id, updateData);
    return handleServiceResponse(serviceResponse, res);
  };

  public returnBook: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;

    const updateData: UpdateBorrowRequest = {
      status: "returned",
      notes: req.body.notes, // Allow return notes
    };

    const serviceResponse = await BorrowRequestService.update(req.drizzle, id, updateData);
    return handleServiceResponse(serviceResponse, res);
  };

  public getBorrowRequestStats: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      userId: req.query.userId as string,
      libraryId: req.query.libraryId as string,
    };

    const serviceResponse = await BorrowRequestService.getStats(req.drizzle, filters);
    return handleServiceResponse(serviceResponse, res);
  };

  public markOverdueRequests: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await BorrowRequestService.markOverdue(req.drizzle);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const borrowRequestController = new BorrowRequestController();
