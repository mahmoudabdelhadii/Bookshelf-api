import { env } from "../envConfig.js";

export async function callISBNdb<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`https:
    headers: Object.assign(
      {
        "Content-Type": "application/json",
        Authorization: env.ISBNDB_API_KEY,
      },
      options?.headers ?? {},
    ),
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Not found");
    } else {
      throw new Error(`ISBNdb API error: ${response.status} ${response.statusText}`);
    }
  }
  const json = (await response.json()) as unknown;
  return json as T;
}
