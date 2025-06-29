/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** User profile information */
export interface User {
  /**
   * Unique identifier (UUID)
   * @format uuid
   */
  id: string;
  /**
   * User's unique username
   * @minLength 2
   * @maxLength 50
   */
  username: string;
  /**
   * User's email address
   * @format email
   */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /**
   * User's role in the system
   * @default "user"
   */
  role?: "user" | "admin";
  /** Timestamp when the user was created */
  createdAt: string;
  /** Timestamp when the user was last updated */
  updatedAt: string;
}

/** Complete book information */
export interface Book {
  /**
   * Unique identifier (UUID)
   * @format uuid
   */
  id: string;
  /**
   * Book title
   * @minLength 2
   * @maxLength 200
   */
  title: string;
  /** Extended book title */
  titleLong?: string | null;
  /** ISBN number */
  isbn?: string | null;
  /** ISBN-13 number */
  isbn13?: string | null;
  /** Dewey decimal classification */
  deweyDecimal?: string | null;
  /** Book binding type */
  binding?: string | null;
  /**
   * Book language
   * @default "other"
   */
  language?: "en" | "ar" | "other";
  /**
   * Author ID
   * @format uuid
   */
  authorId: string;
  /**
   * Publisher ID
   * @format uuid
   */
  publisherId: string;
  /**
   * Subject ID
   * @format uuid
   */
  subjectId?: string | null;
  /** Book genre */
  genre?: string | null;
  /** Publication date */
  datePublished?: string | null;
  /** Book edition */
  edition?: string | null;
  /**
   * Number of pages
   * @min 0
   */
  pages?: number | null;
  /** Book overview */
  overview?: string | null;
  /** Book cover image URL */
  image?: string | null;
  /** Book excerpt */
  excerpt?: string | null;
  /** Book synopsis */
  synopsis?: string | null;
  /** Timestamp when the book was created */
  createdAt: string;
}

/** Library entity information */
export interface Library {
  /**
   * Unique identifier (UUID)
   * @format uuid
   */
  id: string;
  /**
   * Library name
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /**
   * Library description
   * @maxLength 500
   */
  description?: string | null;
  /**
   * Library address
   * @maxLength 200
   */
  address?: string | null;
  /**
   * Library city
   * @maxLength 100
   */
  city?: string | null;
  /**
   * Library phone number
   * @maxLength 20
   */
  phone?: string | null;
  /**
   * Library email
   * @format email
   */
  email?: string | null;
  /**
   * Library website
   * @format uri
   */
  website?: string | null;
  /**
   * Library hours
   * @maxLength 200
   */
  hours?: string | null;
  /** Library image URL */
  image?: string | null;
  /**
   * Library rating
   * @min 0
   * @max 5
   */
  rating?: number | null;
  /**
   * ID of the library owner
   * @format uuid
   */
  ownerId: string;
  /**
   * Library location
   * @maxLength 200
   */
  location?: string | null;
  /** Timestamp when the library was created */
  createdAt: string;
  /** Timestamp when the library was last updated */
  updatedAt: string;
}

/** Library book entry information */
export interface LibraryBook {
  /**
   * Unique identifier (UUID)
   * @format uuid
   */
  id: string;
  /**
   * ID of the library
   * @format uuid
   */
  libraryId: string;
  /**
   * ID of the book
   * @format uuid
   */
  bookId: string;
  /**
   * Location of the book on shelf
   * @maxLength 100
   */
  shelfLocation?: string | null;
  /**
   * Condition of the book
   * @maxLength 50
   */
  condition?: string | null;
  /** Timestamp when the book was added to library */
  addedAt: string;
}

/** Library book entry information */
export interface LibraryBookWithDetails {
  /**
   * Unique identifier (UUID)
   * @format uuid
   */
  id: string;
  /**
   * ID of the library
   * @format uuid
   */
  libraryId: string;
  /**
   * ID of the book
   * @format uuid
   */
  bookId: string;
  /**
   * Location of the book on shelf
   * @maxLength 100
   */
  shelfLocation?: string | null;
  /**
   * Condition of the book
   * @maxLength 50
   */
  condition?: string | null;
  /** Timestamp when the book was added to library */
  addedAt: string;
  /** Book details */
  book: {
    /** @format uuid */
    id: string;
    title: string;
    author: string;
    isbn?: string;
    genre?: string;
    publishedYear?: number;
    language: "en" | "ar" | "other";
  };
  /** Library details */
  library: {
    /** @format uuid */
    id: string;
    name: string;
    location?: string;
  };
}

