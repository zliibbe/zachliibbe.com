import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  getPaginatedPostsWithImages,
  getAllCategories,
  getAllTags,
} from '@/lib/blog-with-images';
import PostCard from '@/app/components/Blog/PostCard';
import BlogSearch from '@/app/components/Blog/BlogSearch';
import BlogFilters from '@/app/components/Blog/BlogFilters';
import Footer from '@/app/components/Footer';
import styles from './page.module.css';

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    page?: string;
    search?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');
  const filters = {
    category: params.category,
    tag: params.tag,
    search: params.search,
  };

  const {
    posts,
    totalPosts,
    currentPage: page,
    totalPages,
  } = await getPaginatedPostsWithImages(currentPage, filters);
  const categories = await getAllCategories();
  const tags = await getAllTags();

  // Helper function to create URL search params with defined values only
  const createSearchParams = (
    params: Record<string, string | undefined>
  ): string => {
    const definedParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        definedParams[key] = value;
      }
    });
    return new URLSearchParams(definedParams).toString();
  };

  const hasFilters = !!(filters.category || filters.tag || filters.search);

  return (
    <>
      <main>
        <div className="universal-gradient-container">
          <div className="universal-gradient-background"></div>
          <div className={styles.container}>
            <div className={styles.contentWrapper}>
              <div className={styles.content}>
                <header className={styles.header}>
                  <h1 className={styles.title}>Blog</h1>
                  <p className={styles.subtitle}>
                    Thoughts on development, life, and everything in between. I
                    write about building things, learning new technologies, and
                    the journey of being a developer.
                  </p>
                </header>

                {/* Search */}
                <div className={styles.searchContainer}>
                  <BlogSearch
                    defaultValue={filters.search}
                    categoryFilter={filters.category}
                    tagFilter={filters.tag}
                    resultsCount={totalPosts}
                    className={styles.searchForm}
                    inputClassName={styles.searchInput}
                    buttonClassName={styles.searchButton}
                    resultsClassName={styles.searchResults}
                  />
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                  <BlogFilters
                    categories={categories}
                    tags={tags}
                    activeCategory={filters.category}
                    activeTag={filters.tag}
                    hasFilters={hasFilters}
                    resultsCount={totalPosts}
                    filterLabelClassName={styles.filterLabel}
                    filterLinksClassName={styles.filterLinks}
                    filterLinkClassName={styles.filterLink}
                    activeClassName={styles.active}
                    clearFiltersClassName={styles.clearFilters}
                  />
                </div>

                {/* Blog Posts */}
                <div className={styles.postsContainer}>
                  {posts.length > 0 ? (
                    posts.map(post => <PostCard key={post.id} post={post} />)
                  ) : (
                    <div className={styles.noResults}>
                      <h2 className={styles.noResultsTitle}>No posts found</h2>
                      <p>
                        {hasFilters
                          ? 'Try adjusting your filters or browse all posts.'
                          : 'Check back soon for new content!'}
                      </p>
                      {hasFilters && (
                        <Link href="/blog" className={styles.clearFilters}>
                          View all posts
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    {page > 1 && (
                      <Link
                        href={`/blog?${createSearchParams({
                          ...filters,
                          page: String(page - 1),
                        })}`}
                        className={styles.pageButton}
                      >
                        ← Previous
                      </Link>
                    )}

                    <div className={styles.pageInfo}>
                      Page {page} of {totalPages} ({totalPosts} posts)
                    </div>

                    {page < totalPages && (
                      <Link
                        href={`/blog?${createSearchParams({
                          ...filters,
                          page: String(page + 1),
                        })}`}
                        className={styles.pageButton}
                      >
                        Next →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const metadata: Metadata = {
  title: 'Blog | Zach Liibbe',
  description:
    'Thoughts on development, life, and everything in between. I write about building things, learning new technologies, and the journey of being a developer.',
};
