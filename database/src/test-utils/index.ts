import { connect, type DrizzleClient } from "database";

export interface MockRequest {
  drizzle: DrizzleClient;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string>;
  get: (header: string) => string | undefined;
  ip: string;
  url: string;
  method: string;
}

export interface MockResponse {
  status: (code: number) => this;
  send: (data: unknown) => this;
  json: (data: unknown) => this;
  statusCode: number;
  body: unknown;
}

export async function setupTestDb(
  testName: string,
): Promise<{ drizzle: DrizzleClient; close: () => Promise<void> }> {
  const { drizzle, close } = connect(testName);
  return { drizzle, close };
}

export function createMockRequest(drizzle: DrizzleClient): MockRequest {
  return {
    drizzle,
    params: {},
    query: {},
    body: {},
    headers: {},
    get: () => undefined,
    ip: "127.0.0.1",
    url: "/test",
    method: "GET",
  };
}

export function createMockResponse(): MockResponse {
  const res: MockResponse = {
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(data: unknown) {
      this.body = data;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
    statusCode: 200,
    body: null,
  };

  return res;
}
