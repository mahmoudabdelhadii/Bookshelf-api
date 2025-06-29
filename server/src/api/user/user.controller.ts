import type { RequestHandler } from "express";
import { UserService } from "./user.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import { createUserSchema, updateUserSchema } from "./user.model.js";
import { StatusCodes } from "http-status-codes";

class UserController {
  public createUser: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;

    try {
      const userData = createUserSchema.parse(req.body);
      const serviceResponse = await UserService.createUser(drizzle, userData);
      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      return handleServiceResponse(
        ServiceResponse.failure(message, null, StatusCodes.UNPROCESSABLE_ENTITY),
        res,
      );
    }
  };

  public getUsers: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    try {
      const serviceResponse = await UserService.findAll(drizzle, limit);
      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to retrieve users";
      return handleServiceResponse(
        ServiceResponse.failure(message, null, StatusCodes.INTERNAL_SERVER_ERROR),
        res,
      );
    }
  };

  public getUser: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { id } = req.params;

    try {
      const serviceResponse = await UserService.findById(drizzle, id);
      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "User not found";
      return handleServiceResponse(ServiceResponse.failure(message, null, StatusCodes.NOT_FOUND), res);
    }
  };

  public updateUser: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { id } = req.params;

    try {
      const updates = updateUserSchema.parse(req.body);
      const serviceResponse = await UserService.updateUser(drizzle, id, updates);
      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      const status =
        typeof err === "object" && err !== null && "code" in err && err.code === "Not Found"
          ? StatusCodes.NOT_FOUND
          : StatusCodes.UNPROCESSABLE_ENTITY;
      const message = err instanceof Error ? err.message : "Update failed";
      return handleServiceResponse(ServiceResponse.failure(message, null, status), res);
    }
  };

  public deleteUser: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { id } = req.params;

    try {
      const serviceResponse = await UserService.deleteUser(drizzle, id);
      return handleServiceResponse(serviceResponse, res);
    } catch (err) {
      const status =
        typeof err === "object" && err !== null && "code" in err && err.code === "Not Found"
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      const message = err instanceof Error ? err.message : "Delete failed";
      return handleServiceResponse(ServiceResponse.failure(message, null, status), res);
    }
  };
}

export const userController = new UserController();
