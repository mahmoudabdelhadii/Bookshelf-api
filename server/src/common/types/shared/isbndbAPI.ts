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

/** Describes the results of a query in the author's database */
export interface AuthorQueryResults {
  total?: number;
  authors?: string[];
}

/** Describes a book in the book's database */
export interface Book {
  book?: {
    title?: string;
    title_long?: string;
    isbn?: string;
    isbn13?: string;
    dewey_decimal?: string[];
    binding?: string;
    publisher?: string;
    language?: string;
    /** @format date-time */
    date_published?: string;
    edition?: string;
    pages?: number;
    dimensions?: string;
    /** Structured information about the book's dimensions. */
    dimensions_structured?: {
      length?: {
        unit?: string;
        value?: number;
      };
      width?: {
        unit?: string;
        value?: number;
      };
      height?: {
        unit?: string;
        value?: number;
      };
      weight?: {
        unit?: string;
        value?: number;
      };
    };
    overview?: string;
    /** The link to the cover image */
    image?: CoverLink;
    /** Cover image URL in the highest available quality, valid for 2 hours after the request is executed. */
    image_original?: CoverLinkOriginal;
    msrp?: number;
    excerpt?: string;
    synopsis?: string;
    authors?: string[];
    subjects?: string[];
    reviews?: string[];
    /** Only shows if the query param 'with_prices' is present. */
    prices?: Merchant[];
    related?: {
      type?: string;
    };
    other_isbns?: {
      isbn?: string;
      binding?: string;
    }[];
  };
}

/** Describes the name of an author and the books written by that author in the database */
export interface Author {
  author?: string;
  books?: Book[];
}

export interface Publisher {
  name?: string;
  books?: {
    isbn?: string;
  }[];
}

export interface Subject {
  subject?: string;
  parent?: string;
}

/** The link to the cover image */
export type CoverLink = string;

/** Cover image URL in the highest available quality, valid for 2 hours after the request is executed. */
export type CoverLinkOriginal = string;

