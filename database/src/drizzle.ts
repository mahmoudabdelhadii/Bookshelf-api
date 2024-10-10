import pg from "pg";
import { drizzle as createDrizzle } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION_LIMIT, DATABASE_URL } from "./env.js";
import * as schema from "./drizzle/index.js";
import { logger } from "./logger.js";
import { Column, ColumnBaseConfig, ColumnDataType, SQL, sql } from "drizzle-orm";

export * from "drizzle-orm";
export { alias, getTableConfig, type PgUpdateSetSource, type PgInsertValue } from "drizzle-orm/pg-core";
export { schema };

export function connect(appName: string) {
  // eslint-disable-next-line import/no-named-as-default-member -- it's wrong!
  const client = new pg.Pool({
    connectionString: DATABASE_URL,
    max: DATABASE_CONNECTION_LIMIT ?? undefined,
    allowExitOnIdle: true,
    statement_timeout: 10_000,
    query_timeout: 10_000,
    application_name: appName,
    idle_in_transaction_session_timeout: 10_000,
  });
  const drizzle = createDrizzle(client, {
    schema,
    logger: {
      logQuery(query, params) {
        logger.query({ query, params }, "Drizzle query");
      },
    },
  });
  return { drizzle, close: () => client.end() };
}
export type DrizzleClient = Awaited<ReturnType<typeof connect>>["drizzle"];

export function coalesce<T>(...elements: (SQL | Column)[]) {
  return sql<T>`COALESCE(${sql.join(elements, sql.raw(", "))})`;
}

export function least<T>(...elements: (SQL | Column)[]) {
  return sql<T>`LEAST(${sql.join(elements, sql.raw(", "))})`;
}

export function greatest<T>(...elements: (SQL | Column)[]) {
  return sql<T>`GREATEST(${sql.join(elements, sql.raw(", "))})`;
}

export function now(): SQL<Date> {
  return sql`now()`.mapWith((d: string) => new Date(d));
}

export function addSeconds<TColumn extends Column>(value: SQL | TColumn, seconds: number): SQL<Date> {
  const intervalString = `${Math.abs(seconds)} seconds`;
  return seconds < 0
    ? sql`${value} - ${intervalString}::interval`.mapWith((d: string) => new Date(d))
    : sql`${value} + ${intervalString}::interval`.mapWith((d: string) => new Date(d));
}

export function addMilliseconds<TColumn extends Column>(
  value: SQL | TColumn,
  milliseconds: number,
): SQL<Date> {
  const intervalString = `${Math.abs(milliseconds)} milliseconds`;
  return milliseconds < 0
    ? sql`${value} - ${intervalString}::interval`.mapWith((d: string) => new Date(d))
    : sql`${value} + ${intervalString}::interval`.mapWith((d: string) => new Date(d));
}

export function addMinutes<TColumn extends Column>(value: SQL | TColumn, minutes: number): SQL<Date> {
  const intervalString = `${Math.abs(minutes)} minutes`;
  return minutes < 0
    ? sql`${value} - ${intervalString}::interval`.mapWith((d: string) => new Date(d))
    : sql`${value} + ${intervalString}::interval`.mapWith((d: string) => new Date(d));
}

export function addHours<TColumn extends Column>(value: SQL | TColumn, hours: number): SQL<Date> {
  const intervalString = `${Math.abs(hours)} hours`;
  return hours < 0
    ? sql`${value} - ${intervalString}::interval`.mapWith((d: string) => new Date(d))
    : sql`${value} + ${intervalString}::interval`.mapWith((d: string) => new Date(d));
}

export function addDays<TColumn extends Column>(value: SQL | TColumn, days: number): SQL<Date> {
  const intervalString = `${Math.abs(days)} days`;
  return days < 0
    ? sql`${value} - ${intervalString}::interval`.mapWith((d: string) => new Date(d))
    : sql`${value} + ${intervalString}::interval`.mapWith((d: string) => new Date(d));
}

export function secondsSince<TColumn extends Column>(
  since: SQL | TColumn,
  to: SQL | TColumn = now(),
): SQL<number> {
  return sql`EXTRACT(EPOCH FROM ${to} - ${since})::double precision`.mapWith(Number);
}

export function jsonTextAt<TColumn extends Column>(source: SQL | TColumn, ...path: string[]) {
  const paths = path.map((path) => sql`${path}`);
  return sql<string>`${source}->>${sql.join(paths, sql.raw("->>"))}`;
}

export function jsonNumberAt<TColumn extends Column>(source: SQL | TColumn, ...path: string[]) {
  const paths = path.map((path) => sql`${path}`);
  return sql<number>`cast(${source}->${sql.join(paths, sql.raw("->"))} as double precision)`;
}

export function excluded<TColumn extends Column>(column: TColumn) {
  return sql.raw(`excluded.${column.name}`);
}

type AggregateOptions = {
  orderBy?: (Column | SQL | SQL.Aliased)[];
};

export function jsonAgg<T>(expr: SQL<T> | Column, options: AggregateOptions = {}): SQL<T[]> {
  const body = sql`${expr}`;
  if (options.orderBy) {
    body.append(sql` ORDER BY ${sql.join(options.orderBy)}`);
  }
  return sql<T[]>`jsonb_agg(${body})`;
}

type TypeForColumn<U extends ColumnDataType> = U extends "string" ? string : unknown;

export function jsonObject<K extends string, T extends Record<K, SQL | Column>>(
  spec: T,
): SQL<{
  [K in keyof T]: T[K] extends SQL<infer U>
    ? U
    : T[K] extends Column<ColumnBaseConfig<infer U, string>>
      ? TypeForColumn<U>
      : unknown;
}> {
  return Object.entries(spec).reduce(
    (obj, [key, value]) => sql`jsonb_set(${obj}, ARRAY[cast(${key} as TEXT)], to_jsonb(${value}))`,
    sql`'{}'::jsonb`,
  ) as SQL<{
    [K in keyof T]: T[K] extends SQL<infer U>
      ? U
      : T[K] extends Column<ColumnBaseConfig<infer U, string>>
        ? TypeForColumn<U>
        : unknown;
  }>;
}

export function lower<TColumn extends Column>(value: SQL | TColumn): SQL {
  return sql`LOWER(${value})`;
}
