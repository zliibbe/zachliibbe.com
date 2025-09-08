import fs from 'fs';
import path from 'path';
import { BlogPost, FeaturedImage } from '@/types/blog';
import { markdownToHtml, generateExcerpt } from './markdown';

// Import KV only when needed (production)
let kv: any = null;
async function getKV() {
  if (!kv && process.env.NODE_ENV === 'production') {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
  return kv;
}

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

// Load posts from file (development) or KV (production)
async function loadPostsFromFile(filePath: string): Promise<BlogPost[]> {
  try {
    // In production, use KV store
    if (process.env.NODE_ENV === 'production') {
      const kvStore = await getKV();
      if (kvStore) {
        const key = `blog:${path.basename(filePath, '.json')}`; // blog:drafts, blog:scheduled, blog:published
        const data = await kvStore.get(key);
        return data || [];
      }
    }

    // In development, use file system
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

// Save posts to file (development) or KV (production)
async function savePostsToFile(
  filePath: string,
  posts: BlogPost[]
): Promise<void> {
  try {
    // In production, use KV store
    if (process.env.NODE_ENV === 'production') {
      const kvStore = await getKV();
      if (kvStore) {
        const key = `blog:${path.basename(filePath, '.json')}`; // blog:drafts, blog:scheduled, blog:published
        await kvStore.set(key, posts);
        console.log(`Saved ${posts.length} posts to KV store with key: ${key}`);
        return;
      }
    }

    // In development, use file system
    ensureStorageDir();
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2), 'utf8');
    console.log(`Saved ${posts.length} posts to file: ${filePath}`);
  } catch (error) {
    console.error('Error saving posts:', filePath, error);
    throw error;
  }
}

// Get all drafts
export async function getAllDrafts(): Promise<BlogPost[]> {
  return await loadPostsFromFile(DRAFTS_FILE);
}

// Get all scheduled posts
export async function getAllScheduledPosts(): Promise<BlogPost[]> {
  return await loadPostsFromFile(SCHEDULED_FILE);
}

// Get all published posts
export async function getAllPublishedPosts(): Promise<BlogPost[]> {
  return await loadPostsFromFile(PUBLISHED_FILE);
}

// Get all posts (drafts + scheduled + published)
export async function getAllPosts(): Promise<BlogPost[]> {
  const allPosts = [
    ...(await getAllDrafts()),
    ...(await getAllScheduledPosts()),
    ...(await getAllPublishedPosts()),
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
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const allPosts = await getAllPosts();
  return allPosts.find(post => post.slug === slug) || null;
}

// Create new blog post
export async function createBlogPost(postData: {
  title: string;
  content: string; // markdown content
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  series?: string;
  status?: 'draft' | 'scheduled' | 'published';
  scheduledFor?: string;
}): Promise<BlogPost> {
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
    const drafts = await getAllDrafts();
    drafts.push(newPost);
    await savePostsToFile(DRAFTS_FILE, drafts);
  } else if (newPost.status === 'scheduled') {
    const scheduled = await getAllScheduledPosts();
    scheduled.push(newPost);
    await savePostsToFile(SCHEDULED_FILE, scheduled);
  } else {
    const published = await getAllPublishedPosts();
    published.push(newPost);
    await savePostsToFile(PUBLISHED_FILE, published);
  }

  return newPost;
}

// Update existing blog post
export async function updateBlogPost(
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
    featuredImage?: FeaturedImage;
  }>
): Promise<BlogPost | null> {
  const existingPost = await getPostBySlug(slug);

  if (!existingPost) {
    return null;
  }

  // Remove from current location
  if (existingPost.status === 'draft') {
    const drafts = (await getAllDrafts()).filter(post => post.slug !== slug);
    await savePostsToFile(DRAFTS_FILE, drafts);
  } else if (existingPost.status === 'scheduled') {
    const scheduled = (await getAllScheduledPosts()).filter(
      post => post.slug !== slug
    );
    await savePostsToFile(SCHEDULED_FILE, scheduled);
  } else {
    const published = (await getAllPublishedPosts()).filter(
      post => post.slug !== slug
    );
    await savePostsToFile(PUBLISHED_FILE, published);
  }

  // Create updated post with updated timestamp
  const updatedData = { 
    ...existingPost, 
    ...updates,
    updatedAt: new Date().toISOString(),
  };

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
    const drafts = await getAllDrafts();
    drafts.push(updatedData);
    await savePostsToFile(DRAFTS_FILE, drafts);
  } else if (updatedData.status === 'scheduled') {
    const scheduled = await getAllScheduledPosts();
    scheduled.push(updatedData);
    await savePostsToFile(SCHEDULED_FILE, scheduled);
  } else {
    const published = await getAllPublishedPosts();
    published.push(updatedData);
    await savePostsToFile(PUBLISHED_FILE, published);
  }

  return updatedData;
}

