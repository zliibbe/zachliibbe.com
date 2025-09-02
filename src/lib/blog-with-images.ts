import {
  BlogPost,
  BlogPostMetadata,
  BlogFilterParams,
  FeaturedImage,
} from '@/types/blog';
import {
  getPhotoForBlogPost,
  getPhotoAttribution,
  trackPhotoDownload,
} from './unsplash';
import {
  getAllPublishedPosts,
  getAllPosts,
  getPostBySlug,
  getAllCategories as getStorageCategories,
  getAllTags as getStorageTags,
} from './blog-storage';

// Cache for images to avoid repeated API calls
const imageCache = new Map<string, FeaturedImage | undefined>();

async function getFeaturedImage(
  post: Omit<BlogPost, 'featuredImage'>
): Promise<FeaturedImage | undefined> {
  const cacheKey = post.slug;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    const photo = await getPhotoForBlogPost(
      post.categories,
      post.tags,
      post.title
    );

    if (photo) {
      // Track download as required by Unsplash API
      await trackPhotoDownload(photo.links.download_location);

      const attribution = getPhotoAttribution(photo);
      const featuredImage: FeaturedImage = {
        url: photo.urls.regular,
        alt:
          photo.alt_description ||
          photo.description ||
          `Featured image for ${post.title}`,
        width: photo.width,
        height: photo.height,
        attribution,
      };

      imageCache.set(cacheKey, featuredImage);
      return featuredImage;
    }
  } catch (error) {
    console.error(`Error fetching image for post ${post.slug}:`, error);
  }

  imageCache.set(cacheKey, undefined);
  return undefined;
}

// Enhanced functions that include images
export async function getAllPublishedPostsWithImages(): Promise<
  BlogPostMetadata[]
> {
  const publishedPosts = (await getAllPublishedPosts())
    .filter(post => post.status === 'published')
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  // Fetch images for all posts in parallel
  const postsWithImages = await Promise.all(
    publishedPosts.map(async post => {
      const featuredImage = await getFeaturedImage(post);
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        author: post.author,
        publishedAt: post.publishedAt,
        excerpt: post.excerpt,
        categories: post.categories,
        tags: post.tags,
        readTime: post.readTime,
        series: post.series,
        featuredImage,
      };
    })
  );

  return postsWithImages;
}

export async function getPostBySlugWithImage(
  slug: string
): Promise<BlogPost | null> {
  const post = await getPostBySlug(slug);
  if (!post || post.status !== 'published') return null;

  const featuredImage = await getFeaturedImage(post);

  return {
    ...post,
    featuredImage,
  };
}

export async function getFilteredPostsWithImages(
  filters: BlogFilterParams
): Promise<BlogPostMetadata[]> {
  let filtered = await getAllPublishedPostsWithImages();

  if (filters.category) {
    filtered = filtered.filter(post =>
      post.categories.some(
        cat => cat.toLowerCase() === filters.category?.toLowerCase()
      )
    );
  }

  if (filters.tag) {
    filtered = filtered.filter(post =>
      post.tags.some(tag => tag.toLowerCase() === filters.tag?.toLowerCase())
    );
  }

  return filtered;
}

// Enhanced pagination with images
export async function getPaginatedPostsWithImages(
  page: number = 1,
  filters?: BlogFilterParams
): Promise<{
  posts: BlogPostMetadata[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
}> {
  const POSTS_PER_PAGE = 10;

  const allPosts = filters
    ? await getFilteredPostsWithImages(filters)
    : await getAllPublishedPostsWithImages();
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const posts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return {
    posts,
    totalPosts,
    currentPage: page,
    totalPages,
  };
}

// Re-export functions that don't need images for backwards compatibility
export async function getAllCategories(): Promise<string[]> {
  const categories = new Set<string>();
  (await getAllPublishedPosts())
    .filter(post => post.status === 'published')
    .forEach(post => post.categories.forEach(cat => categories.add(cat)));
  return Array.from(categories).sort();
}

export async function getAllTags(): Promise<string[]> {
  const tags = new Set<string>();
  (await getAllPublishedPosts())
    .filter(post => post.status === 'published')
    .forEach(post => post.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

// Add pagination helpers for backwards compatibility
const POSTS_PER_PAGE = 10;

export async function getPaginatedPosts(
  page: number = 1,
  filters?: BlogFilterParams
): Promise<{
  posts: BlogPostMetadata[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
}> {
  const allPosts = filters
    ? await getFilteredPosts(filters)
    : (await getAllPublishedPosts())
        .filter(post => post.status === 'published')
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .map(post => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          author: post.author,
          publishedAt: post.publishedAt,
          excerpt: post.excerpt,
          categories: post.categories,
          tags: post.tags,
          readTime: post.readTime,
          series: post.series,
        }));

  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const posts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return {
    posts,
    totalPosts,
    currentPage: page,
    totalPages,
  };
}

export async function getFilteredPosts(
  filters: BlogFilterParams
): Promise<BlogPostMetadata[]> {
  let filtered = (await getAllPublishedPosts())
    .filter(post => post.status === 'published')
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      author: post.author,
      publishedAt: post.publishedAt,
      excerpt: post.excerpt,
      categories: post.categories,
      tags: post.tags,
      readTime: post.readTime,
      series: post.series,
    }));

  if (filters.category) {
    filtered = filtered.filter(post =>
      post.categories.some(
        cat => cat.toLowerCase() === filters.category?.toLowerCase()
      )
    );
  }

  if (filters.tag) {
    filtered = filtered.filter(post =>
      post.tags.some(tag => tag.toLowerCase() === filters.tag?.toLowerCase())
    );
  }

  return filtered;
}

// Admin-specific functions that include all posts (drafts + published) with images
export async function getAllPostsWithImagesForAdmin(): Promise<
  (BlogPost & { featuredImage?: FeaturedImage })[]
> {
  const allPosts = await getAllPosts();

  // Fetch images for all posts in parallel
  const postsWithImages = await Promise.all(
    allPosts.map(async post => {
      const featuredImage = await getFeaturedImage(post);
      return {
        ...post,
        featuredImage,
      };
    })
  );

  // Sort by creation date (most recent first)
  return postsWithImages.sort((a, b) => {
    // Use publishedAt if available, otherwise compare by title/id as fallback
    const dateA = a.publishedAt || a.id;
    const dateB = b.publishedAt || b.id;
    return dateB.localeCompare(dateA);
  });
}