/** Describe the conditions of the price by merchant. Only with the Pro plan */
export interface Merchant {
  condition?: string;
  merchant?: string;
  merchant_logo?: string;
  merchant_logo_offset?: {
    x?: string;
    y?: string;
  };
  shipping?: string;
  price?: string;
  total?: string;
  link?: string;
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

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
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
  public baseUrl: string = "https://api2.isbndb.com";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

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
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) =>
        Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key),
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
      input !== null && typeof input !== "string" ? JSON.stringify(input) : input,
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

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
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

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
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
          ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
        },
        signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
        body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
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
 * @title ISBNdb API v2
 * @version 2.0.0
 * @baseUrl https://api2.isbndb.com
 *
 * Definition of ISBNdb.com API v2.
 *
 * If you are a **PREMIUM** subscriber you are entitled to **3 requests per second limit**. To access this benefit use the following [ Base URL: api.premium.isbndb.com ]
 * *Please note that the above is only available for **PREMIUM** subscribers. Attempting to use your API key if you are in a different subscription plan will result in access being denied.*
 *
 * If you are a **PRO** subscriber you are entitled to **5 requests per second limit**. To access this benefit use the following [ Base URL: api.pro.isbndb.com ]
 * *Please note that the above is only available for **PRO** subscribers. Attempting to use your API key if you are in a different subscription plan will result in access being denied.*
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  author = {
    /**
     * @description Returns the name and a list of books by the author.
     *
     * @tags Author
     * @name AuthorDetail
     * @summary Gets author details
     * @request GET:/author/{name}
     * @secure
     */
    authorDetail: (
      name: string,
      query?: {
        /**
         * The number of page to retrieve, please note the API will not return more than 10,000 results no matter how you paginate them
         * @default 1
         */
        page?: number;
        /**
         * How many items should be returned per page, maximum of 1,000
         * @default 20
         */
        pageSize?: number;
        /** Language code to filter books by language (e.g., 'en' for English, 'fr' for French, etc.) */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Author, void>({
        path: `/author/${name}`,
        method: "GET",
        query: query,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  authors = {
    /**
     * @description This returns a list of authors whos name matches the given query
     *
     * @tags Author
     * @name AuthorsDetail
     * @summary Search authors
     * @request GET:/authors/{query}
     * @secure
     */
    authorsDetail: (
      query: string,
      queryParams?: {
        /** How many items should be returned per page, maximum of 1,000 */
        pageSize?: string;
        /** The number of page to retrieve, please note the API will not return more than 10,000 results no matter how you paginate them */
        page?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<AuthorQueryResults, void>({
        path: `/authors/${query}`,
        method: "GET",
        query: queryParams,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  book = {
    /**
     * @description Returns the book details __A 404 Not Found response for an ISBN lookup typically indicates that the book information is not yet available in our database. However, due to frequent updates, there is a high probability that the data will be added shortly, often within a minute or up to 24 hours. We recommend trying your request again after a while, as the information may soon become accessible__.
     *
     * @tags Book
     * @name BookDetail
     * @summary Gets book details
     * @request GET:/book/{isbn}
     * @secure
     */
    bookDetail: (
      isbn: string,
      query?: {
        /** indicate if shows Real Time Prices. Only with the Pro plan */
        with_prices?: "1" | "0";
      },
      params: RequestParams = {},
    ) =>
      this.request<Book, void>({
        path: `/book/${isbn}`,
        method: "GET",
        query: query,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  books = {
    /**
     * @description This method returns a list of books that match the query and is available on all plans. The endpoint has no pagination but comes with the following limits based on your plan:<ul><li>Academic: Up to 10 ISBN numbers per request.</li><li>Basic: Up to 100 ISBN numbers per request.</li><li>Pro and Premium: Up to 1,000 ISBN numbers per request.</li></ul> If you send 100 ISBN numbers you will get information back for all 100 books in the response provided the ISBNs do exist in the ISBNdb Database. ISBN Numbers not found in the ISBNdb database will not be part of the response. There is a limit of up to 6MB response size, if the limit is exceeded you will get a 500 error reply. __This endpoint does not return pricing information.__
     *
     * @tags Book
     * @name BooksCreate
     * @summary Search books
     * @request POST:/books
     * @secure
     */
    booksCreate: (
      data: {
        /** a list of ISBN 10 or ISBN 13 in the Books database */
        isbns: string[];
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/books`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description This returns a list of books that match the query. __This endpoint does not return pricing information.__
     *
     * @tags Book
     * @name BooksDetail
     * @summary Search books
     * @request GET:/books/{query}
     * @secure
     */
    booksDetail: (
      query: string,
      queryParams?: {
        /**
         * The number of page to retrieve, please note the API will not return more than 10,000 results no matter how you paginate them
         * @default 1
         */
        page?: number;
        /**
         * How many items should be returned per page, maximum of 1,000
         * @default 20
         */
        pageSize?: number;
        /**
         * Search limited to this column:
         *  * `` - Empty value search in every column
         *  * `title` - Only searches in Books Title
         *  * `author` - Only searches books by the given Author
         *  * `date_published` - Only searches books in a given year, e.g. 1998
         *  * `subjects` - Only searches books by the given subject, e.g. physics
         * @default ""
         */
        column?: "" | "title" | "author" | "date_published" | "subjects";
        /** Filter books by year of publication */
        year?: number;
        /** Filter books by edition */
        edition?: number;
        /** Language code to filter books by language (e.g., 'en' for English, 'fr' for French, etc.) */
        language?: string;
        /**
         * An integer (1 or 0). If set to 1, the API will return books where the title or author exactly contains all the words entered by the user.
         * @default 0
         */
        shouldMatchAll?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/books/${query}`,
        method: "GET",
        query: queryParams,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  publisher = {
    /**
     * @description Returns details and a list of books by the publisher.
     *
     * @tags Publisher
     * @name PublisherDetail
     * @summary Gets publisher details
     * @request GET:/publisher/{name}
     * @secure
     */
    publisherDetail: (
      name: string,
      query?: {
        /**
         * The number of page to retrieve, please note the API will not return more than 10,000 results no matter how you paginate them
         * @default 1
         */
        page?: number;
        /**
         * How many items should be returned per page, maximum of 1,000
         * @default 20
         */
        pageSize?: number;
        /** Language code to filter books by language (e.g., 'en' for English, 'fr' for French, etc.) */
        language?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Publisher, void>({
        path: `/publisher/${name}`,
        method: "GET",
        query: query,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  publishers = {
    /**
     * @description This returns a list of publishers that match the given query
     *
     * @tags Publisher
     * @name PublishersDetail
     * @summary Search publishers
     * @request GET:/publishers/{query}
     * @secure
     */
    publishersDetail: (
      query: string,
      queryParams?: {
        /** How many items should be returned per page, maximum of 1,000 */
        pageSize?: string;
        /** The number of page to retrieve, please note the API will not return more than 10,000 results no matter how you paginate them */
        page?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/publishers/${query}`,
        method: "GET",
        query: queryParams,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  search = {
    /**
     * @description Uses a determined index and query string to search in any of the ISBNDB's databases
     *
     * @tags Search
     * @name SearchDetail
     * @summary Search all ISBNDB databases
     * @request GET:/search/{index}
     * @secure
     */
    searchDetail: (
      index: "subjects" | "publishers" | "authors" | "books",
      query?: {
        /** The number of page to retrieve, please note the API will not return more than 10,000 results no matter how you paginate them */
        page?: string;
        /** How many items should be returned per page, maximum of 1,000 */
        pageSize?: string;
        /** an ISBN 10 in the Books database */
        isbn?: string;
        /** an ISBN 13 in the Books database */
        isbn13?: string;
        /** The name of an author in the Author's database */
        author?: string;
        /** A string to search for determinated index database */
        text?: string;
        /** A subject in the Subject's database */
        subject?: string;
        /** The name of a publisher in the Publisher's database */
        publisher?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/search/${index}`,
        method: "GET",
        query: query,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
  stats = {
    /**
     * @description Returns a status object about the ISBNDB database.
     *
     * @tags Stats
     * @name StatsList
     * @summary Gets status on the ISBNDB Database
     * @request GET:/stats
     * @secure
     */
    statsList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/stats`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  subject = {
    /**
     * @description Returns details and a list of books with subject.
     *
     * @tags Subject
     * @name SubjectDetail
     * @summary Gets subject details
     * @request GET:/subject/{name}
     * @secure
     */
    subjectDetail: (name: string, params: RequestParams = {}) =>
      this.request<Subject, void>({
        path: `/subject/${name}`,
        method: "GET",
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  subjects = {
    /**
     * @description This returns a list of subjects that match the given query
     *
     * @tags Subject
     * @name SubjectsDetail
     * @summary Search subjects
     * @request GET:/subjects/{query}
     * @secure
     */
    subjectsDetail: (
      query: string,
      queryParams?: {
        /** How many items should be returned per page, maximum of 1,000 */
        pageSize?: string;
        /** The number of page to retrieve, please note the API will not return more than 10,000 results no matter how you paginate them */
        page?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/subjects/${query}`,
        method: "GET",
        query: queryParams,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
}
