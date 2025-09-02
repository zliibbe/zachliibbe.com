import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/types/blog';
import { markdownToHtml, generateExcerpt } from './markdown';

// Storage paths
const BLOG_DATA_DIR = path.join(process.cwd(), 'src', 'content', 'blog-data');
const DRAFTS_FILE = path.join(BLOG_DATA_DIR, 'drafts.json');
const SCHEDULED_FILE = path.join(BLOG_DATA_DIR, 'scheduled.json');
const PUBLISHED_FILE = path.join(BLOG_DATA_DIR, 'published.json');

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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading posts from file:', filePath, error);
    return [];
  }
}

// Save posts to file
function savePostsToFile(filePath: string, posts: BlogPost[]) {
  // Check if we're in production on Vercel
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    throw new Error('File-based storage not supported in Vercel production. Please use database storage.');
  }
  
  ensureStorageDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving posts to file:', filePath, error);
    throw error;
  }
}

// Get all drafts
export function getAllDrafts(): BlogPost[] {
  return loadPostsFromFile(DRAFTS_FILE);
}

// Get all scheduled posts
export function getAllScheduledPosts(): BlogPost[] {
  return loadPostsFromFile(SCHEDULED_FILE);
}

// Get all published posts
export function getAllPublishedPosts(): BlogPost[] {
  return loadPostsFromFile(PUBLISHED_FILE);
}

// Get all posts (drafts + scheduled + published)
export function getAllPosts(): BlogPost[] {
  const allPosts = [
    ...getAllDrafts(),
    ...getAllScheduledPosts(),
    ...getAllPublishedPosts(),
  ];

  // Remove duplicates based on ID to prevent React key conflicts
  const uniquePosts = new Map<string, BlogPost>();
  allPosts.forEach(post => {
    // Keep the most recent version (by status priority: published > scheduled > draft)
    const existing = uniquePosts.get(post.id);
    if (
      !existing ||
      (post.status === 'published' && existing.status !== 'published') ||
      (post.status === 'scheduled' && existing.status === 'draft')
    ) {
      uniquePosts.set(post.id, post);
    }
  });

  return Array.from(uniquePosts.values());
}

// Get post by slug from all posts
export function getPostBySlug(slug: string): BlogPost | null {
  const allPosts = getAllPosts();
  return allPosts.find(post => post.slug === slug) || null;
}