/** Successful login response */
export interface LoginResponse {
  /** User profile information */
  user: {
    /**
     * Unique identifier (UUID)
     * @format uuid
     */
    id: string;
    /**
     * Unique username for the user
     * @minLength 3
     * @maxLength 30
     * @pattern ^[a-zA-Z0-9_-]+$
     */
    username: string;
    /**
     * Valid email address
     * @format email
     */
    email: string;
    /**
     * User's first or last name
     * @minLength 1
     * @maxLength 50
     */
    firstName: string;
    /**
     * User's first or last name
     * @minLength 1
     * @maxLength 50
     */
    lastName: string;
    /** User role */
    role: string;
    /** User permissions */
    permissions: string[];
    /** Whether the user account is active */
    isActive: boolean;
    /** Whether the user's email is verified */
    isEmailVerified: boolean;
    /** Whether the user account is suspended */
    isSuspended: boolean;
  };
  /** Authentication tokens */
  tokens: {
    /** JWT access token */
    accessToken: string;
    /** JWT refresh token */
    refreshToken: string;
    /** Access token expiration time in seconds */
    expiresIn: number;
    /** Refresh token expiration time in seconds */
    refreshExpiresIn: number;
  };
  /** Session identifier */
  sessionId: string;
}

/** Refreshed authentication tokens */
export interface TokenResponse {
  /** New JWT access token */
  accessToken: string;
  /** New JWT refresh token */
  refreshToken: string;
  /** New access token expiration time in seconds */
  expiresIn: number;
  /** New refresh token expiration time in seconds */
  refreshExpiresIn: number;
}

/** User registration data */
export interface RegisterRequest {
  /**
   * Unique username for the user
   * @minLength 3
   * @maxLength 30
   * @pattern ^[a-zA-Z0-9_-]+$
   */
  username: string;
  /**
   * Valid email address
   * @format email
   */
  email: string;
  /**
   * User's first or last name
   * @minLength 1
   * @maxLength 50
   */
  firstName: string;
  /**
   * User's first or last name
   * @minLength 1
   * @maxLength 50
   */
  lastName: string;
  /**
   * User password with security requirements
   * @minLength 8
   * @maxLength 128
   * @pattern [A-Z]
   */
  password: string;
}

