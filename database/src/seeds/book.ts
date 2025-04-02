import { seed, reset } from "drizzle-seed";
import { book } from "../drizzle/book.js";
import { author } from "../drizzle/author.js";
import { publisher } from "../drizzle/publisher.js";
import {subject} from "../drizzle/subject.js"
import { Column, DrizzleClient } from "../drizzle.js";

export async function runSeed(drizzle: DrizzleClient) {
  console.log("🌱 Seeding authors and publishers...");

  console.log("🌱 Seeding books...");

  await reset(drizzle, { book,  author, publisher, subject });

  await seed(drizzle, { book, author, publisher, subject })
  .refine((funcs) => ({
    book: {
      count: 500,
      columns: {
        id: funcs.uuid(),
        title: funcs.string(),
        titleLong: funcs.string(),
        isbn: funcs.string(),
        isbn13: funcs.string(),
        deweyDecimal: funcs.string(),
        binding: funcs.valuesFromArray({ values: ["Hardcover", "Paperback", "Ebook"] }),
        language: funcs.valuesFromArray({ values: ["en", "ar", "other"] }),
        datePublished: funcs.date(),
        edition: funcs.int({ minValue: 1, maxValue: 10 }),
        pages: funcs.int({ minValue: 50, maxValue: 1000 }),
        overview: funcs.string(),
        image: funcs.string(),
        excerpt: funcs.string(),
        synopsis: funcs.string(),
        titleTsv:funcs.string(),
        searchTsv: funcs.string(),
        createdAt:funcs.date(),
      },
    },
    author: {
      count: 200,
      columns: {
        id: funcs.uuid(),
        name: funcs.fullName(),
        createdAt: funcs.date(),
      },
    },
    publisher: {
      count: 100,
      columns: {
        id: funcs.uuid(),
        name: funcs.companyName(),
        createdAt:funcs.date(),
      },
    },
    subject: {
      count: 50,
      columns: {
        id: funcs.uuid(),
        name: funcs.loremIpsum(),
        parent: funcs.loremIpsum(),
        createdAt:funcs.date(),
      },
    },
  }));
  

  console.log("✅ Books seeded!");
}