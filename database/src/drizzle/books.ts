import { uuid, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";


export const books = server.table(
  "books",
  {
    id: idpk("id"),
    
  },
  (table) => {
    return {

    };
  },
);
