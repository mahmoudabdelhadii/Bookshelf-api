import type { Request, RequestHandler, Response } from "express";

import { userService } from "../../api/user/userService.js";
import { handleServiceResponse } from "../../common/utils/httpHandlers.js";

class UserController {
  public getUsers: RequestHandler = async (req: Request, res: Response) => {
    const drizzle = req.drizzle;

    const books = await drizzle.query.books.findMany();
    console.log(books);
    const serviceResponse = await userService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getUser: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await userService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const userController = new UserController();
