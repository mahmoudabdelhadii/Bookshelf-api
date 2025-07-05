import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

// Common sorting and pagination schemas
export const sortOrderSchema = z.enum(["asc", "desc"]).default("asc").openapi({
  description: "Sort order - ascending or descending",
});

export const paginationSchema = z
  .object({
    page: z.coerce.number().min(1).default(1).openapi({
      description: "Page number for pagination",
    }),
    pageSize: z.coerce.number().min(1).max(100).default(20).openapi({
      description: "Number of items per page",
    }),
  })
  .openapi({
    description: "Pagination parameters",
  });

export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date().optional().openapi({
      description: "Start date for filtering",
    }),
    endDate: z.coerce.date().optional().openapi({
      description: "End date for filtering",
    }),
  })
  .openapi({
    description: "Date range filter",
  });

// Book search filters
export const bookSearchFiltersSchema = z
  .object({
    query: z.string().optional().openapi({
      description: "General search query across title, author, ISBN",
    }),
    title: z.string().optional().openapi({
      description: "Search by book title",
    }),
    authorId: z.string().uuid().optional().openapi({
      description: "Filter by author ID",
    }),
    authorName: z.string().optional().openapi({
      description: "Search by author name",
    }),
    publisherId: z.string().uuid().optional().openapi({
      description: "Filter by publisher ID",
    }),
    publisherName: z.string().optional().openapi({
      description: "Search by publisher name",
    }),
    subjectId: z.string().uuid().optional().openapi({
      description: "Filter by subject/category ID",
    }),
    isbn: z.string().optional().openapi({
      description: "Search by ISBN",
    }),
    language: z.string().optional().openapi({
      description: "Filter by language",
    }),
    publishedYear: z.coerce.number().optional().openapi({
      description: "Filter by publication year",
    }),
    publishedDateRange: dateRangeSchema.optional(),
    minPages: z.coerce.number().min(1).optional().openapi({
      description: "Minimum number of pages",
    }),
    maxPages: z.coerce.number().min(1).optional().openapi({
      description: "Maximum number of pages",
    }),
    format: z.enum(["hardcover", "paperback", "ebook", "audiobook"]).optional().openapi({
      description: "Book format filter",
    }),
    availability: z.enum(["available", "unavailable", "all"]).default("all").openapi({
      description: "Filter by availability status",
    }),
    sortBy: z.enum(["title", "author", "publishedDate", "createdAt", "updatedAt"]).default("title").openapi({
      description: "Field to sort by",
    }),
    sortOrder: sortOrderSchema,
    ...paginationSchema.shape,
  })
  .openapi({
    description: "Book search and filter parameters",
  });

// Library search filters
export const librarySearchFiltersSchema = z
  .object({
    query: z.string().optional().openapi({
      description: "General search query across name, description, address",
    }),
    name: z.string().optional().openapi({
      description: "Search by library name",
    }),
    city: z.string().optional().openapi({
      description: "Filter by city",
    }),
    ownerId: z.string().uuid().optional().openapi({
      description: "Filter by owner ID",
    }),
    minRating: z.coerce.number().min(0).max(5).optional().openapi({
      description: "Minimum rating filter",
    }),
    maxRating: z.coerce.number().min(0).max(5).optional().openapi({
      description: "Maximum rating filter",
    }),
    hasWebsite: z.coerce.boolean().optional().openapi({
      description: "Filter libraries with/without website",
    }),
    isPublic: z.coerce.boolean().optional().openapi({
      description: "Filter public/private libraries",
    }),
    sortBy: z.enum(["name", "rating", "createdAt", "updatedAt"]).default("name").openapi({
      description: "Field to sort by",
    }),
    sortOrder: sortOrderSchema,
    ...paginationSchema.shape,
  })
  .openapi({
    description: "Library search and filter parameters",
  });

// User search filters
export const userSearchFiltersSchema = z
  .object({
    query: z.string().optional().openapi({
      description: "General search query across email, display name",
    }),
    email: z.string().optional().openapi({
      description: "Search by email",
    }),
    displayName: z.string().optional().openapi({
      description: "Search by display name",
    }),
    isActive: z.coerce.boolean().optional().openapi({
      description: "Filter by active status",
    }),
    registrationDateRange: dateRangeSchema.optional(),
    lastLoginDateRange: dateRangeSchema.optional(),
    sortBy: z.enum(["email", "displayName", "createdAt", "lastLogin"]).default("createdAt").openapi({
      description: "Field to sort by",
    }),
    sortOrder: sortOrderSchema,
    ...paginationSchema.shape,
  })
  .openapi({
    description: "User search and filter parameters",
  });

