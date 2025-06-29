import type { Request, RequestHandler, Response } from "express";
import { LibraryMemberService } from "./libraryMember.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import type { CreateLibraryMember, UpdateLibraryMember } from "./libraryMember.model.js";

class LibraryMemberController {
  public getLibraryMembers: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      libraryId: req.query.libraryId as string,
      userId: req.query.userId as string,
      role: req.query.role as string,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    };

    const serviceResponse = await LibraryMemberService.findAll(req.drizzle, filters);
    return handleServiceResponse(serviceResponse, res);
  };

  public getLibraryMember: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await LibraryMemberService.findById(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };

  public getLibraryMembersByLibrary: RequestHandler = async (req: Request, res: Response) => {
    const libraryId = req.params.libraryId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
    
    const serviceResponse = await LibraryMemberService.findByLibrary(req.drizzle, libraryId, page, pageSize);
    return handleServiceResponse(serviceResponse, res);
  };

  public getUserLibraryMemberships: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
    
    const serviceResponse = await LibraryMemberService.findByUser(req.drizzle, userId, page, pageSize);
    return handleServiceResponse(serviceResponse, res);
  };

  public getUserInLibrary: RequestHandler = async (req: Request, res: Response) => {
    const { userId, libraryId } = req.params;
    const serviceResponse = await LibraryMemberService.findUserInLibrary(req.drizzle, userId, libraryId);
    return handleServiceResponse(serviceResponse, res);
  };

  public createLibraryMember: RequestHandler = async (req: Request, res: Response) => {
    const invitedBy = req.user?.id; // Assuming user ID comes from auth middleware
    const memberData: CreateLibraryMember = req.body;
    
    const serviceResponse = await LibraryMemberService.create(req.drizzle, memberData, invitedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public inviteLibraryMember: RequestHandler = async (req: Request, res: Response) => {
    const libraryId = req.params.libraryId;
    const invitedBy = req.user?.id;
    
    if (!invitedBy) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const memberData: CreateLibraryMember = {
      ...req.body,
      libraryId,
    };
    
    const serviceResponse = await LibraryMemberService.create(req.drizzle, memberData, invitedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateLibraryMember: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const updatedBy = req.user?.id; // Assuming user ID comes from auth middleware
    const updateData: UpdateLibraryMember = req.body;
    
    const serviceResponse = await LibraryMemberService.update(req.drizzle, id, updateData, updatedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public removeLibraryMember: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const deletedBy = req.user?.id; // Assuming user ID comes from auth middleware
    
    const serviceResponse = await LibraryMemberService.delete(req.drizzle, id, deletedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public leaveLibrary: RequestHandler = async (req: Request, res: Response) => {
    const libraryId = req.params.libraryId;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Find the user's membership in this library
    const membershipResponse = await LibraryMemberService.findUserInLibrary(req.drizzle, userId, libraryId);
    
    if (!membershipResponse.success || !membershipResponse.responseObject) {
      return handleServiceResponse(membershipResponse, res);
    }

    const membership = membershipResponse.responseObject;
    const serviceResponse = await LibraryMemberService.delete(req.drizzle, membership.id);
    return handleServiceResponse(serviceResponse, res);
  };

  public getLibraryMemberWithStats: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const serviceResponse = await LibraryMemberService.getWithStats(req.drizzle, id);
    return handleServiceResponse(serviceResponse, res);
  };

  public getLibraryMemberStats: RequestHandler = async (req: Request, res: Response) => {
    const libraryId = req.params.libraryId;
    const serviceResponse = await LibraryMemberService.getLibraryStats(req.drizzle, libraryId);
    return handleServiceResponse(serviceResponse, res);
  };

  public activateLibraryMember: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const updatedBy = req.user?.id;
    
    const updateData: UpdateLibraryMember = {
      isActive: true,
    };
    
    const serviceResponse = await LibraryMemberService.update(req.drizzle, id, updateData, updatedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public deactivateLibraryMember: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const updatedBy = req.user?.id;
    
    const updateData: UpdateLibraryMember = {
      isActive: false,
    };
    
    const serviceResponse = await LibraryMemberService.update(req.drizzle, id, updateData, updatedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateMemberRole: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const updatedBy = req.user?.id;
    
    const updateData: UpdateLibraryMember = {
      role: req.body.role,
    };
    
    const serviceResponse = await LibraryMemberService.update(req.drizzle, id, updateData, updatedBy);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateMemberPermissions: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    const updatedBy = req.user?.id;
    
    const updateData: UpdateLibraryMember = {
      permissions: req.body.permissions,
    };
    
    const serviceResponse = await LibraryMemberService.update(req.drizzle, id, updateData, updatedBy);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const libraryMemberController = new LibraryMemberController();