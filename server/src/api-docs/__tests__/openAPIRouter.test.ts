import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";

import { openAPIRouter } from "../openAPIRouter.js";
import { generateOpenAPIDocument } from "../openAPIDocumentGenerator.js";

describe("OpenAPI Router", () => {
  let app: Express;
  beforeAll(() => {
    app = express();
    app.use(openAPIRouter);
  });

  it("GET /swagger.json returns the OpenAPI spec", async () => {
    const expected = generateOpenAPIDocument();
    const response = await request(app).get("/swagger.json");
    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(response.type).toBe("application/json");
    expect(response.body).toEqual(expected);
  });

  it("GET / serves the Swagger UI", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.text).toContain("swagger-ui");
  });
});