// Author search filters
export const authorSearchFiltersSchema = z
  .object({
    query: z.string().optional().openapi({
      description: "General search query across name, biography",
    }),
    name: z.string().optional().openapi({
      description: "Search by author name",
    }),
    nationality: z.string().optional().openapi({
      description: "Filter by nationality",
    }),
    birthYear: z.coerce.number().optional().openapi({
      description: "Filter by birth year",
    }),
    minBooksCount: z.coerce.number().min(0).optional().openapi({
      description: "Minimum number of books authored",
    }),
    maxBooksCount: z.coerce.number().min(0).optional().openapi({
      description: "Maximum number of books authored",
    }),
    sortBy: z.enum(["name", "birthDate", "booksCount", "createdAt"]).default("name").openapi({
      description: "Field to sort by",
    }),
    sortOrder: sortOrderSchema,
    ...paginationSchema.shape,
  })
  .openapi({
    description: "Author search and filter parameters",
  });

// Publisher search filters
export const publisherSearchFiltersSchema = z
  .object({
    query: z.string().optional().openapi({
      description: "General search query across name, address",
    }),
    name: z.string().optional().openapi({
      description: "Search by publisher name",
    }),
    foundedYear: z.coerce.number().optional().openapi({
      description: "Filter by founded year",
    }),
    minBooksCount: z.coerce.number().min(0).optional().openapi({
      description: "Minimum number of books published",
    }),
    maxBooksCount: z.coerce.number().min(0).optional().openapi({
      description: "Maximum number of books published",
    }),
    hasWebsite: z.coerce.boolean().optional().openapi({
      description: "Filter publishers with/without website",
    }),
    sortBy: z.enum(["name", "foundedYear", "booksCount", "createdAt"]).default("name").openapi({
      description: "Field to sort by",
    }),
    sortOrder: sortOrderSchema,
    ...paginationSchema.shape,
  })
  .openapi({
    description: "Publisher search and filter parameters",
  });

// Borrow request search filters
export const borrowRequestSearchFiltersSchema = z
  .object({
    userId: z.string().uuid().optional().openapi({
      description: "Filter by user ID",
    }),
    libraryId: z.string().uuid().optional().openapi({
      description: "Filter by library ID",
    }),
    libraryBookId: z.string().uuid().optional().openapi({
      description: "Filter by library book ID",
    }),
    status: z
      .enum(["pending", "approved", "rejected", "borrowed", "returned", "overdue"])
      .optional()
      .openapi({
        description: "Filter by request status",
      }),
    approvedBy: z.string().uuid().optional().openapi({
      description: "Filter by approver user ID",
    }),
    requestDateRange: dateRangeSchema.optional(),
    dueDateRange: dateRangeSchema.optional(),
    returnDateRange: dateRangeSchema.optional(),
    isOverdue: z.coerce.boolean().optional().openapi({
      description: "Filter overdue requests",
    }),
    sortBy: z.enum(["requestDate", "dueDate", "returnDate", "status"]).default("requestDate").openapi({
      description: "Field to sort by",
    }),
    sortOrder: sortOrderSchema,
    ...paginationSchema.shape,
  })
  .openapi({
    description: "Borrow request search and filter parameters",
  });

// Library member search filters
export const libraryMemberSearchFiltersSchema = z
  .object({
    libraryId: z.string().uuid().optional().openapi({
      description: "Filter by library ID",
    }),
    userId: z.string().uuid().optional().openapi({
      description: "Filter by user ID",
    }),
    role: z.enum(["owner", "manager", "staff", "member"]).optional().openapi({
      description: "Filter by member role",
    }),
    isActive: z.coerce.boolean().optional().openapi({
      description: "Filter by active status",
    }),
    invitedBy: z.string().uuid().optional().openapi({
      description: "Filter by inviter user ID",
    }),
    joinDateRange: dateRangeSchema.optional(),
    hasPermissions: z.coerce.boolean().optional().openapi({
      description: "Filter members with/without custom permissions",
    }),
    sortBy: z.enum(["joinDate", "role", "user.displayName", "user.email"]).default("joinDate").openapi({
      description: "Field to sort by",
    }),
    sortOrder: sortOrderSchema,
    ...paginationSchema.shape,
  })
  .openapi({
    description: "Library member search and filter parameters",
  });

