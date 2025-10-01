'use client';

import Link from 'next/link';
import { analytics } from '@/app/utils/analytics';

interface BlogFiltersProps {
  categories: string[];
  tags: string[];
  activeCategory?: string;
  activeTag?: string;
  hasFilters?: boolean;
  resultsCount: number;
  filterLabelClassName?: string;
  filterLinksClassName?: string;
  filterLinkClassName?: string;
  activeClassName?: string;
  clearFiltersClassName?: string;
}

/**
 * Client component for blog category/tag filters with analytics tracking
 * Tracks filter applications and result counts
 */
export default function BlogFilters({
  categories,
  tags,
  activeCategory,
  activeTag,
  hasFilters,
  resultsCount,
  filterLabelClassName,
  filterLinksClassName,
  filterLinkClassName,
  activeClassName,
  clearFiltersClassName,
}: BlogFiltersProps) {
  const handleCategoryClick = (category: string) => {
    if (analytics.isEnabled()) {
      analytics.trackFilter('category', category, resultsCount);
    }
  };

  const handleTagClick = (tag: string) => {
    if (analytics.isEnabled()) {
      analytics.trackFilter('tag', tag, resultsCount);
    }
  };

  return (
    <>
      {/* Categories */}
      <div>
        <div className={filterLabelClassName}>Categories:</div>
        <div className={filterLinksClassName}>
          {categories.map(category => (
            <Link
              key={category}
              href={`/blog?category=${encodeURIComponent(category.toLowerCase())}`}
              className={`${filterLinkClassName} ${
                activeCategory === category.toLowerCase() ? activeClassName : ''
              }`}
              onClick={() => handleCategoryClick(category.toLowerCase())}
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className={filterLabelClassName}>Tags:</div>
        <div className={filterLinksClassName}>
          {tags.slice(0, 10).map(tag => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className={`${filterLinkClassName} ${
                activeTag === tag ? activeClassName : ''
              }`}
              onClick={() => handleTagClick(tag)}
            >
              #{tag}
            </Link>
          ))}
          {hasFilters && (
            <Link href="/blog" className={clearFiltersClassName}>
              Clear filters
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
