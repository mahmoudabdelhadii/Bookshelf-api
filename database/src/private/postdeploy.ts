// import { connect, sql } from "../drizzle.js";

// async function main() {
//   const { drizzle, close } = connect("postdeploy");
//   // NOTE: Very unsafe, but such is postdeploy.
//   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//   for (const role of JSON.parse(process.env.GRAPHQL_ROLES!)) {
//     await drizzle.execute(sql.raw(`GRANT bookshelf_graphql_user TO "${role}"`));
//     await drizzle.execute(sql.raw(`REVOKE cloudsqlsuperuser FROM "${role}"`));
//     await drizzle.execute(sql.raw(`ALTER ROLE "${role}" WITH NOCREATEDB NOCREATEROLE`));
//   }
//   await close();
// }

// void main();
