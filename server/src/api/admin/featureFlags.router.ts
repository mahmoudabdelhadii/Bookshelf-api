import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { isbndbQueue } from "../../services/isbndbQueue.js";
import { BookLookupService } from "../../services/bookLookup.js";
import { env } from "../../common/utils/envConfig.js";
import { validateRequest } from "../../common/middleware/validateRequest.js";

const router = Router();

const lookupBookValidation = [body("isbn").isString().withMessage("ISBN must be a string")];

router.get("/", (req: Request, res: Response) => {
  const flags = {
    isbndbEnabled: env.ISBNDB_ENABLED,
    isbndbApiKeyConfigured: !!(env.ISBNDB_API_KEY && env.ISBNDB_API_KEY.length > 0),
    queueStats: isbndbQueue.getQueueStats(),
  };

  res.json({
    success: true,
    data: flags,
  });
});

router.get("/cache-stats", (req: Request, res: Response): void => {
  BookLookupService.getCacheStats(req.drizzle)
    .then((stats) => {
      res.json({
        success: true,
        data: stats,
      });
    })
    .catch(() => {
      res.status(500).json({
        success: false,
        error: "Failed to get cache stats",
      });
    });
});

router.post("/lookup-book", lookupBookValidation, validateRequest, (req: Request, res: Response): void => {
  const { isbn } = req.body as { isbn: string };

  BookLookupService.getBookByISBN(req.drizzle, isbn, true) // Force refresh
    .then((book) => {
      if (book) {
        res.json({
          success: true,
          data: book,
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Book not found",
        });
      }
    })
    .catch(() => {
      res.status(500).json({
        success: false,
        error: "Failed to lookup book",
      });
    });
});

export { router as featureFlagsRouter };
