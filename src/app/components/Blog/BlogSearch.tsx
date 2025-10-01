'use client';

import React, { useRef } from 'react';
import { analytics } from '@/app/utils/analytics';

interface BlogSearchProps {
  defaultValue?: string;
  categoryFilter?: string;
  tagFilter?: string;
  resultsCount: number;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  resultsClassName?: string;
}

/**
 * Client component for blog search with analytics tracking
 * Tracks search queries and result counts
 */
export default function BlogSearch({
  defaultValue,
  categoryFilter,
  tagFilter,
  resultsCount,
  className,
  inputClassName,
  buttonClassName,
  resultsClassName,
}: BlogSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;

    if (query && query.trim() && analytics.isEnabled()) {
      analytics.trackSearch(query.trim(), resultsCount);
    }
  };

  return (
    <>
      <form
        method="GET"
        action="/blog"
        className={className}
        onSubmit={handleSubmit}
      >
        <input
          ref={inputRef}
          type="text"
          name="search"
          placeholder="Search posts..."
          defaultValue={defaultValue || ''}
          className={inputClassName}
        />
        {/* Preserve existing filters when searching */}
        {categoryFilter && (
          <input type="hidden" name="category" value={categoryFilter} />
        )}
        {tagFilter && <input type="hidden" name="tag" value={tagFilter} />}
        <button type="submit" className={buttonClassName}>
          Search
        </button>
      </form>
      {defaultValue && resultsClassName && (
        <div className={resultsClassName}>
          Showing results for: <strong>&ldquo;{defaultValue}&rdquo;</strong>
        </div>
      )}
    </>
  );
}