// Create new blog post
export function createBlogPost(postData: {
  title: string;
  content: string; // markdown content
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  series?: string;
  status?: 'draft' | 'scheduled' | 'published';
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
    author: 'Zach Liibbe',
    publishedAt:
      postData.status === 'published'
        ? new Date().toISOString().split('T')[0]
        : '',
    excerpt,
    content: htmlContent,
    categories: postData.categories || [],
    tags: postData.tags || [],
    readTime: calculateReadingTime(postData.content),
    status: postData.status || 'draft',
    scheduledFor: postData.scheduledFor,
    series: postData.series,
  };

  // Save to appropriate file based on status
  if (newPost.status === 'draft') {
    const drafts = getAllDrafts();
    drafts.push(newPost);
    savePostsToFile(DRAFTS_FILE, drafts);
  } else if (newPost.status === 'scheduled') {
    const scheduled = getAllScheduledPosts();
    scheduled.push(newPost);
    savePostsToFile(SCHEDULED_FILE, scheduled);
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
    status: 'draft' | 'scheduled' | 'published';
    scheduledFor?: string;
    publishedAt?: string;
  }>
): BlogPost | null {
  const existingPost = getPostBySlug(slug);

  if (!existingPost) {
    return null;
  }

  // Remove from current location
  if (existingPost.status === 'draft') {
    const drafts = getAllDrafts().filter(post => post.slug !== slug);
    savePostsToFile(DRAFTS_FILE, drafts);
  } else if (existingPost.status === 'scheduled') {
    const scheduled = getAllScheduledPosts().filter(post => post.slug !== slug);
    savePostsToFile(SCHEDULED_FILE, scheduled);
  } else {
    const published = getAllPublishedPosts().filter(post => post.slug !== slug);
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

  // Update published date if status changed to published or if explicitly provided
  if (
    updates.status === 'published' &&
    (existingPost.status === 'draft' || existingPost.status === 'scheduled')
  ) {
    updatedData.publishedAt =
      updates.publishedAt || new Date().toISOString().split('T')[0];
  } else if (updates.publishedAt) {
    updatedData.publishedAt = updates.publishedAt;
  }

  // Save to new location
  if (updatedData.status === 'draft') {
    const drafts = getAllDrafts();
    drafts.push(updatedData);
    savePostsToFile(DRAFTS_FILE, drafts);
  } else if (updatedData.status === 'scheduled') {
    const scheduled = getAllScheduledPosts();
    scheduled.push(updatedData);
    savePostsToFile(SCHEDULED_FILE, scheduled);
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
    if (post.status === 'draft') {
      const drafts = getAllDrafts().filter(p => p.slug !== slug);
      savePostsToFile(DRAFTS_FILE, drafts);
    } else if (post.status === 'scheduled') {
      const scheduled = getAllScheduledPosts().filter(p => p.slug !== slug);
      savePostsToFile(SCHEDULED_FILE, scheduled);
    } else {
      const published = getAllPublishedPosts().filter(p => p.slug !== slug);
      savePostsToFile(PUBLISHED_FILE, published);
    }
    return true;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return false;
  }
}

// Publish a draft
export function publishDraft(slug: string): BlogPost | null {
  return updateBlogPost(slug, { status: 'published' });
}

// Get posts by status
export function getPostsByStatus(
  status: 'draft' | 'scheduled' | 'published'
): BlogPost[] {
  if (status === 'draft') return getAllDrafts();
  if (status === 'scheduled') return getAllScheduledPosts();
  return getAllPublishedPosts();
}

// Initialize storage with existing in-memory posts (migration helper)
export function initializeStorageWithExistingPosts(existingPosts: BlogPost[]) {
  ensureStorageDir();

  const published = existingPosts.filter(post => post.status === 'published');
  const scheduled = existingPosts.filter(post => post.status === 'scheduled');
  const drafts = existingPosts.filter(post => post.status === 'draft');

  if (published.length > 0) {
    savePostsToFile(PUBLISHED_FILE, published);
  }

  if (scheduled.length > 0) {
    savePostsToFile(SCHEDULED_FILE, scheduled);
  }

  if (drafts.length > 0) {
    savePostsToFile(DRAFTS_FILE, drafts);
  }
}

// Additional helper functions for backwards compatibility
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  getAllPublishedPosts().forEach(post =>
    post.categories.forEach(cat => categories.add(cat))
  );
  return Array.from(categories).sort();
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllPublishedPosts().forEach(post =>
    post.tags.forEach(tag => tags.add(tag))
  );
  return Array.from(tags).sort();
}

// Automated publishing functions

// Get posts scheduled for publication before or at the given date
export function getPostsDueForPublication(
  beforeDate: Date = new Date()
): BlogPost[] {
  const scheduledPosts = getAllScheduledPosts();
  return scheduledPosts.filter(post => {
    if (!post.scheduledFor) return false;
    const scheduledDate = new Date(post.scheduledFor);
    return scheduledDate <= beforeDate;
  });
}

// Publish a scheduled post
export function publishScheduledPost(slug: string): BlogPost | null {
  const post = getPostBySlug(slug);

  if (!post || post.status !== 'scheduled') {
    console.error(`Post ${slug} not found or not scheduled`);
    return null;
  }

  // Update the post to published status
  return updateBlogPost(slug, {
    status: 'published',
    publishedAt: new Date().toISOString().split('T')[0],
  });
}

// Schedule a post for future publication
export function schedulePost(
  slug: string,
  scheduledFor: string
): BlogPost | null {
  const post = getPostBySlug(slug);

  if (!post) {
    console.error(`Post ${slug} not found`);
    return null;
  }

  if (post.status === 'published') {
    console.error(`Post ${slug} is already published`);
    return null;
  }

  // Validate the scheduled date
  const scheduledDate = new Date(scheduledFor);
  if (scheduledDate <= new Date()) {
    console.error(`Scheduled date must be in the future`);
    return null;
  }

  return updateBlogPost(slug, {
    status: 'scheduled',
    scheduledFor,
  });
}

// Process all posts due for publication (used by cron job)
export function processScheduledPublications(): {
  published: BlogPost[];
  errors: string[];
} {
  const dueForPublication = getPostsDueForPublication();
  const published: BlogPost[] = [];
  const errors: string[] = [];

  console.log(`Found ${dueForPublication.length} posts due for publication`);

  for (const post of dueForPublication) {
    try {
      const publishedPost = publishScheduledPost(post.slug);
      if (publishedPost) {
        published.push(publishedPost);
        console.log(`Successfully published: ${post.title} (${post.slug})`);
      } else {
        errors.push(`Failed to publish post: ${post.slug}`);
      }
    } catch (error) {
      const errorMessage = `Error publishing ${post.slug}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMessage);
      console.error(errorMessage);
    }
  }

  return { published, errors };
}
