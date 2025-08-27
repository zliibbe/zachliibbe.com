import { BlogPost, BlogPostMetadata, BlogFilterParams, FeaturedImage } from '@/types/blog';
import { getPhotoForBlogPost, getPhotoAttribution, trackPhotoDownload } from './unsplash';

// Enhanced blog posts with image search keywords
const blogPostsData: Omit<BlogPost, 'featuredImage'>[] = [
  {
    id: '1',
    slug: 'hello-world',
    title: 'Hello World - First Blog Post',
    author: 'Zach Liibbe',
    publishedAt: '2025-01-15',
    excerpt: 'Welcome to my blog! This is my first post where I introduce the new blog system and share my thoughts on building in public.',
    content: `
      <h2>Welcome to My Blog!</h2>
      <p>I'm excited to finally have a blog on my personal website. This has been something I've wanted to add for a while, and I decided to build it from scratch using Next.js 15.</p>
      
      <h3>Why I Built This</h3>
      <p>I believe in learning and building in public. Having a space to document my journey, share lessons learned, and connect with other developers felt important.</p>
      
      <h3>What to Expect</h3>
      <ul>
        <li><strong>Development</strong>: Technical deep dives, lessons learned, and project updates</li>
        <li><strong>Personal</strong>: Life updates, reading recommendations, and random thoughts</li>
        <li><strong>Learning</strong>: New technologies I'm exploring and what I'm discovering</li>
      </ul>
      
      <p>Thanks for reading, and I hope you'll stick around as I continue to iterate and improve this little corner of the web!</p>
    `,
    categories: ['Personal'],
    tags: ['nextjs', 'blogging', 'first-post'],
    readTime: '3 min read',
    status: 'published',
    series: undefined
  },
  {
    id: '2',
    slug: 'building-blog-system',
    title: 'Building a Simple Blog System with Next.js 15',
    author: 'Zach Liibbe',
    publishedAt: '2025-01-18',
    excerpt: 'How I built this blog system from scratch using Next.js 15, TypeScript, and zero external dependencies for markdown processing.',
    content: `
      <h2>The Philosophy: Keep It Simple</h2>
      <p>When building this blog, I had one main goal: avoid unnecessary complexity and dependencies. Instead of reaching for markdown parsers and complex build processes, I opted for a template-based approach.</p>
      
      <h3>The Architecture</h3>
      <p>The blog system consists of a few key pieces:</p>
      <ul>
        <li><strong>TypeScript interfaces</strong> for type safety</li>
        <li><strong>Simple data store</strong> with blog post objects</li>
        <li><strong>React components</strong> for rendering</li>
        <li><strong>Next.js App Router</strong> for routing</li>
      </ul>
      
      <h3>Why This Approach Works</h3>
      <p>By storing blog content as HTML strings in TypeScript objects, I get:</p>
      <ul>
        <li>✅ Zero build-time complexity</li>
        <li>✅ Full control over content structure</li>
        <li>✅ Easy to extend and modify</li>
        <li>✅ No external dependencies</li>
        <li>✅ Fast performance</li>
      </ul>
      
      <h3>Future Improvements</h3>
      <p>While this approach is simple, there are some natural evolution paths:</p>
      <ul>
        <li>Move content to a headless CMS</li>
        <li>Add an admin interface for editing</li>
        <li>Implement search functionality</li>
        <li>Add comment system</li>
      </ul>
      
      <p>But for now, simple is perfect. It gets the job done without overengineering.</p>
    `,
    categories: ['Development'],
    tags: ['nextjs', 'typescript', 'architecture', 'blog'],
    readTime: '5 min read',
    status: 'published',
    series: undefined
  }
];

// Cache for images to avoid repeated API calls
const imageCache = new Map<string, FeaturedImage | null>();

async function getFeaturedImage(post: Omit<BlogPost, 'featuredImage'>): Promise<FeaturedImage | null> {
  const cacheKey = post.slug;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey) || null;
  }

  try {
    const photo = await getPhotoForBlogPost(post.categories, post.tags, post.title);
    
    if (photo) {
      // Track download as required by Unsplash API
      await trackPhotoDownload(photo.links.download_location);
      
      const attribution = getPhotoAttribution(photo);
      const featuredImage: FeaturedImage = {
        url: photo.urls.regular,
        alt: photo.alt_description || photo.description || `Featured image for ${post.title}`,
        width: photo.width,
        height: photo.height,
        attribution
      };
      
      imageCache.set(cacheKey, featuredImage);
      return featuredImage;
    }
  } catch (error) {
    console.error(`Error fetching image for post ${post.slug}:`, error);
  }
  
  imageCache.set(cacheKey, null);
  return null;
}

// Enhanced functions that include images
export async function getAllPublishedPostsWithImages(): Promise<BlogPostMetadata[]> {
  const publishedPosts = blogPostsData
    .filter(post => post.status === 'published')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Fetch images for all posts in parallel
  const postsWithImages = await Promise.all(
    publishedPosts.map(async (post) => {
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
        featuredImage
      };
    })
  );

  return postsWithImages;
}

export async function getPostBySlugWithImage(slug: string): Promise<BlogPost | null> {
  const post = blogPostsData.find(post => post.slug === slug && post.status === 'published');
  if (!post) return null;

  const featuredImage = await getFeaturedImage(post);
  
  return {
    ...post,
    featuredImage
  };
}

export async function getFilteredPostsWithImages(filters: BlogFilterParams): Promise<BlogPostMetadata[]> {
  let filtered = await getAllPublishedPostsWithImages();
  
  if (filters.category) {
    filtered = filtered.filter(post => 
      post.categories.some(cat => cat.toLowerCase() === filters.category?.toLowerCase())
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
export async function getPaginatedPostsWithImages(page: number = 1, filters?: BlogFilterParams): Promise<{
  posts: BlogPostMetadata[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
}> {
  const POSTS_PER_PAGE = 10;
  
  const allPosts = filters ? await getFilteredPostsWithImages(filters) : await getAllPublishedPostsWithImages();
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const posts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  
  return {
    posts,
    totalPosts,
    currentPage: page,
    totalPages
  };
}

// Re-export functions that don't need images for backwards compatibility
export { getAllCategories, getAllTags } from './blog';