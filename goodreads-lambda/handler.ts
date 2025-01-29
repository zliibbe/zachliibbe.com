import { chromium, Page } from "playwright";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as path from "path";
import * as fs from "fs";

// Cache and rate limiting
let cachedData: any = null;
let lastFetch: number = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
const REQUEST_TIMEOUT = 30000; // 30 seconds
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 10;
let requestTimestamps: number[] = [];

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Rate limiting function
const checkRateLimit = () => {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(
    (timestamp) => now - timestamp < 60000
  );
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
  requestTimestamps.push(now);
};

// Increase timeouts significantly
const NAVIGATION_TIMEOUT = 60000; // 60 seconds
const PAGE_LOAD_TIMEOUT = 90000; // 90 seconds

// Helper function to get book details
async function getBookDetails(page: Page, bookUrl: string) {
  console.log("Getting details for book URL:", bookUrl);
  await page.goto(bookUrl);
  await page.waitForLoadState("networkidle");

  try {
    // Wait for the reading timeline to load
    console.log("Waiting for timeline");
    await page.waitForSelector(".readingTimeline__text", { timeout: 5000 });

    // Get the latest reading progress
    const progressTexts = await page.$$eval(
      ".readingTimeline__text",
      (elements) => elements.map((el) => el.textContent?.trim())
    );
    console.log("Progress texts:", progressTexts);

    const lastProgress = progressTexts[progressTexts.length - 1];
    console.log("Last progress:", lastProgress);
    const currentPage = lastProgress?.match(/page (\d+)/)?.[1];

    // Get total pages
    const totalPages = await page
      .$eval(
        '[data-testid="pagesFormat"]',
        (el) => el.textContent?.match(/\d+/)?.[0]
      )
      .catch(() => null);

    // Get author name
    const author = await page
      .$eval(".ContributorLink", (el) => el.textContent?.trim())
      .catch(() => null);

    // Get cover image URL
    const coverImg = await page
      .$eval(".BookCover__image img", (el) => el.getAttribute("src"))
      .catch(() => null);

    // Get last read time
    const lastReadTime = await page
      .$eval(".readingTimeline__text time", (el) => el.getAttribute("datetime"))
      .catch(() => null);

    const now = new Date();
    const lastRead = lastReadTime ? new Date(lastReadTime) : null;
    const hoursSince = lastRead
      ? Math.floor((now.getTime() - lastRead.getTime()) / (1000 * 60 * 60))
      : null;

    console.log("Book details found:", {
      currentPage,
      totalPages,
      author,
      coverImg,
      hoursSince,
    });

    return {
      currentPage: currentPage ? parseInt(currentPage) : null,
      totalPages: totalPages ? parseInt(totalPages) : null,
      author,
      coverImg,
      lastReadHours: hoursSince,
      link: bookUrl,
    };
  } catch (error) {
    console.log("Error getting book details:", error);
    return null;
  }
}

// Helper function to get book details from the post-login page
async function getBookDetailsFromLoginPage(page: Page) {
  try {
    console.log("Waiting for currently reading section");

    // Wait for the currently reading section using the exact React class
    await page.waitForSelector(
      '[data-react-class="ReactComponents.CurrentlyReading"]',
      {
        timeout: NAVIGATION_TIMEOUT,
        state: "attached",
      }
    );

    // Get all the information in one evaluate call
    const bookDetails = await page.evaluate(() => {
      // Get the book container using the specific class names
      const bookSection = document.querySelector(
        ".gr-mediaBox.gr-book--medium.gr-book.u-marginBottomSmall"
      );
      if (!bookSection) {
        console.log("Could not find currently reading section");
        return null;
      }

      // Get progress using the exact progress bar class
      const progressText = document
        .querySelector(".gr-progressBar")
        ?.getAttribute("aria-label");
      const progressMatch = progressText?.match(
        /Reading progress: (\d+)\/(\d+)/
      );
      console.log("Progress text found:", progressText);

      // Get book details using specific class names
      const titleElement = document.querySelector(".gr-book__title");
      const authorElement = document.querySelector(".gr-book__author");
      const coverElement = document.querySelector(".gr-mediaBox__media img");

      const details = {
        title: titleElement?.textContent?.trim() || null,
        author: authorElement?.textContent?.trim()?.replace("by ", "") || null,
        currentPage: progressMatch ? parseInt(progressMatch[1]) : null,
        totalPages: progressMatch ? parseInt(progressMatch[2]) : null,
        coverImg: coverElement?.getAttribute("src") || null,
        link:
          document
            .querySelector('a[href*="/book/show/"]')
            ?.getAttribute("href") || null,
        lastReadHours: 0,
      };

      console.log("Book details found:", details);
      return details;
    });

    return bookDetails;
  } catch (error) {
    console.error("Error getting book details:", error);
    return null;
  }
}

export const getCurrentlyReading = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let browser;
  const startTime = Date.now();
  console.log(`Lambda execution started at ${new Date().toISOString()}`);

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
      timeout: PAGE_LOAD_TIMEOUT,
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    const page = await context.newPage();
    page.setDefaultTimeout(NAVIGATION_TIMEOUT);

    // First navigate to sign in page
    console.log("Navigating to sign in page");
    await page.goto("https://www.goodreads.com/user/sign_in", {
      waitUntil: "networkidle",
      timeout: PAGE_LOAD_TIMEOUT,
    });

    // Take screenshot for debugging
    await page.screenshot({
      path: path.join(screenshotsDir, `before-login-${Date.now()}.png`),
    });

    // Click the email sign in button and wait for form
    console.log("Clicking email sign in button");
    await page.click("button.authPortalSignInButton");
    await page.waitForLoadState("networkidle");

    // Fill in the login form
    console.log("Filling login form");
    await page.fill('input[type="email"]', process.env.GOODREADS_EMAIL || "");
    await page.fill(
      'input[type="password"]',
      process.env.GOODREADS_PASSWORD || ""
    );

    // Click sign in and wait for redirect
    console.log("Submitting login form");
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.click('input[type="submit"]'),
    ]);

    // Take screenshot after login
    await page.screenshot({
      path: path.join(screenshotsDir, `after-login-${Date.now()}.png`),
    });

    // Get book details right from the post-login page
    const bookDetails = await getBookDetailsFromLoginPage(page);

    if (!bookDetails) {
      throw new Error("Failed to fetch book details after login");
    }

    const executionTime = Date.now() - startTime;
    console.log(`Lambda execution completed in ${executionTime}ms`);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        books: [bookDetails],
        timestamp: new Date().toISOString(),
        executionTime,
        status: "success",
      }),
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error("Lambda error:", error);
    console.error(`Failed after ${executionTime}ms`);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        executionTime,
        status: "error",
      }),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
