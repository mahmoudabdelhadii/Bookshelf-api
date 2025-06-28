/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https:
 * ---------------------------------------------------------------
 */

export interface User {
  /** @format uuid */
  id: string;
  /**
   * @minLength 2
   * @maxLength 50
   */
  username: string;
  /**
   * @minLength 2
   * @maxLength 50
   */
  firstName: string;
  /**
   * @minLength 2
   * @maxLength 50
   */
  lastName: string;
  /** @format email */
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  /** @format uuid */
  id: string;
  /**
   * The title of the book.
   * @minLength 2
   * @maxLength 200
   */
  title: string;
  /**
   * The author of the book.
   * @minLength 2
   * @maxLength 100
   */
  authorId: string;
  /**
   * The publisher of the book.
   * @minLength 2
   * @maxLength 100
   */
  publisherId: string;
  /**
   * The year the book was published.
   * @min 0
   * @max 2025
   */
  publishedYear?: number;
  /**
   * The ISBN of the book.
   * @maxLength 20
   * @pattern ^(97(8|9))?\d{9}(\d|X)$
   */
  isbn?: string;
  /**
   * The genre of the book.
   * @minLength 2
   * @maxLength 50
   */
  genre?: string;
  /** Timestamp when the book was created. */
  createdAt: string;
  /** The language of the book. */
  language: "en" | "ar" | "other";
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
            /** @format uuid */
            id: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            username: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            firstName: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            lastName: string;
            /** @format email */
            email: string;
            createdAt: string;
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
        /** @format uuid */
        id: string;
        /**
         * @minLength 2
         * @maxLength 50
         */
        username: string;
        /** @format email */
        email: string;
        /**
         * @minLength 2
         * @maxLength 50
         */
        firstName: string;
        /**
         * @minLength 2
         * @maxLength 50
         */
        lastName: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /** @format uuid */
            id: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            username: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            firstName: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            lastName: string;
            /** @format email */
            email: string;
            createdAt: string;
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
          responseObject?: {
            /** @format uuid */
            id: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            username: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            firstName: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            lastName: string;
            /** @format email */
            email: string;
            createdAt: string;
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
         * @minLength 2
         * @maxLength 50
         */
        username?: string;
        /** @format email */
        email?: string;
        /**
         * @minLength 2
         * @maxLength 50
         */
        firstName: string;
        /**
         * @minLength 2
         * @maxLength 50
         */
        lastName: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /** @format uuid */
            id: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            username: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            firstName: string;
            /**
             * @minLength 2
             * @maxLength 50
             */
            lastName: string;
            /** @format email */
            email: string;
            createdAt: string;
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
         * The title of the book.
         * @minLength 2
         * @maxLength 200
         */
        title: string;
        /**
         * The author of the book.
         * @minLength 2
         * @maxLength 100
         */
        author: string;
        /**
         * The publisher of the book.
         * @minLength 2
         * @maxLength 100
         */
        publisher: string;
        /**
         * The ISBN of the book.
         * @maxLength 20
         * @pattern ^(97(8|9))?\d{9}(\d|X)$
         */
        isbn: string;
        /**
         * The genre of the book.
         * @minLength 2
         * @maxLength 50
         */
        genre: string;
        /**
         * The year the book was published.
         * @min 0
         * @max 2025
         */
        publishedYear?: number;
        /** The language of the book. */
        language: "en" | "ar" | "other";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /** @format uuid */
            id: string;
            /**
             * The title of the book.
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /**
             * The author of the book.
             * @minLength 2
             * @maxLength 100
             */
            authorId: string;
            /**
             * The publisher of the book.
             * @minLength 2
             * @maxLength 100
             */
            publisherId: string;
            /**
             * The year the book was published.
             * @min 0
             * @max 2025
             */
            publishedYear?: number;
            /**
             * The ISBN of the book.
             * @maxLength 20
             * @pattern ^(97(8|9))?\d{9}(\d|X)$
             */
            isbn?: string;
            /**
             * The genre of the book.
             * @minLength 2
             * @maxLength 50
             */
            genre?: string;
            /** Timestamp when the book was created. */
            createdAt: string;
            /** The language of the book. */
            language: "en" | "ar" | "other";
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
            /** @format uuid */
            id: string;
            /**
             * The title of the book.
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /**
             * The author of the book.
             * @minLength 2
             * @maxLength 100
             */
            authorId: string;
            /**
             * The publisher of the book.
             * @minLength 2
             * @maxLength 100
             */
            publisherId: string;
            /**
             * The year the book was published.
             * @min 0
             * @max 2025
             */
            publishedYear?: number;
            /**
             * The ISBN of the book.
             * @maxLength 20
             * @pattern ^(97(8|9))?\d{9}(\d|X)$
             */
            isbn?: string;
            /**
             * The genre of the book.
             * @minLength 2
             * @maxLength 50
             */
            genre?: string;
            /** Timestamp when the book was created. */
            createdAt: string;
            /** The language of the book. */
            language: "en" | "ar" | "other";
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
           * The title of the book.
           * @minLength 2
           * @maxLength 200
           */
          title: string;
          /**
           * The author of the book.
           * @minLength 2
           * @maxLength 100
           */
          author: string;
          /**
           * The publisher of the book.
           * @minLength 2
           * @maxLength 100
           */
          publisher: string;
          /**
           * The ISBN of the book.
           * @maxLength 20
           * @pattern ^(97(8|9))?\d{9}(\d|X)$
           */
          isbn: string;
          /**
           * The genre of the book.
           * @minLength 2
           * @maxLength 50
           */
          genre: string;
          /**
           * The year the book was published.
           * @min 0
           * @max 2025
           */
          publishedYear?: number;
          /** The language of the book. */
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
            /** @format uuid */
            id: string;
            /**
             * The title of the book.
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /**
             * The author of the book.
             * @minLength 2
             * @maxLength 100
             */
            authorId: string;
            /**
             * The publisher of the book.
             * @minLength 2
             * @maxLength 100
             */
            publisherId: string;
            /**
             * The year the book was published.
             * @min 0
             * @max 2025
             */
            publishedYear?: number;
            /**
             * The ISBN of the book.
             * @maxLength 20
             * @pattern ^(97(8|9))?\d{9}(\d|X)$
             */
            isbn?: string;
            /**
             * The genre of the book.
             * @minLength 2
             * @maxLength 50
             */
            genre?: string;
            /** Timestamp when the book was created. */
            createdAt: string;
            /** The language of the book. */
            language: "en" | "ar" | "other";
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
          responseObject?: {
            /** @format uuid */
            id: string;
            /**
             * The title of the book.
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /**
             * The author of the book.
             * @minLength 2
             * @maxLength 100
             */
            authorId: string;
            /**
             * The publisher of the book.
             * @minLength 2
             * @maxLength 100
             */
            publisherId: string;
            /**
             * The year the book was published.
             * @min 0
             * @max 2025
             */
            publishedYear?: number;
            /**
             * The ISBN of the book.
             * @maxLength 20
             * @pattern ^(97(8|9))?\d{9}(\d|X)$
             */
            isbn?: string;
            /**
             * The genre of the book.
             * @minLength 2
             * @maxLength 50
             */
            genre?: string;
            /** Timestamp when the book was created. */
            createdAt: string;
            /** The language of the book. */
            language: "en" | "ar" | "other";
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
         * The title of the book.
         * @minLength 2
         * @maxLength 200
         */
        title?: string;
        /**
         * The author of the book.
         * @minLength 2
         * @maxLength 100
         */
        author?: string;
        /**
         * The publisher of the book.
         * @minLength 2
         * @maxLength 100
         */
        publisher?: string;
        /**
         * The ISBN of the book.
         * @maxLength 20
         * @pattern ^(97(8|9))?\d{9}(\d|X)$
         */
        isbn?: string;
        /**
         * The genre of the book.
         * @minLength 2
         * @maxLength 50
         */
        genre?: string;
        /**
         * The year the book was published.
         * @min 0
         * @max 2025
         */
        publishedYear?: number;
        /** The language of the book. */
        language?: "en" | "ar" | "other";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          success: boolean;
          message: string;
          responseObject?: {
            /** @format uuid */
            id: string;
            /**
             * The title of the book.
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /**
             * The author of the book.
             * @minLength 2
             * @maxLength 100
             */
            authorId: string;
            /**
             * The publisher of the book.
             * @minLength 2
             * @maxLength 100
             */
            publisherId: string;
            /**
             * The year the book was published.
             * @min 0
             * @max 2025
             */
            publishedYear?: number;
            /**
             * The ISBN of the book.
             * @maxLength 20
             * @pattern ^(97(8|9))?\d{9}(\d|X)$
             */
            isbn?: string;
            /**
             * The genre of the book.
             * @minLength 2
             * @maxLength 50
             */
            genre?: string;
            /** Timestamp when the book was created. */
            createdAt: string;
            /** The language of the book. */
            language: "en" | "ar" | "other";
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
            /** @format uuid */
            id: string;
            /**
             * The title of the book.
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /**
             * The author of the book.
             * @minLength 2
             * @maxLength 100
             */
            authorId: string;
            /**
             * The publisher of the book.
             * @minLength 2
             * @maxLength 100
             */
            publisherId: string;
            /**
             * The year the book was published.
             * @min 0
             * @max 2025
             */
            publishedYear?: number;
            /**
             * The ISBN of the book.
             * @maxLength 20
             * @pattern ^(97(8|9))?\d{9}(\d|X)$
             */
            isbn?: string;
            /**
             * The genre of the book.
             * @minLength 2
             * @maxLength 50
             */
            genre?: string;
            /** Timestamp when the book was created. */
            createdAt: string;
            /** The language of the book. */
            language: "en" | "ar" | "other";
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
            /** @format uuid */
            id: string;
            /**
             * The title of the book.
             * @minLength 2
             * @maxLength 200
             */
            title: string;
            /**
             * The author of the book.
             * @minLength 2
             * @maxLength 100
             */
            authorId: string;
            /**
             * The publisher of the book.
             * @minLength 2
             * @maxLength 100
             */
            publisherId: string;
            /**
             * The year the book was published.
             * @min 0
             * @max 2025
             */
            publishedYear?: number;
            /**
             * The ISBN of the book.
             * @maxLength 20
             * @pattern ^(97(8|9))?\d{9}(\d|X)$
             */
            isbn?: string;
            /**
             * The genre of the book.
             * @minLength 2
             * @maxLength 50
             */
            genre?: string;
            /** Timestamp when the book was created. */
            createdAt: string;
            /** The language of the book. */
            language: "en" | "ar" | "other";
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
}
