import { type Request, type Response, Router} from "express";
import {serve, setup} from "swagger-ui-express";

import { generateOpenAPIDocument } from "../api-docs/openAPIDocumentGenerator.js";

export const openAPIRouter: Router = Router();
const openAPIDocument = generateOpenAPIDocument();

openAPIRouter.get("/swagger.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openAPIDocument);
});

openAPIRouter.use("/", serve, setup(openAPIDocument));
