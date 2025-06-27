import { integer, text, uniqueIndex, timestamp, index, uuid } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
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

    authorId: uuid("author_id")
      .notNull()
      .references(() => author.id, { onDelete: "cascade" }),

    publisherId: uuid("publisher_id")
      .notNull()
      .references(() => publisher.id, { onDelete: "cascade" }),

    subjectId: uuid("subject_id").references(() => subject.id, {
      onDelete: "set null",
    }),

    genre: text("genre"),
    datePublished: timestamp("date_published", {
      withTimezone: true,
    }),
    edition: text("edition"),
    pages: integer("pages"),
    overview: text("overview"),
    image: text("image"),
    excerpt: text("excerpt"),
    synopsis: text("synopsis"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("unique_isbn").on(table.isbn),

    index("books_title_trgm_idx").using("gin", sql`${table.title} gin_trgm_ops`),

    index("books_title_tsv_idx").using(
      "gin",
      sql`(
        to_tsvector('english', coalesce(${table.title}, '')) ||
        to_tsvector('arabic', coalesce(${table.title}, '')) ||
        to_tsvector('simple', coalesce(${table.title}, ''))
      )`,
    ),

    index("books_search_idx").using(
      "gin",
      sql`(
        setweight(to_tsvector('english', coalesce(${table.title}, '')), 'A') ||
        setweight(to_tsvector('arabic', coalesce(${table.title}, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(${table.title}, '')), 'A') ||

        setweight(to_tsvector('english', coalesce(${table.overview}, '')), 'B') ||
        setweight(to_tsvector('arabic', coalesce(${table.overview}, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(${table.overview}, '')), 'B') ||

        setweight(to_tsvector('english', coalesce(${table.excerpt}, '')), 'C') ||
        setweight(to_tsvector('arabic', coalesce(${table.excerpt}, '')), 'C') ||
        setweight(to_tsvector('simple', coalesce(${table.excerpt}, '')), 'C') ||

        setweight(to_tsvector('english', coalesce(${table.synopsis}, '')), 'D') ||
        setweight(to_tsvector('arabic', coalesce(${table.synopsis}, '')), 'D') ||
        setweight(to_tsvector('simple', coalesce(${table.synopsis}, '')), 'D')
      )`,
    ),
  ],
);