// Delete blog post
export async function deleteBlogPost(slug: string): Promise<boolean> {
  const post = await getPostBySlug(slug);

  if (!post) {
    return false;
  }

  try {
    if (post.status === 'draft') {
      const drafts = (await getAllDrafts()).filter(p => p.slug !== slug);
      await savePostsToFile(DRAFTS_FILE, drafts);
    } else if (post.status === 'scheduled') {
      const scheduled = (await getAllScheduledPosts()).filter(
        p => p.slug !== slug
      );
      await savePostsToFile(SCHEDULED_FILE, scheduled);
    } else {
      const published = (await getAllPublishedPosts()).filter(
        p => p.slug !== slug
      );
      await savePostsToFile(PUBLISHED_FILE, published);
    }
    return true;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return false;
  }
}

// Publish a draft
export async function publishDraft(slug: string): Promise<BlogPost | null> {
  return await updateBlogPost(slug, { status: 'published' });
}

// Get posts by status
export async function getPostsByStatus(
  status: 'draft' | 'scheduled' | 'published'
): Promise<BlogPost[]> {
  if (status === 'draft') return await getAllDrafts();
  if (status === 'scheduled') return await getAllScheduledPosts();
  return await getAllPublishedPosts();
}

// Initialize storage with existing in-memory posts (migration helper)
export async function initializeStorageWithExistingPosts(
  existingPosts: BlogPost[]
): Promise<void> {
  ensureStorageDir();

  const published = existingPosts.filter(post => post.status === 'published');
  const scheduled = existingPosts.filter(post => post.status === 'scheduled');
  const drafts = existingPosts.filter(post => post.status === 'draft');

  if (published.length > 0) {
    await savePostsToFile(PUBLISHED_FILE, published);
  }

  if (scheduled.length > 0) {
    await savePostsToFile(SCHEDULED_FILE, scheduled);
  }

  if (drafts.length > 0) {
    await savePostsToFile(DRAFTS_FILE, drafts);
  }
}

// Additional helper functions for backwards compatibility
export async function getAllCategories(): Promise<string[]> {
  const categories = new Set<string>();
  const posts = await getAllPublishedPosts();
  posts.forEach(post => post.categories.forEach(cat => categories.add(cat)));
  return Array.from(categories).sort();
}

export async function getAllTags(): Promise<string[]> {
  const tags = new Set<string>();
  const posts = await getAllPublishedPosts();
  posts.forEach(post => post.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

// Automated publishing functions

// Get posts scheduled for publication before or at the given date
export async function getPostsDueForPublication(
  beforeDate: Date = new Date()
): Promise<BlogPost[]> {
  const scheduledPosts = await getAllScheduledPosts();
  return scheduledPosts.filter(post => {
    if (!post.scheduledFor) return false;
    const scheduledDate = new Date(post.scheduledFor);
    return scheduledDate <= beforeDate;
  });
}

// Publish a scheduled post
export async function publishScheduledPost(
  slug: string
): Promise<BlogPost | null> {
  const post = await getPostBySlug(slug);

  if (!post || post.status !== 'scheduled') {
    console.error(`Post ${slug} not found or not scheduled`);
    return null;
  }

  // Update the post to published status
  return await updateBlogPost(slug, {
    status: 'published',
    publishedAt: new Date().toISOString().split('T')[0],
  });
}

// Schedule a post for future publication
export async function schedulePost(
  slug: string,
  scheduledFor: string
): Promise<BlogPost | null> {
  const post = await getPostBySlug(slug);

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

  return await updateBlogPost(slug, {
    status: 'scheduled',
    scheduledFor,
  });
}

// Process all posts due for publication (used by cron job)
export async function processScheduledPublications(): Promise<{
  published: BlogPost[];
  errors: string[];
}> {
  const dueForPublication = await getPostsDueForPublication();
  const published: BlogPost[] = [];
  const errors: string[] = [];

  console.log(`Found ${dueForPublication.length} posts due for publication`);

  for (const post of dueForPublication) {
    try {
      const publishedPost = await publishScheduledPost(post.slug);
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
