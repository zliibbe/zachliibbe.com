import { render, screen } from '@testing-library/react';
import type { BlogPostMetadata } from '@/types/blog';
import PostCard from '../PostCard';

const basePost: BlogPostMetadata = {
  id: '1',
  slug: 'test-post',
  title: 'My Test Post',
  author: 'Zach',
  publishedAt: '2026-01-15T12:00:00Z',
  excerpt: 'A short excerpt about this post.',
  categories: ['Development', 'Learning'],
  tags: ['react', 'typescript'],
  readTime: '5 min read',
};

describe('PostCard', () => {
  it('renders the post title', () => {
    render(<PostCard post={basePost} />);
    expect(
      screen.getByRole('heading', { name: 'My Test Post' })
    ).toBeInTheDocument();
  });

  it('title links to the correct slug', () => {
    render(<PostCard post={basePost} />);
    const titleLink = screen.getByRole('link', { name: 'My Test Post' });
    expect(titleLink).toHaveAttribute('href', '/blog/test-post');
  });

  it('renders the excerpt', () => {
    render(<PostCard post={basePost} />);
    expect(
      screen.getByText('A short excerpt about this post.')
    ).toBeInTheDocument();
  });

  it('renders the author', () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText('by Zach')).toBeInTheDocument();
  });

  it('renders the read time', () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('formats and renders the published date', () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText('January 15, 2026')).toBeInTheDocument();
  });

  it('renders all categories as links', () => {
    render(<PostCard post={basePost} />);
    const devLink = screen.getByRole('link', { name: 'Development' });
    const learnLink = screen.getByRole('link', { name: 'Learning' });

    expect(devLink).toHaveAttribute('href', '/blog?category=development');
    expect(learnLink).toHaveAttribute('href', '/blog?category=learning');
  });

  it('renders all tags as hashtag links', () => {
    render(<PostCard post={basePost} />);
    const reactTag = screen.getByRole('link', { name: '#react' });
    const tsTag = screen.getByRole('link', { name: '#typescript' });

    expect(reactTag).toHaveAttribute('href', '/blog?tag=react');
    expect(tsTag).toHaveAttribute('href', '/blog?tag=typescript');
  });

  it('renders a Read more link to the correct slug', () => {
    render(<PostCard post={basePost} />);
    const readMore = screen.getByRole('link', { name: 'Read more →' });
    expect(readMore).toHaveAttribute('href', '/blog/test-post');
  });

  it('shows title as fallback when no featured image', () => {
    render(<PostCard post={basePost} />);
    expect(
      screen.getByText('My Test Post', { selector: 'div' })
    ).toBeInTheDocument();
  });

  it('renders featured image when provided', () => {
    const postWithImage: BlogPostMetadata = {
      ...basePost,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-test',
        alt: 'A test image',
        width: 800,
        height: 400,
        attribution: {
          text: 'Photo by Test Photographer',
          photographerUrl: 'https://unsplash.com/@testphotographer',
          unsplashUrl: 'https://unsplash.com/photos/test',
        },
      },
    };

    render(<PostCard post={postWithImage} />);
    expect(
      screen.getByRole('img', { name: 'A test image' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Photo by Test Photographer' })
    ).toHaveAttribute('href', 'https://unsplash.com/@testphotographer');
  });
});