// Advanced search schema combining multiple entities
export const advancedSearchSchema = z
  .object({
    globalQuery: z.string().optional().openapi({
      description: "Global search query across all entities",
    }),
    entityTypes: z
      .array(z.enum(["book", "library", "author", "publisher", "user"]))
      .optional()
      .openapi({
        description: "Entity types to search in",
      }),
    bookFilters: bookSearchFiltersSchema.partial().optional(),
    libraryFilters: librarySearchFiltersSchema.partial().optional(),
    authorFilters: authorSearchFiltersSchema.partial().optional(),
    publisherFilters: publisherSearchFiltersSchema.partial().optional(),
    userFilters: userSearchFiltersSchema.partial().optional(),
    maxResultsPerEntity: z.coerce.number().min(1).max(50).default(10).openapi({
      description: "Maximum results per entity type",
    }),
  })
  .openapi({
    description: "Advanced search parameters across multiple entities",
  });

// Search result metadata
export const searchResultMetadataSchema = z
  .object({
    totalResults: z.number().openapi({
      description: "Total number of results found",
    }),
    totalPages: z.number().openapi({
      description: "Total number of pages",
    }),
    currentPage: z.number().openapi({
      description: "Current page number",
    }),
    pageSize: z.number().openapi({
      description: "Number of items per page",
    }),
    hasNextPage: z.boolean().openapi({
      description: "Whether there are more pages",
    }),
    hasPreviousPage: z.boolean().openapi({
      description: "Whether there are previous pages",
    }),
    searchDuration: z.number().optional().openapi({
      description: "Search execution time in milliseconds",
    }),
  })
  .openapi({
    description: "Search result metadata",
  });

// Faceted search filters (for filtering by categories)
export const facetedSearchFiltersSchema = z
  .object({
    facets: z.record(z.array(z.string())).optional().openapi({
      description: "Faceted filters where key is facet name and value is array of selected values",
    }),
    availableFacets: z.array(z.string()).optional().openapi({
      description: "List of available facet names to include in response",
    }),
  })
  .openapi({
    description: "Faceted search filter parameters",
  });

// Search suggestion/autocomplete schema
export const searchSuggestionSchema = z
  .object({
    query: z.string().min(1).openapi({
      description: "Partial query for suggestions",
    }),
    entityTypes: z
      .array(z.enum(["book", "author", "publisher", "library", "subject"]))
      .optional()
      .openapi({
        description: "Entity types to get suggestions for",
      }),
    maxSuggestions: z.coerce.number().min(1).max(20).default(10).openapi({
      description: "Maximum number of suggestions to return",
    }),
  })
  .openapi({
    description: "Search suggestion parameters",
  });

export const suggestionResponseSchema = z
  .object({
    query: z.string(),
    suggestions: z.array(
      z.object({
        text: z.string(),
        entityType: z.enum(["book", "author", "publisher", "library", "subject"]),
        entityId: z.string().uuid().optional(),
        score: z.number().optional(),
      }),
    ),
  })
  .openapi({
    description: "Search suggestion response",
  });

// Export types
export type BookSearchFilters = z.infer<typeof bookSearchFiltersSchema>;
export type LibrarySearchFilters = z.infer<typeof librarySearchFiltersSchema>;
export type UserSearchFilters = z.infer<typeof userSearchFiltersSchema>;
export type AuthorSearchFilters = z.infer<typeof authorSearchFiltersSchema>;
export type PublisherSearchFilters = z.infer<typeof publisherSearchFiltersSchema>;
export type BorrowRequestSearchFilters = z.infer<typeof borrowRequestSearchFiltersSchema>;
export type LibraryMemberSearchFilters = z.infer<typeof libraryMemberSearchFiltersSchema>;
export type AdvancedSearch = z.infer<typeof advancedSearchSchema>;
export type SearchResultMetadata = z.infer<typeof searchResultMetadataSchema>;
export type FacetedSearchFilters = z.infer<typeof facetedSearchFiltersSchema>;
export type SearchSuggestion = z.infer<typeof searchSuggestionSchema>;
export type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;
