import type { Request, RequestHandler, Response } from "express";
import { UserService } from "./user.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import { StatusCodes } from "http-status-codes";

class UserController {
  public createUser: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { id, username, email, firstName, lastName } = req.body;
    let serviceResponse;
    try {
      const user = await UserService.createUser(drizzle, { id, username, email, firstName, lastName });
      serviceResponse = ServiceResponse.success("User created", user, StatusCodes.CREATED);
    } catch (error: any) {
      serviceResponse = ServiceResponse.failure(error.message, null, StatusCodes.BAD_REQUEST);
    }

    return handleServiceResponse(serviceResponse, res);
  };

  public getUsers: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { limit } = req.query;
    let serviceResponse;
    try {
      const users = await UserService.findAll(drizzle, limit ? Number(limit) : 50);
      serviceResponse = ServiceResponse.success("Users retrieved", users, StatusCodes.OK);
    } catch (error: any) {
      serviceResponse = ServiceResponse.failure(error.message, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    return handleServiceResponse(serviceResponse, res);
  };

  public getUser: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { id } = req.params;
    let serviceResponse;
    try {
      const user = await UserService.findById(drizzle, id);
      serviceResponse = ServiceResponse.success("User retrieved", user, StatusCodes.OK);
    } catch (error: any) {
      serviceResponse = ServiceResponse.failure(error.message, null, StatusCodes.NOT_FOUND);
    }

    return handleServiceResponse(serviceResponse, res);
  };

  public updateUser: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { id } = req.params;
    const updates = req.body;
    let serviceResponse;
    try {
      const user = await UserService.updateUser(drizzle, id, updates);
      serviceResponse = ServiceResponse.success("User updated", user, StatusCodes.OK);
    } catch (error: any) {
      const status = error.code === "Not Found" ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST;
      serviceResponse = ServiceResponse.failure(error.message, null, status);
    }

    return handleServiceResponse(serviceResponse, res);
  };

  public deleteUser: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;
    const { id } = req.params;
    let serviceResponse;
    try {
      await UserService.deleteUser(drizzle, id);
      // User deleted successfully, no content
      serviceResponse = ServiceResponse.success("User deleted", null, StatusCodes.NO_CONTENT);
    } catch (error: any) {
      const status = error.code === "Not Found" ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST;
      serviceResponse = ServiceResponse.failure(error.message, null, status);
    }

    return handleServiceResponse(serviceResponse, res);
  };
}

export const userController = new UserController();