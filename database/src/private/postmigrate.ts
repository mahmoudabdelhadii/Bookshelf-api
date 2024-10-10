// import { connect, sql } from "../drizzle.js";

// async function main() {
//   const { drizzle, close } = connect("postmigrate");
//   await drizzle.execute(sql`
// CREATE OR REPLACE FUNCTION safe_create_bookshelf_user() RETURNS void AS $$
// DECLARE
//     already_exists BOOLEAN;
// BEGIN
//     SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gateway') INTO already_exists;

//     IF NOT already_exists THEN
//         CREATE ROLE gateway IN ROLE bookshelf_graphql_user LOGIN PASSWORD 'gateway';
//     END IF;
// END
// $$ LANGUAGE plpgsql
// `);
//   await drizzle.execute(sql`SELECT safe_create_bookshelf_user()`);
//   await drizzle.execute(sql`DROP FUNCTION safe_create_bookshelf_user()`);
//   await close();
// }

// void main();
