import { env } from "../envConfig.js";

export async function callISBNdb<T>(path: string, options?: RequestInit): Promise<T> {

  const response = await fetch(`https://api2.isbndb.com${path}`, {
    headers: {
      ...(options?.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: env.ISBNDB_API_KEY,
    },
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Not found");
    } else {
      throw new Error(`ISBNdb API error: ${response.status} ${response.statusText}`);
    }
  }
  return response.json();
}
