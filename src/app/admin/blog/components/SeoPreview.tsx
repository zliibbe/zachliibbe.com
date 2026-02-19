'use client';

import React from 'react';
import styles from './SeoPreview.module.css';

interface BlogPost {
  title: string;
  author: string;
  publishedAt: string;
  categories: string[];
  tags: string[];
  excerpt: string;
  content: string;
}

interface SeoPreviewProps {
  post: BlogPost;
}

export default function SeoPreview({ post }: SeoPreviewProps) {
  // Generate meta description from excerpt or content
  const getMetaDescription = () => {
    if (post.excerpt.trim()) {
      return post.excerpt.length > 160
        ? post.excerpt.slice(0, 157) + '...'
        : post.excerpt;
    }

    // Extract plain text from content for fallback
    const plainText = post.content
      .replace(/#{1,6}\s+/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .trim();

    return plainText.length > 160 ? plainText.slice(0, 157) + '...' : plainText;
  };

  // Generate page title for SEO
  const getPageTitle = () => {
    const baseTitle = 'Zach Liibbe - Always Iterating...';
    return post.title ? `${post.title} | ${baseTitle}` : baseTitle;
  };

  // Generate URL slug from title
  const getUrlSlug = () => {
    return post.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const metaDescription = getMetaDescription();
  const pageTitle = getPageTitle();
  const urlSlug = getUrlSlug();
  const fullUrl = `https://zachliibbe.com/blog/${urlSlug}`;

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>SEO Preview</h3>

      {/* Google Search Result Preview */}
      <div className={styles.previewSection}>
        <h4 className={styles.subheading}>Google Search Result</h4>
        <div className={styles.googlePreview}>
          <div className={styles.googleUrl}>{fullUrl}</div>
          <div className={styles.googleTitle}>{pageTitle}</div>
          <div className={styles.googleDescription}>{metaDescription}</div>
          <div className={styles.googleMeta}>
            <span className={styles.googleDate}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {post.categories.length > 0 && (
              <span className={styles.googleCategory}>
                · {post.categories[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Social Media Preview (Twitter/X) */}
      <div className={styles.previewSection}>
        <h4 className={styles.subheading}>Twitter/X Card</h4>
        <div className={styles.twitterPreview}>
          <div className={styles.twitterCard}>
            <div className={styles.twitterImage}>
              <div className={styles.twitterImagePlaceholder}>📝</div>
            </div>
            <div className={styles.twitterContent}>
              <div className={styles.twitterDomain}>zachliibbe.com</div>
              <div className={styles.twitterTitle}>
                {post.title || 'Untitled Post'}
              </div>
              <div className={styles.twitterDescription}>{metaDescription}</div>
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn Preview */}
      <div className={styles.previewSection}>
        <h4 className={styles.subheading}>LinkedIn Card</h4>
        <div className={styles.linkedinPreview}>
          <div className={styles.linkedinCard}>
            <div className={styles.linkedinImage}>
              <div className={styles.linkedinImagePlaceholder}>✍️</div>
            </div>
            <div className={styles.linkedinContent}>
              <div className={styles.linkedinTitle}>
                {post.title || 'Untitled Post'}
              </div>
              <div className={styles.linkedinDescription}>
                {metaDescription}
              </div>
              <div className={styles.linkedinDomain}>zachliibbe.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Metrics */}
      <div className={styles.previewSection}>
        <h4 className={styles.subheading}>SEO Analysis</h4>
        <div className={styles.seoMetrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Title Length:</span>
            <span
              className={`${styles.metricValue} ${
                pageTitle.length > 60
                  ? styles.metricWarning
                  : pageTitle.length > 50
                    ? styles.metricCaution
                    : styles.metricGood
              }`}
            >
              {pageTitle.length}/60 chars
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>Meta Description:</span>
            <span
              className={`${styles.metricValue} ${
                metaDescription.length > 160
                  ? styles.metricWarning
                  : metaDescription.length < 120
                    ? styles.metricCaution
                    : styles.metricGood
              }`}
            >
              {metaDescription.length}/160 chars
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>URL Slug:</span>
            <span
              className={`${styles.metricValue} ${
                urlSlug.length > 100 ? styles.metricWarning : styles.metricGood
              }`}
            >
              {urlSlug || 'generated-from-title'}
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>Categories:</span>
            <span
              className={`${styles.metricValue} ${
                post.categories.length === 0
                  ? styles.metricWarning
                  : styles.metricGood
              }`}
            >
              {post.categories.length > 0
                ? post.categories.join(', ')
                : 'None selected'}
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>Tags:</span>
            <span
              className={`${styles.metricValue} ${
                post.tags.length === 0
                  ? styles.metricCaution
                  : styles.metricGood
              }`}
            >
              {post.tags.length > 0 ? `${post.tags.length} tags` : 'None added'}
            </span>
          </div>
        </div>
      </div>

      {/* SEO Recommendations */}
      <div className={styles.previewSection}>
        <h4 className={styles.subheading}>Recommendations</h4>
        <div className={styles.recommendations}>
          {pageTitle.length > 60 && (
            <div className={styles.recommendation} data-type="warning">
              ⚠️ Title is too long. Consider shortening to under 60 characters
              for better search visibility.
            </div>
          )}

          {metaDescription.length < 120 && (
            <div className={styles.recommendation} data-type="tip">
              💡 Meta description could be longer. Aim for 120-160 characters
              for better search snippets.
            </div>
          )}

          {post.categories.length === 0 && (
            <div className={styles.recommendation} data-type="warning">
              ⚠️ No categories selected. Add at least one category for better
              content organization.
            </div>
          )}

          {post.tags.length === 0 && (
            <div className={styles.recommendation} data-type="tip">
              💡 Consider adding relevant tags to improve discoverability and
              SEO.
            </div>
          )}

          {!post.excerpt.trim() && (
            <div className={styles.recommendation} data-type="tip">
              💡 Add a custom excerpt for better control over search result
              descriptions.
            </div>
          )}

          {pageTitle.length <= 60 &&
            metaDescription.length >= 120 &&
            metaDescription.length <= 160 &&
            post.categories.length > 0 && (
              <div className={styles.recommendation} data-type="success">
                ✅ Great! Your SEO looks good. Title, description, and
                categories are optimized.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
