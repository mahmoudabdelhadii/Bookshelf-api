import { integer, text, uniqueIndex, timestamp, index } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { sql } from "drizzle-orm";

export const book = server.table(
  "book",
  {
    id: idpk("id"),
    title: text("title").notNull(),
    description: text("description"),
    author: text("author").notNull(),
    publishedYear: integer("published_year"),
    isbn: text("isbn").unique(),
    genre: text("genre"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    isbnIndex: uniqueIndex("unique_isbn").on(table.isbn),

    
    titleTrgmIndex: index("books_title_trgm_idx").using(
      "gin",
      sql`${table.title} gin_trgm_ops`
    ),

    
    titleTsvIndex: index("books_title_tsv_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.title}) || to_tsvector('arabic', ${table.title})`
    ),

    
    searchIndex: index("books_search_idx").using(
      "gin",
      sql`(
        setweight(to_tsvector('english', ${table.title}), 'A') ||
        setweight(to_tsvector('arabic', ${table.title}), 'A') ||
        setweight(to_tsvector('english', ${table.description}), 'B') ||
        setweight(to_tsvector('arabic', ${table.description}), 'B')
      )`
    ),
  }),
);