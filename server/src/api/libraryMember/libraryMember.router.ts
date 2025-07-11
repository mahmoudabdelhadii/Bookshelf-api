import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { Router } from "express";
import { z } from "zod";

import { createApiResponse } from "../../api-docs/openAPIResponseBuilders.js";
import { libraryMemberController } from "./libraryMember.controller.js";
import {
  libraryMemberSchema,
  createLibraryMemberSchema,
  updateLibraryMemberSchema,
  libraryMemberWithDetailsSchema,
  libraryMemberWithStatsSchema,
} from "./libraryMember.model.js";

export const libraryMemberRegistry = new OpenAPIRegistry();
export const libraryMemberRouter: Router = Router();

libraryMemberRegistry.register("LibraryMember", libraryMemberSchema);
libraryMemberRegistry.register("CreateLibraryMember", createLibraryMemberSchema);
libraryMemberRegistry.register("UpdateLibraryMember", updateLibraryMemberSchema);
libraryMemberRegistry.register("LibraryMemberWithDetails", libraryMemberWithDetailsSchema);
libraryMemberRegistry.register("LibraryMemberWithStats", libraryMemberWithStatsSchema);

libraryMemberRegistry.registerPath({
  method: "get",
  path: "/library-members",
  tags: ["LibraryMember"],
  request: {
    query: z.object({
      libraryId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      role: z.enum(["owner", "manager", "staff", "member"]).optional(),
      isActive: z.coerce.boolean().optional(),
      page: z.coerce.number().min(1).default(1).optional(),
      pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
    }),
  },
  responses: createApiResponse(
    z.array(libraryMemberWithDetailsSchema),
    "Library members retrieved successfully",
  ),
});
libraryMemberRouter.get("/", libraryMemberController.getLibraryMembers);

libraryMemberRegistry.registerPath({
  method: "post",
  path: "/library-members",
  tags: ["LibraryMember"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createLibraryMemberSchema,
        },
      },
    },
  },
  responses: createApiResponse(libraryMemberSchema, "Library member created successfully"),
});
libraryMemberRouter.post("/", libraryMemberController.createLibraryMember);

libraryMemberRegistry.registerPath({
  method: "get",
  path: "/library-members/library/{libraryId}",
  tags: ["LibraryMember"],
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
    z.array(libraryMemberWithDetailsSchema),
    "Library members retrieved successfully",
  ),
});
libraryMemberRouter.get("/library/:libraryId", libraryMemberController.getLibraryMembersByLibrary);

libraryMemberRegistry.registerPath({
  method: "get",
  path: "/library-members/library/{libraryId}/stats",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      libraryId: z.string().uuid().openapi({ description: "Library ID" }),
    }),
  },
  responses: createApiResponse(
    z.object({
      totalMembers: z.number(),
      activeMembers: z.number(),
      inactiveMembers: z.number(),
      owners: z.number(),
      managers: z.number(),
      staff: z.number(),
      members: z.number(),
    }),
    "Library member statistics retrieved successfully",
  ),
});
libraryMemberRouter.get("/library/:libraryId/stats", libraryMemberController.getLibraryMemberStats);

libraryMemberRegistry.registerPath({
  method: "post",
  path: "/library-members/library/{libraryId}/invite",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      libraryId: z.string().uuid().openapi({ description: "Library ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().uuid().openapi({ description: "ID of the user to invite" }),
            role: z
              .enum(["owner", "manager", "staff", "member"])
              .default("member")
              .openapi({ description: "Role to assign" }),
            permissions: z.array(z.string()).optional().openapi({ description: "Permissions to grant" }),
          }),
        },
      },
    },
  },
  responses: createApiResponse(libraryMemberSchema, "User invited to library successfully"),
});
libraryMemberRouter.post("/library/:libraryId/invite", libraryMemberController.inviteLibraryMember);

libraryMemberRegistry.registerPath({
  method: "delete",
  path: "/library-members/library/{libraryId}/leave",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      libraryId: z.string().uuid().openapi({ description: "Library ID" }),
    }),
  },
  responses: createApiResponse(z.null(), "Left library successfully"),
});
libraryMemberRouter.delete("/library/:libraryId/leave", libraryMemberController.leaveLibrary);

