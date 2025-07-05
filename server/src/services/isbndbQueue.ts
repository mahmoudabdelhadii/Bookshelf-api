import { isbnService } from "./isbnService.js";
import { Author, Publisher, Book } from "@/common/types/shared/isbndbAPI.js";

interface QueueItem {
  id: string;
  type: "book" | "author" | "publisher";
  data: any;
  priority: "high" | "low";
  retries: number;
  createdAt: Date;
  callback?: (error: Error | null, result?: any) => void;
}

class SimpleISBNDBQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private lastApiCall = 0;
  private readonly RATE_LIMIT_MS = 1000; // 1 second between calls
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 5000; // 5 seconds

  constructor() {
    this.startProcessing();
  }

  async addToQueue(
    type: "book" | "author" | "publisher",
    data: any,
    priority: "high" | "low" = "low",
    callback?: (error: Error | null, result?: any) => void,
  ): Promise<void> {
    const item: QueueItem = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      data,
      priority,
      retries: 0,
      createdAt: new Date(),
      callback,
    };

    // Insert based on priority
    if (priority === "high") {
      this.queue.unshift(item);
    } else {
      this.queue.push(item);
    }
  }

  private async startProcessing(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.processing) {
      if (this.queue.length === 0) {
        await this.sleep(1000); // Check every second
        continue;
      }

      const item = this.queue.shift();
      if (!item) continue;

      try {
        await this.processItem(item);
      } catch (err) {
        await this.handleFailedItem(item, err as Error);
      }
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    // Respect rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;

    if (timeSinceLastCall < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastCall;
      await this.sleep(waitTime);
    }

    this.lastApiCall = Date.now();

    let result;

    switch (item.type) {
      case "book":
        result = await this.fetchBookData(item.data);
        break;
      case "author":
        result = await this.fetchAuthorData(item.data);
        break;
      case "publisher":
        result = await this.fetchPublisherData(item.data);
        break;
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }

    if (item.callback) {
      item.callback(null, result);
    }
  }

  private async handleFailedItem(item: QueueItem, error: Error): Promise<void> {
    item.retries++;

    if (item.retries <= this.MAX_RETRIES) {
      // Add delay before retry
      setTimeout(() => {
        this.queue.unshift(item); // Add back to front for retry
      }, this.RETRY_DELAY_MS);
    } else if (item.callback) {
      item.callback(error);
    }
  }

  private async fetchBookData(data: { isbn: string }): Promise<Book> {
    return isbnService.getBookByISBN(data.isbn);
  }

  private async fetchAuthorData(data: { name: string }): Promise<Author> {
    return isbnService.getAuthorDetails(data.name);
  }

  private async fetchPublisherData(data: { name: string }): Promise<Publisher> {
    return isbnService.getPublisherDetails(data.name);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueStats(): { length: number; processing: boolean } {
    return {
      length: this.queue.length,
      processing: this.processing,
    };
  }

  stop(): void {
    this.processing = false;
  }
}

// Singleton instance
export const isbndbQueue = new SimpleISBNDBQueue();

// Helper function to queue book lookup with promise
export function queueBookLookup(isbn: string, priority: "high" | "low" = "low"): Promise<Book> {
  return new Promise((resolve, reject) => {
    isbndbQueue.addToQueue("book", { isbn }, priority, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

// Helper function to queue author lookup with promise
export function queueAuthorLookup(name: string, priority: "high" | "low" = "low"): Promise<Author> {
  return new Promise((resolve, reject) => {
    isbndbQueue.addToQueue("author", { name }, priority, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

// Helper function to queue publisher lookup with promise
export function queuePublisherLookup(name: string, priority: "high" | "low" = "low"): Promise<Publisher> {
  return new Promise((resolve, reject) => {
    isbndbQueue.addToQueue("publisher", { name }, priority, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}
