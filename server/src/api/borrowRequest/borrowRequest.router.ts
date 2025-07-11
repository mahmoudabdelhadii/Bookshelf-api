import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { Router } from "express";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { borrowRequestController } from "./borrowRequest.controller.js";
import {
  borrowRequestSchema,
  createBorrowRequestSchema,
  updateBorrowRequestSchema,
  borrowRequestWithDetailsSchema,
  borrowRequestWithDetailsArraySchema,
} from "./borrowRequest.model.js";

export const borrowRequestRegistry = new OpenAPIRegistry();
export const borrowRequestRouter: Router = Router();

borrowRequestRegistry.register("BorrowRequest", borrowRequestSchema);
borrowRequestRegistry.register("CreateBorrowRequest", createBorrowRequestSchema);
borrowRequestRegistry.register("UpdateBorrowRequest", updateBorrowRequestSchema);
borrowRequestRegistry.register("BorrowRequestWithDetails", borrowRequestWithDetailsSchema);

borrowRequestRegistry.registerPath({
  method: "get",
  path: "/borrow-requests",
  tags: ["BorrowRequest"],
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
      libraryId: z.string().uuid().optional(),
      status: z.enum(["pending", "approved", "rejected", "borrowed", "returned", "overdue"]).optional(),
      page: z.coerce.number().min(1).default(1).optional(),
      pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
    }),
  },
  responses: createApiResponse(borrowRequestWithDetailsArraySchema, "Borrow requests retrieved successfully"),
});
borrowRequestRouter.get("/", borrowRequestController.getBorrowRequests);

borrowRequestRegistry.registerPath({
  method: "post",
  path: "/borrow-requests",
  tags: ["BorrowRequest"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createBorrowRequestSchema,
        },
      },
    },
  },
  responses: createApiResponse(borrowRequestSchema, "Borrow request created successfully"),
});
borrowRequestRouter.post("/", borrowRequestController.createBorrowRequest);

borrowRequestRegistry.registerPath({
  method: "get",
  path: "/borrow-requests/stats",
  tags: ["BorrowRequest"],
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
      libraryId: z.string().uuid().optional(),
    }),
  },
  responses: createApiResponse(
    z.object({
      totalRequests: z.number(),
      pendingRequests: z.number(),
      approvedRequests: z.number(),
      rejectedRequests: z.number(),
      borrowedBooks: z.number(),
      overdueBooks: z.number(),
      returnedBooks: z.number(),
    }),
    "Borrow request statistics retrieved successfully",
  ),
});
borrowRequestRouter.get("/stats", borrowRequestController.getBorrowRequestStats);

borrowRequestRegistry.registerPath({
  method: "post",
  path: "/borrow-requests/mark-overdue",
  tags: ["BorrowRequest"],
  responses: createApiResponse(
    z.object({ updatedCount: z.number() }),
    "Overdue requests marked successfully",
  ),
});
borrowRequestRouter.post("/mark-overdue", borrowRequestController.markOverdueRequests);

borrowRequestRegistry.registerPath({
  method: "get",
  path: "/borrow-requests/user/{userId}",
  tags: ["BorrowRequest"],
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({ description: "User ID" }),
    }),
    query: z.object({
      page: z.coerce.number().min(1).default(1).optional(),
      pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
    }),
  },
  responses: createApiResponse(
    borrowRequestWithDetailsArraySchema,
    "User borrow requests retrieved successfully",
  ),
});
borrowRequestRouter.get("/user/:userId", borrowRequestController.getUserBorrowRequests);

borrowRequestRegistry.registerPath({
  method: "get",
  path: "/borrow-requests/library/{libraryId}",
  tags: ["BorrowRequest"],
  request: {
    params: z.object({
      libraryId: z.string().uuid().openapi({ description: "Library ID" }),
    }),
    query: z.object({
      page: z.coerce.number().min(1).default(1).optional(),
      pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
    }),
  },
  responses: createApiResponse(
    borrowRequestWithDetailsArraySchema,
    "Library borrow requests retrieved successfully",
  ),
});
borrowRequestRouter.get("/library/:libraryId", borrowRequestController.getLibraryBorrowRequests);

borrowRequestRegistry.registerPath({
  method: "get",
  path: "/borrow-requests/{id}",
  tags: ["BorrowRequest"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Borrow request ID" }),
    }),
  },
  responses: createApiResponse(borrowRequestWithDetailsSchema, "Borrow request retrieved successfully"),
});
borrowRequestRouter.get("/:id", borrowRequestController.getBorrowRequest);

borrowRequestRegistry.registerPath({
  method: "patch",
  path: "/borrow-requests/{id}",
  tags: ["BorrowRequest"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Borrow request ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: updateBorrowRequestSchema,
        },
      },
    },
  },
  responses: createApiResponse(borrowRequestSchema, "Borrow request updated successfully"),
});
borrowRequestRouter.patch("/:id", borrowRequestController.updateBorrowRequest);

borrowRequestRegistry.registerPath({
  method: "delete",
  path: "/borrow-requests/{id}",
  tags: ["BorrowRequest"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Borrow request ID" }),
    }),
  },
  responses: createApiResponse(z.null(), "Borrow request deleted successfully"),
});
borrowRequestRouter.delete("/:id", borrowRequestController.deleteBorrowRequest);

borrowRequestRegistry.registerPath({
  method: "post",
  path: "/borrow-requests/{id}/approve",
  tags: ["BorrowRequest"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Borrow request ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            dueDate: z.date().optional(),
          }),
        },
      },
    },
  },
  responses: createApiResponse(borrowRequestSchema, "Borrow request approved successfully"),
});
borrowRequestRouter.post("/:id/approve", borrowRequestController.approveBorrowRequest);

borrowRequestRegistry.registerPath({
  method: "post",
  path: "/borrow-requests/{id}/reject",
  tags: ["BorrowRequest"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Borrow request ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: createApiResponse(borrowRequestSchema, "Borrow request rejected successfully"),
});
borrowRequestRouter.post("/:id/reject", borrowRequestController.rejectBorrowRequest);

borrowRequestRegistry.registerPath({
  method: "post",
  path: "/borrow-requests/{id}/borrow",
  tags: ["BorrowRequest"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Borrow request ID" }),
    }),
  },
  responses: createApiResponse(borrowRequestSchema, "Book borrowed successfully"),
});
borrowRequestRouter.post("/:id/borrow", borrowRequestController.borrowBook);

borrowRequestRegistry.registerPath({
  method: "post",
  path: "/borrow-requests/{id}/return",
  tags: ["BorrowRequest"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Borrow request ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: createApiResponse(borrowRequestSchema, "Book returned successfully"),
});
borrowRequestRouter.post("/:id/return", borrowRequestController.returnBook);