libraryMemberRegistry.registerPath({
  method: "get",
  path: "/library-members/user/{userId}",
  tags: ["LibraryMember"],
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
    z.array(libraryMemberWithDetailsSchema),
    "User library memberships retrieved successfully",
  ),
});
libraryMemberRouter.get("/user/:userId", libraryMemberController.getUserLibraryMemberships);

libraryMemberRegistry.registerPath({
  method: "get",
  path: "/library-members/user/{userId}/library/{libraryId}",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      userId: z.string().uuid().openapi({ description: "User ID" }),
      libraryId: z.string().uuid().openapi({ description: "Library ID" }),
    }),
  },
  responses: createApiResponse(
    libraryMemberWithDetailsSchema,
    "User library membership retrieved successfully",
  ),
});
libraryMemberRouter.get("/user/:userId/library/:libraryId", libraryMemberController.getUserInLibrary);

libraryMemberRegistry.registerPath({
  method: "get",
  path: "/library-members/{id}",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Library member ID" }),
    }),
  },
  responses: createApiResponse(libraryMemberWithDetailsSchema, "Library member retrieved successfully"),
});
libraryMemberRouter.get("/:id", libraryMemberController.getLibraryMember);

libraryMemberRegistry.registerPath({
  method: "get",
  path: "/library-members/{id}/stats",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Library member ID" }),
    }),
  },
  responses: createApiResponse(
    libraryMemberWithStatsSchema,
    "Library member with stats retrieved successfully",
  ),
});
libraryMemberRouter.get("/:id/stats", libraryMemberController.getLibraryMemberWithStats);

libraryMemberRegistry.registerPath({
  method: "patch",
  path: "/library-members/{id}",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Library member ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: updateLibraryMemberSchema,
        },
      },
    },
  },
  responses: createApiResponse(libraryMemberSchema, "Library member updated successfully"),
});
libraryMemberRouter.patch("/:id", libraryMemberController.updateLibraryMember);

libraryMemberRegistry.registerPath({
  method: "delete",
  path: "/library-members/{id}",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Library member ID" }),
    }),
  },
  responses: createApiResponse(z.null(), "Library member removed successfully"),
});
libraryMemberRouter.delete("/:id", libraryMemberController.removeLibraryMember);

libraryMemberRegistry.registerPath({
  method: "post",
  path: "/library-members/{id}/activate",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Library member ID" }),
    }),
  },
  responses: createApiResponse(libraryMemberSchema, "Library member activated successfully"),
});
libraryMemberRouter.post("/:id/activate", libraryMemberController.activateLibraryMember);

libraryMemberRegistry.registerPath({
  method: "post",
  path: "/library-members/{id}/deactivate",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Library member ID" }),
    }),
  },
  responses: createApiResponse(libraryMemberSchema, "Library member deactivated successfully"),
});
libraryMemberRouter.post("/:id/deactivate", libraryMemberController.deactivateLibraryMember);

libraryMemberRegistry.registerPath({
  method: "patch",
  path: "/library-members/{id}/role",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Library member ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            role: z
              .enum(["owner", "manager", "staff", "member"])
              .openapi({ description: "New role for the member" }),
          }),
        },
      },
    },
  },
  responses: createApiResponse(libraryMemberSchema, "Member role updated successfully"),
});
libraryMemberRouter.patch("/:id/role", libraryMemberController.updateMemberRole);

libraryMemberRegistry.registerPath({
  method: "patch",
  path: "/library-members/{id}/permissions",
  tags: ["LibraryMember"],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Library member ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            permissions: z.array(z.string()).openapi({ description: "Array of permission strings" }),
          }),
        },
      },
    },
  },
  responses: createApiResponse(libraryMemberSchema, "Member permissions updated successfully"),
});
libraryMemberRouter.patch("/:id/permissions", libraryMemberController.updateMemberPermissions);
