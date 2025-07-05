import { Router } from "express";
import { isbndbQueue } from "../../services/isbndbQueue.js";
import { BookLookupService } from "../../services/bookLookup.js";
import { env } from "../../common/utils/envConfig.js";

const router = Router();


router.get("/", (req, res) => {
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


router.get("/cache-stats", async (req, res) => {
  try {
    const stats = await BookLookupService.getCacheStats(req.drizzle);
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to get cache stats",
    });
  }
});


router.post("/lookup-book", async (req, res) => {
  const { isbn } = req.body;

  if (!isbn) {
    return res.status(400).json({
      success: false,
      error: "ISBN is required",
    });
  }

  try {
    const book = await BookLookupService.getBookByISBN(req.drizzle, isbn, true); // Force refresh

    if (book) {
      return res.json({
        success: true,
        data: book,
      });
    } 
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to lookup book",
    });
  }
});

export { router as featureFlagsRouter };
