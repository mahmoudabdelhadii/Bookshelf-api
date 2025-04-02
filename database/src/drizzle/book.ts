import { integer, text, uniqueIndex, timestamp, index, uuid } from "drizzle-orm/pg-core";
import { idpk, server,tsvector } from "./_common.js";
import { sql } from "drizzle-orm";
import { author } from "./author.js";
import { publisher } from "./publisher.js";
import { subject } from "./subject.js";

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
    language: languageEnum("language").default("other").notNull(),

    authorId: uuid("author_id").notNull().references(() => author.id, { onDelete: "cascade" }),

    publisherId: uuid("publisher_id").notNull().references(() => publisher.id, { onDelete: "cascade" }),

    subjectId: uuid("subject_id").references(() => subject.id, { onDelete: "set null" }),

    genre: text("genre"),
    datePublished: timestamp("date_published", { withTimezone: true, mode: "string" }),
    edition: text("edition"),
    pages: integer("pages"),
    overview: text("overview"),
    image: text("image"),
    excerpt: text("excerpt"),
    synopsis: text("synopsis"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    titleTsv: tsvector("title_tsv").generatedAlwaysAs(
      sql`to_tsvector('english', coalesce(title, '')) ||
          to_tsvector('arabic', coalesce(title, '')) ||
          to_tsvector('simple', coalesce(title, ''))`
    ),
    
    searchTsv: tsvector("search_tsv").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('arabic', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(overview, '')), 'B') ||
          setweight(to_tsvector('arabic', coalesce(overview, '')), 'B') ||
          setweight(to_tsvector('simple', coalesce(overview, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
          setweight(to_tsvector('arabic', coalesce(excerpt, '')), 'C') ||
          setweight(to_tsvector('simple', coalesce(excerpt, '')), 'C') ||
          setweight(to_tsvector('english', coalesce(synopsis, '')), 'D') ||
          setweight(to_tsvector('arabic', coalesce(synopsis, '')), 'D') ||
          setweight(to_tsvector('simple', coalesce(synopsis, '')), 'D')`
    ),
  },
  (table) => ({
    isbnIndex: uniqueIndex("unique_isbn").on(table.isbn),
    titleTrgmIndex: index("books_title_trgm_idx").using("gin", sql`${table.title} gin_trgm_ops`),
    titleTsvIndex: index("books_title_tsv_idx").using("gin", table.titleTsv),
    searchIndex: index("books_search_idx").using("gin", table.searchTsv),
  })
);