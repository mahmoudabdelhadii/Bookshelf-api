import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";

import { healthCheckRouter } from "../healthCheckRouter.js";
import type { ServiceResponse } from "../../../common/models/serviceResponse.js";

describe("Health Check API endpoints", () => {
  let app: Express;
  beforeAll(() => {
    app = express();
    app.use("/health-check", healthCheckRouter);
  });

  it("GET /health-check - success", async () => {
    const response = await request(app).get("/health-check");
    const result = response.body as ServiceResponse;

    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(result.success).toBe(true);
    expect(result.responseObject).toBeNull();
    expect(result.message).toEqual("Service is healthy");
  });
});