/** User login credentials */
export interface LoginRequest {
  /**
   * Valid email address
   * @format email
   */
  email: string;
  /**
   * User password for login
   * @minLength 1
   */
  password: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Bookshelf API
 * @version 1.0.0
 * @externalDocs /swagger.json
 *
 * A comprehensive API for managing books, libraries, users, and library collections
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  healthCheck = {
    /**
     * No description
     *
     * @tags Health Check
     * @name HealthCheckList
     * @request GET:/health-check
     */
    healthCheckList: (params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: any;
          statusCode: number;
        },
        any
      >({
        path: `/health-check`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags User
     * @name UsersList
     * @request GET:/users
     */
    usersList: (params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * User's unique username
             * @minLength 2
             * @maxLength 50
             */
            username: string;
            /**
             * User's email address
             * @format email
             */
            email: string;
            /** User's first name */
            firstName: string;
            /** User's last name */
            lastName: string;
            /**
             * User's role in the system
             * @default "user"
             */
            role?: "user" | "admin";
            /** Timestamp when the user was created */
            createdAt: string;
            /** Timestamp when the user was last updated */
            updatedAt: string;
          }[];
          statusCode: number;
        },
        any
      >({
        path: `/users`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UsersCreate
     * @request POST:/users
     */
    usersCreate: (
      data: {
        /**
         * User's unique username
         * @minLength 2
         * @maxLength 50
         */
        username: string;
        /**
         * User's email address
         * @format email
         */
        email: string;
        /** User's first name */
        firstName: string;
        /** User's last name */
        lastName: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** User profile information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * User's unique username
             * @minLength 2
             * @maxLength 50
             */
            username: string;
            /**
             * User's email address
             * @format email
             */
            email: string;
            /** User's first name */
            firstName: string;
            /** User's last name */
            lastName: string;
            /**
             * User's role in the system
             * @default "user"
             */
            role?: "user" | "admin";
            /** Timestamp when the user was created */
            createdAt: string;
            /** Timestamp when the user was last updated */
            updatedAt: string;
          };
          statusCode: number;
        },
        {
          message: string;
        }
      >({
        path: `/users`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UsersDetail
     * @request GET:/users/{id}
     */
    usersDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** User profile information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * User's unique username
             * @minLength 2
             * @maxLength 50
             */
            username: string;
            /**
             * User's email address
             * @format email
             */
            email: string;
            /** User's first name */
            firstName: string;
            /** User's last name */
            lastName: string;
            /**
             * User's role in the system
             * @default "user"
             */
            role?: "user" | "admin";
            /** Timestamp when the user was created */
            createdAt: string;
            /** Timestamp when the user was last updated */
            updatedAt: string;
          };
          statusCode: number;
        },
        any
      >({
        path: `/users/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UsersPartialUpdate
     * @request PATCH:/users/{id}
     */
    usersPartialUpdate: (
      id: string,
      data: {
        /**
         * User's unique username
         * @minLength 2
         * @maxLength 50
         */
        username?: string;
        /**
         * Valid email address
         * @format email
         */
        email?: string;
        /**
         * Person's name
         * @minLength 2
         * @maxLength 50
         */
        firstName?: string;
        /**
         * Person's name
         * @minLength 2
         * @maxLength 50
         */
        lastName?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** User profile information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * User's unique username
             * @minLength 2
             * @maxLength 50
             */
            username: string;
            /**
             * User's email address
             * @format email
             */
            email: string;
            /** User's first name */
            firstName: string;
            /** User's last name */
            lastName: string;
            /**
             * User's role in the system
             * @default "user"
             */
            role?: "user" | "admin";
            /** Timestamp when the user was created */
            createdAt: string;
            /** Timestamp when the user was last updated */
            updatedAt: string;
          };
          statusCode: number;
        },
        any
      >({
        path: `/users/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UsersDelete
     * @request DELETE:/users/{id}
     */
    usersDelete: (id: string, params: RequestParams = {}) =>
      this.request<
        void,
        {
          message: string;
        }
      >({
        path: `/users/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  books = {
    /**
     * No description
     *
     * @tags Books
     * @name BooksCreate
     * @request POST:/books
     */
    booksCreate: (
      data: {
        /**
         * The title of the book
         * @minLength 2
         * @maxLength 200
         */
        title: string;
        /**
         * Author name (will be linked to existing author or create new)
         * @minLength 2
         * @maxLength 100
         */
        author: string;
        /**
         * Publisher name (will be linked to existing publisher or create new)
         * @minLength 1
         * @maxLength 100
         */
        publisher: string;
        /**
         * The ISBN of the book
         * @maxLength 20
         * @pattern ^(97(8|9))?\d{9}(\d|X)$
         */
        isbn?: string;
        /**
         * The genre of the book
         * @minLength 2
         * @maxLength 50
         */
        genre?: string;
        /**
         * The year the book was published
         * @min 0
         * @max 2025
         */
        publishedYear?: number;
        /** The language of the book */
        language: "en" | "ar" | "other";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Complete book information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Book title
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /** Extended book title */
            titleLong?: string | null;
            /** ISBN number */
            isbn?: string | null;
            /** ISBN-13 number */
            isbn13?: string | null;
            /** Dewey decimal classification */
            deweyDecimal?: string | null;
            /** Book binding type */
            binding?: string | null;
            /**
             * Book language
             * @default "other"
             */
            language?: "en" | "ar" | "other";
            /**
             * Author ID
             * @format uuid
             */
            authorId: string;
            /**
             * Publisher ID
             * @format uuid
             */
            publisherId: string;
            /**
             * Subject ID
             * @format uuid
             */
            subjectId?: string | null;
            /** Book genre */
            genre?: string | null;
            /** Publication date */
            datePublished?: string | null;
            /** Book edition */
            edition?: string | null;
            /**
             * Number of pages
             * @min 0
             */
            pages?: number | null;
            /** Book overview */
            overview?: string | null;
            /** Book cover image URL */
            image?: string | null;
            /** Book excerpt */
            excerpt?: string | null;
            /** Book synopsis */
            synopsis?: string | null;
            /** Timestamp when the book was created */
            createdAt: string;
          };
          statusCode: number;
        },
        any
      >({
        path: `/books`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Books
     * @name BooksList
     * @request GET:/books
     */
    booksList: (
      query?: {
        title?: string;
        isbn?: string;
        author?: string;
        genre?: string;
        publishedYear?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Book title
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /** Extended book title */
            titleLong?: string | null;
            /** ISBN number */
            isbn?: string | null;
            /** ISBN-13 number */
            isbn13?: string | null;
            /** Dewey decimal classification */
            deweyDecimal?: string | null;
            /** Book binding type */
            binding?: string | null;
            /**
             * Book language
             * @default "other"
             */
            language?: "en" | "ar" | "other";
            /**
             * Author ID
             * @format uuid
             */
            authorId: string;
            /**
             * Publisher ID
             * @format uuid
             */
            publisherId: string;
            /**
             * Subject ID
             * @format uuid
             */
            subjectId?: string | null;
            /** Book genre */
            genre?: string | null;
            /** Publication date */
            datePublished?: string | null;
            /** Book edition */
            edition?: string | null;
            /**
             * Number of pages
             * @min 0
             */
            pages?: number | null;
            /** Book overview */
            overview?: string | null;
            /** Book cover image URL */
            image?: string | null;
            /** Book excerpt */
            excerpt?: string | null;
            /** Book synopsis */
            synopsis?: string | null;
            /** Timestamp when the book was created */
            createdAt: string;
          }[];
          statusCode: number;
        },
        any
      >({
        path: `/books`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Books
     * @name BulkCreate
     * @request POST:/books/bulk
     */
    bulkCreate: (
      data: {
        books: {
          /**
           * The title of the book
           * @minLength 2
           * @maxLength 200
           */
          title: string;
          /**
           * Author name (will be linked to existing author or create new)
           * @minLength 2
           * @maxLength 100
           */
          author: string;
          /**
           * Publisher name (will be linked to existing publisher or create new)
           * @minLength 1
           * @maxLength 100
           */
          publisher: string;
          /**
           * The ISBN of the book
           * @maxLength 20
           * @pattern ^(97(8|9))?\d{9}(\d|X)$
           */
          isbn?: string;
          /**
           * The genre of the book
           * @minLength 2
           * @maxLength 50
           */
          genre?: string;
          /**
           * The year the book was published
           * @min 0
           * @max 2025
           */
          publishedYear?: number;
          /** The language of the book */
          language: "en" | "ar" | "other";
        }[];
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Book title
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /** Extended book title */
            titleLong?: string | null;
            /** ISBN number */
            isbn?: string | null;
            /** ISBN-13 number */
            isbn13?: string | null;
            /** Dewey decimal classification */
            deweyDecimal?: string | null;
            /** Book binding type */
            binding?: string | null;
            /**
             * Book language
             * @default "other"
             */
            language?: "en" | "ar" | "other";
            /**
             * Author ID
             * @format uuid
             */
            authorId: string;
            /**
             * Publisher ID
             * @format uuid
             */
            publisherId: string;
            /**
             * Subject ID
             * @format uuid
             */
            subjectId?: string | null;
            /** Book genre */
            genre?: string | null;
            /** Publication date */
            datePublished?: string | null;
            /** Book edition */
            edition?: string | null;
            /**
             * Number of pages
             * @min 0
             */
            pages?: number | null;
            /** Book overview */
            overview?: string | null;
            /** Book cover image URL */
            image?: string | null;
            /** Book excerpt */
            excerpt?: string | null;
            /** Book synopsis */
            synopsis?: string | null;
            /** Timestamp when the book was created */
            createdAt: string;
          }[];
          statusCode: number;
        },
        any
      >({
        path: `/books/bulk`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Books
     * @name BooksDetail
     * @request GET:/books/{id}
     */
    booksDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Complete book information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Book title
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /** Extended book title */
            titleLong?: string | null;
            /** ISBN number */
            isbn?: string | null;
            /** ISBN-13 number */
            isbn13?: string | null;
            /** Dewey decimal classification */
            deweyDecimal?: string | null;
            /** Book binding type */
            binding?: string | null;
            /**
             * Book language
             * @default "other"
             */
            language?: "en" | "ar" | "other";
            /**
             * Author ID
             * @format uuid
             */
            authorId: string;
            /**
             * Publisher ID
             * @format uuid
             */
            publisherId: string;
            /**
             * Subject ID
             * @format uuid
             */
            subjectId?: string | null;
            /** Book genre */
            genre?: string | null;
            /** Publication date */
            datePublished?: string | null;
            /** Book edition */
            edition?: string | null;
            /**
             * Number of pages
             * @min 0
             */
            pages?: number | null;
            /** Book overview */
            overview?: string | null;
            /** Book cover image URL */
            image?: string | null;
            /** Book excerpt */
            excerpt?: string | null;
            /** Book synopsis */
            synopsis?: string | null;
            /** Timestamp when the book was created */
            createdAt: string;
          };
          statusCode: number;
        },
        any
      >({
        path: `/books/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Books
     * @name BooksPartialUpdate
     * @request PATCH:/books/{id}
     */
    booksPartialUpdate: (
      id: string,
      data: {
        /**
         * The title of the book
         * @minLength 2
         * @maxLength 200
         */
        title?: string;
        /**
         * Author name (will be linked to existing author or create new)
         * @minLength 2
         * @maxLength 100
         */
        author?: string;
        /**
         * Publisher name (will be linked to existing publisher or create new)
         * @minLength 1
         * @maxLength 100
         */
        publisher?: string;
        /**
         * The ISBN of the book
         * @maxLength 20
         * @pattern ^(97(8|9))?\d{9}(\d|X)$
         */
        isbn?: string;
        /**
         * The genre of the book
         * @minLength 2
         * @maxLength 50
         */
        genre?: string;
        /**
         * The year the book was published
         * @min 0
         * @max 2025
         */
        publishedYear?: number;
        /** The language of the book */
        language?: "en" | "ar" | "other";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Complete book information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Book title
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /** Extended book title */
            titleLong?: string | null;
            /** ISBN number */
            isbn?: string | null;
            /** ISBN-13 number */
            isbn13?: string | null;
            /** Dewey decimal classification */
            deweyDecimal?: string | null;
            /** Book binding type */
            binding?: string | null;
            /**
             * Book language
             * @default "other"
             */
            language?: "en" | "ar" | "other";
            /**
             * Author ID
             * @format uuid
             */
            authorId: string;
            /**
             * Publisher ID
             * @format uuid
             */
            publisherId: string;
            /**
             * Subject ID
             * @format uuid
             */
            subjectId?: string | null;
            /** Book genre */
            genre?: string | null;
            /** Publication date */
            datePublished?: string | null;
            /** Book edition */
            edition?: string | null;
            /**
             * Number of pages
             * @min 0
             */
            pages?: number | null;
            /** Book overview */
            overview?: string | null;
            /** Book cover image URL */
            image?: string | null;
            /** Book excerpt */
            excerpt?: string | null;
            /** Book synopsis */
            synopsis?: string | null;
            /** Timestamp when the book was created */
            createdAt: string;
          };
          statusCode: number;
        },
        any
      >({
        path: `/books/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Books
     * @name BooksDelete
     * @request DELETE:/books/{id}
     */
    booksDelete: (id: string, params: RequestParams = {}) =>
      this.request<
        void,
        {
          message: string;
        }
      >({
        path: `/books/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Books
     * @name SearchList
     * @request GET:/books/search
     */
    searchList: (
      query: {
        search: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Book title
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /** Extended book title */
            titleLong?: string | null;
            /** ISBN number */
            isbn?: string | null;
            /** ISBN-13 number */
            isbn13?: string | null;
            /** Dewey decimal classification */
            deweyDecimal?: string | null;
            /** Book binding type */
            binding?: string | null;
            /**
             * Book language
             * @default "other"
             */
            language?: "en" | "ar" | "other";
            /**
             * Author ID
             * @format uuid
             */
            authorId: string;
            /**
             * Publisher ID
             * @format uuid
             */
            publisherId: string;
            /**
             * Subject ID
             * @format uuid
             */
            subjectId?: string | null;
            /** Book genre */
            genre?: string | null;
            /** Publication date */
            datePublished?: string | null;
            /** Book edition */
            edition?: string | null;
            /**
             * Number of pages
             * @min 0
             */
            pages?: number | null;
            /** Book overview */
            overview?: string | null;
            /** Book cover image URL */
            image?: string | null;
            /** Book excerpt */
            excerpt?: string | null;
            /** Book synopsis */
            synopsis?: string | null;
            /** Timestamp when the book was created */
            createdAt: string;
          }[];
          statusCode: number;
        },
        any
      >({
        path: `/books/search`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Books
     * @name WeightedSearchList
     * @request GET:/books/weighted-search
     */
    weightedSearchList: (
      query: {
        search: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Book title
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /** Extended book title */
            titleLong?: string | null;
            /** ISBN number */
            isbn?: string | null;
            /** ISBN-13 number */
            isbn13?: string | null;
            /** Dewey decimal classification */
            deweyDecimal?: string | null;
            /** Book binding type */
            binding?: string | null;
            /**
             * Book language
             * @default "other"
             */
            language?: "en" | "ar" | "other";
            /**
             * Author ID
             * @format uuid
             */
            authorId: string;
            /**
             * Publisher ID
             * @format uuid
             */
            publisherId: string;
            /**
             * Subject ID
             * @format uuid
             */
            subjectId?: string | null;
            /** Book genre */
            genre?: string | null;
            /** Publication date */
            datePublished?: string | null;
            /** Book edition */
            edition?: string | null;
            /**
             * Number of pages
             * @min 0
             */
            pages?: number | null;
            /** Book overview */
            overview?: string | null;
            /** Book cover image URL */
            image?: string | null;
            /** Book excerpt */
            excerpt?: string | null;
            /** Book synopsis */
            synopsis?: string | null;
            /** Timestamp when the book was created */
            createdAt: string;
          }[];
          statusCode: number;
        },
        any
      >({
        path: `/books/weighted-search`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  author = {
    /**
     * No description
     *
     * @tags Author
     * @name AuthorDetail
     * @request GET:/author/{name}
     */
    authorDetail: (name: string, params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: any;
          statusCode: number;
        },
        any
      >({
        path: `/author/${name}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  authors = {
    /**
     * No description
     *
     * @tags Author
     * @name AuthorsDetail
     * @request GET:/authors/{query}
     */
    authorsDetail: (query: string, params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: any;
          statusCode: number;
        },
        any
      >({
        path: `/authors/${query}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  publisher = {
    /**
     * No description
     *
     * @tags Publisher
     * @name PublisherDetail
     * @request GET:/publisher/{name}
     */
    publisherDetail: (name: string, params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: any;
          statusCode: number;
        },
        any
      >({
        path: `/publisher/${name}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  publishers = {
    /**
     * No description
     *
     * @tags Publisher
     * @name PublishersDetail
     * @request GET:/publishers/{query}
     */
    publishersDetail: (query: string, params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: any[];
          statusCode: number;
        },
        any
      >({
        path: `/publishers/${query}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  search = {
    /**
     * No description
     *
     * @tags Search
     * @name SearchDetail
     * @request GET:/search/{index}
     */
    searchDetail: (
      index: "books" | "authors" | "publishers",
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: any;
          statusCode: number;
        },
        any
      >({
        path: `/search/${index}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  libraries = {
    /**
     * No description
     *
     * @tags Library
     * @name LibrariesList
     * @request GET:/libraries
     */
    librariesList: (params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Library name
             * @minLength 1
             * @maxLength 100
             */
            name: string;
            /**
             * Library description
             * @maxLength 500
             */
            description?: string | null;
            /**
             * Library address
             * @maxLength 200
             */
            address?: string | null;
            /**
             * Library city
             * @maxLength 100
             */
            city?: string | null;
            /**
             * Library phone number
             * @maxLength 20
             */
            phone?: string | null;
            /**
             * Library email
             * @format email
             */
            email?: string | null;
            /**
             * Library website
             * @format uri
             */
            website?: string | null;
            /**
             * Library hours
             * @maxLength 200
             */
            hours?: string | null;
            /** Library image URL */
            image?: string | null;
            /**
             * Library rating
             * @min 0
             * @max 5
             */
            rating?: number | null;
            /**
             * ID of the library owner
             * @format uuid
             */
            ownerId: string;
            /**
             * Library location
             * @maxLength 200
             */
            location?: string | null;
            /** Timestamp when the library was created */
            createdAt: string;
            /** Timestamp when the library was last updated */
            updatedAt: string;
          }[];
          statusCode: number;
        },
        any
      >({
        path: `/libraries`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name LibrariesCreate
     * @request POST:/libraries
     */
    librariesCreate: (
      data: {
        /**
         * Library name
         * @minLength 1
         * @maxLength 100
         */
        name: string;
        /**
         * Library description
         * @maxLength 500
         */
        description?: string;
        /**
         * Library address
         * @maxLength 200
         */
        address?: string;
        /**
         * Library city
         * @maxLength 100
         */
        city?: string;
        /**
         * Library phone number
         * @maxLength 20
         */
        phone?: string;
        /**
         * Library email
         * @format email
         */
        email?: string;
        /**
         * Library website
         * @format uri
         */
        website?: string;
        /**
         * Library hours
         * @maxLength 200
         */
        hours?: string;
        /** Library image URL */
        image?: string;
        /**
         * Library location
         * @maxLength 200
         */
        location?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Library entity information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Library name
             * @minLength 1
             * @maxLength 100
             */
            name: string;
            /**
             * Library description
             * @maxLength 500
             */
            description?: string | null;
            /**
             * Library address
             * @maxLength 200
             */
            address?: string | null;
            /**
             * Library city
             * @maxLength 100
             */
            city?: string | null;
            /**
             * Library phone number
             * @maxLength 20
             */
            phone?: string | null;
            /**
             * Library email
             * @format email
             */
            email?: string | null;
            /**
             * Library website
             * @format uri
             */
            website?: string | null;
            /**
             * Library hours
             * @maxLength 200
             */
            hours?: string | null;
            /** Library image URL */
            image?: string | null;
            /**
             * Library rating
             * @min 0
             * @max 5
             */
            rating?: number | null;
            /**
             * ID of the library owner
             * @format uuid
             */
            ownerId: string;
            /**
             * Library location
             * @maxLength 200
             */
            location?: string | null;
            /** Timestamp when the library was created */
            createdAt: string;
            /** Timestamp when the library was last updated */
            updatedAt: string;
          };
          statusCode: number;
        },
        any
      >({
        path: `/libraries`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name LibrariesDetail
     * @request GET:/libraries/{id}
     */
    librariesDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Library entity information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Library name
             * @minLength 1
             * @maxLength 100
             */
            name: string;
            /**
             * Library description
             * @maxLength 500
             */
            description?: string | null;
            /**
             * Library address
             * @maxLength 200
             */
            address?: string | null;
            /**
             * Library city
             * @maxLength 100
             */
            city?: string | null;
            /**
             * Library phone number
             * @maxLength 20
             */
            phone?: string | null;
            /**
             * Library email
             * @format email
             */
            email?: string | null;
            /**
             * Library website
             * @format uri
             */
            website?: string | null;
            /**
             * Library hours
             * @maxLength 200
             */
            hours?: string | null;
            /** Library image URL */
            image?: string | null;
            /**
             * Library rating
             * @min 0
             * @max 5
             */
            rating?: number | null;
            /**
             * ID of the library owner
             * @format uuid
             */
            ownerId: string;
            /**
             * Library location
             * @maxLength 200
             */
            location?: string | null;
            /** Timestamp when the library was created */
            createdAt: string;
            /** Timestamp when the library was last updated */
            updatedAt: string;
          };
          statusCode: number;
        },
        any
      >({
        path: `/libraries/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name LibrariesPartialUpdate
     * @request PATCH:/libraries/{id}
     */
    librariesPartialUpdate: (
      id: string,
      data: {
        /**
         * Library name
         * @minLength 1
         * @maxLength 100
         */
        name?: string;
        /**
         * Library description
         * @maxLength 500
         */
        description?: string;
        /**
         * Library address
         * @maxLength 200
         */
        address?: string;
        /**
         * Library city
         * @maxLength 100
         */
        city?: string;
        /**
         * Library phone number
         * @maxLength 20
         */
        phone?: string;
        /**
         * Library email
         * @format email
         */
        email?: string;
        /**
         * Library website
         * @format uri
         */
        website?: string;
        /**
         * Library hours
         * @maxLength 200
         */
        hours?: string;
        /** Library image URL */
        image?: string;
        /**
         * Library location
         * @maxLength 200
         */
        location?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Library entity information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Library name
             * @minLength 1
             * @maxLength 100
             */
            name: string;
            /**
             * Library description
             * @maxLength 500
             */
            description?: string | null;
            /**
             * Library address
             * @maxLength 200
             */
            address?: string | null;
            /**
             * Library city
             * @maxLength 100
             */
            city?: string | null;
            /**
             * Library phone number
             * @maxLength 20
             */
            phone?: string | null;
            /**
             * Library email
             * @format email
             */
            email?: string | null;
            /**
             * Library website
             * @format uri
             */
            website?: string | null;
            /**
             * Library hours
             * @maxLength 200
             */
            hours?: string | null;
            /** Library image URL */
            image?: string | null;
            /**
             * Library rating
             * @min 0
             * @max 5
             */
            rating?: number | null;
            /**
             * ID of the library owner
             * @format uuid
             */
            ownerId: string;
            /**
             * Library location
             * @maxLength 200
             */
            location?: string | null;
            /** Timestamp when the library was created */
            createdAt: string;
            /** Timestamp when the library was last updated */
            updatedAt: string;
          };
          statusCode: number;
        },
        any
      >({
        path: `/libraries/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library
     * @name LibrariesDelete
     * @request DELETE:/libraries/{id}
     */
    librariesDelete: (id: string, params: RequestParams = {}) =>
      this.request<
        void,
        {
          message: string;
        }
      >({
        path: `/libraries/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library Books
     * @name BooksList
     * @request GET:/libraries/{libraryId}/books
     */
    booksList: (libraryId: string, params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * ID of the library
             * @format uuid
             */
            libraryId: string;
            /**
             * ID of the book
             * @format uuid
             */
            bookId: string;
            /**
             * Location of the book on shelf
             * @maxLength 100
             */
            shelfLocation?: string | null;
            /**
             * Condition of the book
             * @maxLength 50
             */
            condition?: string | null;
            /** Timestamp when the book was added to library */
            addedAt: string;
            /** Book details */
            book: {
              /** @format uuid */
              id: string;
              title: string;
              author: string;
              isbn?: string;
              genre?: string;
              publishedYear?: number;
              language: "en" | "ar" | "other";
            };
            /** Library details */
            library: {
              /** @format uuid */
              id: string;
              name: string;
              location?: string;
            };
          }[];
          statusCode: number;
        },
        any
      >({
        path: `/libraries/${libraryId}/books`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  libraryBooks = {
    /**
     * No description
     *
     * @tags Library Books
     * @name LibraryBooksList
     * @request GET:/library-books
     */
    libraryBooksList: (params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * ID of the library
             * @format uuid
             */
            libraryId: string;
            /**
             * ID of the book
             * @format uuid
             */
            bookId: string;
            /**
             * Location of the book on shelf
             * @maxLength 100
             */
            shelfLocation?: string | null;
            /**
             * Condition of the book
             * @maxLength 50
             */
            condition?: string | null;
            /** Timestamp when the book was added to library */
            addedAt: string;
            /** Book details */
            book: {
              /** @format uuid */
              id: string;
              title: string;
              author: string;
              isbn?: string;
              genre?: string;
              publishedYear?: number;
              language: "en" | "ar" | "other";
            };
            /** Library details */
            library: {
              /** @format uuid */
              id: string;
              name: string;
              location?: string;
            };
          }[];
          statusCode: number;
        },
        any
      >({
        path: `/library-books`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library Books
     * @name LibraryBooksCreate
     * @request POST:/library-books
     */
    libraryBooksCreate: (
      data: {
        /**
         * ID of the library
         * @format uuid
         */
        libraryId: string;
        /**
         * ID of the book
         * @format uuid
         */
        bookId: string;
        /**
         * Location of the book on shelf
         * @maxLength 100
         */
        shelfLocation?: string;
        /**
         * Condition of the book
         * @maxLength 50
         */
        condition?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Library book entry information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * ID of the library
             * @format uuid
             */
            libraryId: string;
            /**
             * ID of the book
             * @format uuid
             */
            bookId: string;
            /**
             * Location of the book on shelf
             * @maxLength 100
             */
            shelfLocation?: string | null;
            /**
             * Condition of the book
             * @maxLength 50
             */
            condition?: string | null;
            /** Timestamp when the book was added to library */
            addedAt: string;
          };
          statusCode: number;
        },
        {
          message: string;
        }
      >({
        path: `/library-books`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library Books
     * @name LibraryBooksDetail
     * @request GET:/library-books/{id}
     */
    libraryBooksDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Library book entry information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * ID of the library
             * @format uuid
             */
            libraryId: string;
            /**
             * ID of the book
             * @format uuid
             */
            bookId: string;
            /**
             * Location of the book on shelf
             * @maxLength 100
             */
            shelfLocation?: string | null;
            /**
             * Condition of the book
             * @maxLength 50
             */
            condition?: string | null;
            /** Timestamp when the book was added to library */
            addedAt: string;
            /** Book details */
            book: {
              /** @format uuid */
              id: string;
              title: string;
              author: string;
              isbn?: string;
              genre?: string;
              publishedYear?: number;
              language: "en" | "ar" | "other";
            };
            /** Library details */
            library: {
              /** @format uuid */
              id: string;
              name: string;
              location?: string;
            };
          };
          statusCode: number;
        },
        any
      >({
        path: `/library-books/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library Books
     * @name LibraryBooksPartialUpdate
     * @request PATCH:/library-books/{id}
     */
    libraryBooksPartialUpdate: (
      id: string,
      data: {
        /**
         * The shelf location of the book
         * @maxLength 100
         */
        shelfLocation?: string;
        /**
         * The condition of the book
         * @maxLength 50
         */
        condition?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Library book entry information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * ID of the library
             * @format uuid
             */
            libraryId: string;
            /**
             * ID of the book
             * @format uuid
             */
            bookId: string;
            /**
             * Location of the book on shelf
             * @maxLength 100
             */
            shelfLocation?: string | null;
            /**
             * Condition of the book
             * @maxLength 50
             */
            condition?: string | null;
            /** Timestamp when the book was added to library */
            addedAt: string;
          };
          statusCode: number;
        },
        any
      >({
        path: `/library-books/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library Books
     * @name LibraryBooksDelete
     * @request DELETE:/library-books/{id}
     */
    libraryBooksDelete: (id: string, params: RequestParams = {}) =>
      this.request<
        void,
        {
          message: string;
        }
      >({
        path: `/library-books/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  auth = {
    /**
     * No description
     *
     * @tags Authentication
     * @name RegisterCreate
     * @summary Register a new user
     * @request POST:/auth/register
     */
    registerCreate: (
      data: {
        /**
         * Unique username for the user
         * @minLength 3
         * @maxLength 30
         * @pattern ^[a-zA-Z0-9_-]+$
         */
        username: string;
        /**
         * Valid email address
         * @format email
         */
        email: string;
        /**
         * User's first or last name
         * @minLength 1
         * @maxLength 50
         */
        firstName: string;
        /**
         * User's first or last name
         * @minLength 1
         * @maxLength 50
         */
        lastName: string;
        /**
         * User password with security requirements
         * @minLength 8
         * @maxLength 128
         * @pattern [A-Z]
         */
        password: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** User profile information */
          responseObject?: {
            /**
             * Unique identifier (UUID)
             * @format uuid
             */
            id: string;
            /**
             * Unique username for the user
             * @minLength 3
             * @maxLength 30
             * @pattern ^[a-zA-Z0-9_-]+$
             */
            username: string;
            /**
             * Valid email address
             * @format email
             */
            email: string;
            /**
             * User's first or last name
             * @minLength 1
             * @maxLength 50
             */
            firstName: string;
            /**
             * User's first or last name
             * @minLength 1
             * @maxLength 50
             */
            lastName: string;
            /** User role */
            role: string;
            /** User permissions */
            permissions: string[];
            /** Whether the user account is active */
            isActive: boolean;
            /** Whether the user's email is verified */
            isEmailVerified: boolean;
            /** Whether the user account is suspended */
            isSuspended: boolean;
          };
          statusCode: number;
        },
        {
          /** @example false */
          success?: boolean;
          message?: string;
          /** @example 400 */
          statusCode?: number;
        }
      >({
        path: `/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Authentication
     * @name LoginCreate
     * @summary Login user
     * @request POST:/auth/login
     */
    loginCreate: (
      data: {
        /**
         * Valid email address
         * @format email
         */
        email: string;
        /**
         * User password for login
         * @minLength 1
         */
        password: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          /** Successful login response */
          responseObject?: {
            /** User profile information */
            user: {
              /**
               * Unique identifier (UUID)
               * @format uuid
               */
              id: string;
              /**
               * Unique username for the user
               * @minLength 3
               * @maxLength 30
               * @pattern ^[a-zA-Z0-9_-]+$
               */
              username: string;
              /**
               * Valid email address
               * @format email
               */
              email: string;
              /**
               * User's first or last name
               * @minLength 1
               * @maxLength 50
               */
              firstName: string;
              /**
               * User's first or last name
               * @minLength 1
               * @maxLength 50
               */
              lastName: string;
              /** User role */
              role: string;
              /** User permissions */
              permissions: string[];
              /** Whether the user account is active */
              isActive: boolean;
              /** Whether the user's email is verified */
              isEmailVerified: boolean;
              /** Whether the user account is suspended */
              isSuspended: boolean;
            };
            /** Authentication tokens */
            tokens: {
              /** JWT access token */
              accessToken: string;
              /** JWT refresh token */
              refreshToken: string;
              /** Access token expiration time in seconds */
              expiresIn: number;
              /** Refresh token expiration time in seconds */
              refreshExpiresIn: number;
            };
            /** Session identifier */
            sessionId: string;
          };
          statusCode: number;
        },
        {
          /** @example false */
          success?: boolean;
          message?: string;
          /** @example 401 */
          statusCode?: number;
        }
      >({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
