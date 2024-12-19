import { StatusCodes } from "http-status-codes";

import type { User } from "./user.model.js";
import { ServiceResponse } from "../../common/models/serviceResponse.js";
import { logger } from "../../server.js";
import { DrizzleClient, schema } from "database";

export class UserService {
  
  async findAll(drizzle:DrizzleClient): Promise<ServiceResponse<User[] | null>> {
    try {
      const users = await drizzle.query.user.findMany();

      if (!users || users.length === 0) {
        return ServiceResponse.failure("No Users found", null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<User[]>("Users found", users);
    } catch (ex) {
      const errorMessage = `Error finding all users: ${(ex as Error).message}`;
      logger.error(errorMessage);

      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  
  async findById(drizzle:DrizzleClient,id: string): Promise<ServiceResponse<User | null>> {
    try {
      
      const user = await drizzle.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, id),
      });

      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<User>("User found", user);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);

      return ServiceResponse.failure(
        "An error occurred while finding user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const userService = new UserService();