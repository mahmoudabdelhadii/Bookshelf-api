import { integer, text, uniqueIndex, timestamp, index } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { sql } from "drizzle-orm";


const languageEnum = server.enum("language", ["en", "ar", "other"]);

export const book = server.table(
  "book",
  {
    id: idpk("id"),
    title: text("title").notNull(),
    titleLong: text("title_long"),
    isbn: text("isbn").unique(),
    isbn13: text("isbn13"),
    deweyDecimal: text("dewey_decimal"),
    binding: text("binding"),
    publisher: text("publisher"),
    language: languageEnum("language").default("other").notNull(),
    author: text("author"),      
    genre: text("genre"),    
    datePublished: timestamp("date_published", { withTimezone: true, mode: "string" }),
    edition: text("edition"),
    pages: integer("pages"),
    overview: text("overview"),
  image: text("image"),
  excerpt: text("excerpt"),
  synopsis: text("synopsis"),
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
      sql`(
        to_tsvector('english', ${table.title}) ||
        to_tsvector('arabic', ${table.title})
      )`
    ),

    searchIndex: index("books_search_idx").using(
      "gin",
      sql`(
        setweight(to_tsvector('english', ${table.title}), 'A') ||
        setweight(to_tsvector('arabic', ${table.title}), 'A') ||
        setweight(to_tsvector('english', ${table.overview}), 'B') ||
        setweight(to_tsvector('arabic', ${table.overview}), 'B')
      )`
    ),
  }),
);