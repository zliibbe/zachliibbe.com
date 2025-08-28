import fs from "fs";
import path from "path";
import { BlogPost } from "@/types/blog";
import { markdownToHtml, generateExcerpt } from "./markdown";

// Storage paths
const BLOG_DATA_DIR = path.join(process.cwd(), "src", "content", "blog-data");
const DRAFTS_FILE = path.join(BLOG_DATA_DIR, "drafts.json");
const PUBLISHED_FILE = path.join(BLOG_DATA_DIR, "published.json");

// Ensure storage directory exists
function ensureStorageDir() {
  if (!fs.existsSync(BLOG_DATA_DIR)) {
    fs.mkdirSync(BLOG_DATA_DIR, { recursive: true });
  }
}

// Generate unique ID for new posts
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Calculate reading time
function calculateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

// Load posts from file
function loadPostsFromFile(filePath: string): BlogPost[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading posts from file:", filePath, error);
    return [];
  }
}

// Save posts to file
function savePostsToFile(filePath: string, posts: BlogPost[]) {
  ensureStorageDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving posts to file:", filePath, error);
    throw error;
  }
}

// Get all drafts
export function getAllDrafts(): BlogPost[] {
  return loadPostsFromFile(DRAFTS_FILE);
}

// Get all published posts
export function getAllPublishedPosts(): BlogPost[] {
  return loadPostsFromFile(PUBLISHED_FILE);
}

// Get all posts (drafts + published)
export function getAllPosts(): BlogPost[] {
  return [...getAllDrafts(), ...getAllPublishedPosts()];
}

// Get post by slug from all posts
export function getPostBySlug(slug: string): BlogPost | null {
  const allPosts = getAllPosts();
  return allPosts.find((post) => post.slug === slug) || null;
}

// Create new blog post
export function createBlogPost(postData: {
  title: string;
  content: string; // markdown content
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  series?: string;
  status?: "draft" | "published";
  scheduledFor?: string;
}): BlogPost {
  const id = generateId();
  const slug = generateSlug(postData.title);

  // Convert markdown to HTML
  const htmlContent = markdownToHtml(postData.content);

  // Generate excerpt if not provided
  const excerpt = postData.excerpt || generateExcerpt(htmlContent);

  const newPost: BlogPost = {
    id,
    slug,
    title: postData.title,
    author: "Zach Liibbe",
    publishedAt:
      postData.status === "published"
        ? new Date().toISOString().split("T")[0]
        : "",
    excerpt,
    content: htmlContent,
    categories: postData.categories || [],
    tags: postData.tags || [],
    readTime: calculateReadingTime(postData.content),
    status: postData.status || "draft",
    series: postData.series,
  };

  // Save to appropriate file
  if (newPost.status === "draft") {
    const drafts = getAllDrafts();
    drafts.push(newPost);
    savePostsToFile(DRAFTS_FILE, drafts);
  } else {
    const published = getAllPublishedPosts();
    published.push(newPost);
    savePostsToFile(PUBLISHED_FILE, published);
  }

  return newPost;
}

// Update existing blog post
export function updateBlogPost(
  slug: string,
  updates: Partial<{
    title: string;
    content: string; // markdown content
    excerpt?: string;
    categories: string[];
    tags: string[];
    series?: string;
    status: "draft" | "published";
    scheduledFor?: string;
  }>,
): BlogPost | null {
  const existingPost = getPostBySlug(slug);

  if (!existingPost) {
    return null;
  }

  // Remove from current location
  if (existingPost.status === "draft") {
    const drafts = getAllDrafts().filter((post) => post.slug !== slug);
    savePostsToFile(DRAFTS_FILE, drafts);
  } else {
    const published = getAllPublishedPosts().filter(
      (post) => post.slug !== slug,
    );
    savePostsToFile(PUBLISHED_FILE, published);
  }

  // Create updated post
  const updatedData = { ...existingPost, ...updates };

  // If content was updated, convert markdown to HTML
  if (updates.content) {
    updatedData.content = markdownToHtml(updates.content);
    updatedData.readTime = calculateReadingTime(updates.content);

    // Regenerate excerpt if not provided
    if (!updates.excerpt) {
      updatedData.excerpt = generateExcerpt(updatedData.content);
    }
  }

  // Update published date if status changed to published
  if (updates.status === "published" && existingPost.status === "draft") {
    updatedData.publishedAt = new Date().toISOString().split("T")[0];
  }

  // Save to new location
  if (updatedData.status === "draft") {
    const drafts = getAllDrafts();
    drafts.push(updatedData);
    savePostsToFile(DRAFTS_FILE, drafts);
  } else {
    const published = getAllPublishedPosts();
    published.push(updatedData);
    savePostsToFile(PUBLISHED_FILE, published);
  }

  return updatedData;
}

// Delete blog post
export function deleteBlogPost(slug: string): boolean {
  const post = getPostBySlug(slug);

  if (!post) {
    return false;
  }

  try {
    if (post.status === "draft") {
      const drafts = getAllDrafts().filter((p) => p.slug !== slug);
      savePostsToFile(DRAFTS_FILE, drafts);
    } else {
      const published = getAllPublishedPosts().filter((p) => p.slug !== slug);
      savePostsToFile(PUBLISHED_FILE, published);
    }
    return true;
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return false;
  }
}

// Publish a draft
export function publishDraft(slug: string): BlogPost | null {
  return updateBlogPost(slug, { status: "published" });
}

// Get posts by status
export function getPostsByStatus(status: "draft" | "published"): BlogPost[] {
  return status === "draft" ? getAllDrafts() : getAllPublishedPosts();
}

// Initialize storage with existing in-memory posts (migration helper)
export function initializeStorageWithExistingPosts(existingPosts: BlogPost[]) {
  ensureStorageDir();

  const published = existingPosts.filter((post) => post.status === "published");
  const drafts = existingPosts.filter((post) => post.status === "draft");

  if (published.length > 0) {
    savePostsToFile(PUBLISHED_FILE, published);
  }

  if (drafts.length > 0) {
    savePostsToFile(DRAFTS_FILE, drafts);
  }
}

// Additional helper functions for backwards compatibility
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  getAllPublishedPosts().forEach((post) =>
    post.categories.forEach((cat) => categories.add(cat)),
  );
  return Array.from(categories).sort();
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllPublishedPosts().forEach((post) =>
    post.tags.forEach((tag) => tags.add(tag)),
  );
  return Array.from(tags).sort();
}
