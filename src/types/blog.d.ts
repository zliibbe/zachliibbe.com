// Blog Types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  content: string;
  categories: string[];
  tags: string[];
  readTime: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: string;
  series?: string;
  featuredImage?: FeaturedImage;
  mediumUrl?: string;
  updatedAt?: string;
}

export interface FeaturedImage {
  url: string;
  alt: string;
  width: number;
  height: number;
  attribution: {
    text: string;
    photographerUrl: string;
    unsplashUrl: string;
  };
}

export interface BlogPostMetadata {
  id: string;
  slug: string;
  title: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  readTime: string;
  series?: string;
  featuredImage?: FeaturedImage;
}

export interface BlogListingProps {
  posts: BlogPostMetadata[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
}

export interface BlogFilterParams {
  category?: string;
  tag?: string;
  page?: number;
  search?: string;
}
