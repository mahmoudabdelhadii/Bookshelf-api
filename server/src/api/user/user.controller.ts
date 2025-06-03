import type { RequestHandler } from "express";
import { UserService } from "./user.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import { createUserSchema, updateUserSchema } from "./user.model.js";
import { StatusCodes } from "http-status-codes";

class UserController {
public createUser: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { id, username, email, firstName, lastName } = createUserSchema.parse(req.body);

    try {
      const user = await UserService.createUser(drizzle, { id, username, email, firstName, lastName });
      return handleServiceResponse(ServiceResponse.success("User created", user, StatusCodes.CREATED), res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user";
      return handleServiceResponse(ServiceResponse.failure(message, null, StatusCodes.BAD_REQUEST), res);
    }
  };

public getUsers: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    try {
      const users = await UserService.findAll(drizzle, limit);
      return handleServiceResponse(ServiceResponse.success("Users retrieved", users), res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve users";
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
      const user = await UserService.findById(drizzle, id);
      return handleServiceResponse(ServiceResponse.success("User retrieved", user), res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "User not found";
      return handleServiceResponse(ServiceResponse.failure(message, null, StatusCodes.NOT_FOUND), res);
    }
  };

public updateUser: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { id } = req.params;
    const updates = updateUserSchema.parse(req.body);

    try {
      const user = await UserService.updateUser(drizzle, id, updates);
      return handleServiceResponse(ServiceResponse.success("User updated", user), res);
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "code" in error && error.code === "Not Found"
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      const message = error instanceof Error ? error.message : "Update failed";
      return handleServiceResponse(ServiceResponse.failure(message, null, status), res);
    }
  };

public deleteUser: RequestHandler = async (req, res) => {
    const drizzle = req.drizzle;
    const { id } = req.params;

    try {
      await UserService.deleteUser(drizzle, id);
      return handleServiceResponse(
        ServiceResponse.success("User deleted", null, StatusCodes.NO_CONTENT),
        res,
      );
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "code" in error && error.code === "Not Found"
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST;
      const message = error instanceof Error ? error.message : "Delete failed";
      return handleServiceResponse(ServiceResponse.failure(message, null, status), res);
    }
  };
}

export const userController = new UserController();
