import { connect, type DrizzleClient } from "database";

export async function setupTestDb(testName: string): Promise<{ drizzle: DrizzleClient, close: () => Promise<void> }> {
  // Connect to test database with specific name for easier debugging
  const { drizzle, close } = await connect(testName);
  return { drizzle, close };
}

export function createMockRequest(drizzle: DrizzleClient) {
  return {
    drizzle,
    params: {},
    query: {},
    body: {},
    headers: {},
    get: (header: string) => undefined,
    ip: "127.0.0.1",
    url: "/test",
    method: "GET",
  } as any;
}

export function createMockResponse() {
  const res = {
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(data: any) {
      this.body = data;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
    statusCode: 200,
    body: null,
  } as any;
  
  return res;
}