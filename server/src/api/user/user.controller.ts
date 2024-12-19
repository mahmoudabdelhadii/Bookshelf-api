import type { Request, RequestHandler, Response } from "express";

import { userService } from "./user.service.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";

class UserController {
  public getUsers: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;

    const books = await drizzle.query.book.findMany();
    console.log(books);
    const serviceResponse = await userService.findAll(drizzle);
    return handleServiceResponse(serviceResponse, res);
  };

  public getUser: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id
    const serviceResponse = await userService.findById(req.drizzle,id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const userController = new UserController();
