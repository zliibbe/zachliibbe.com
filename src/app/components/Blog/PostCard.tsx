import Link from 'next/link';
import Image from 'next/image';
import { BlogPostMetadata } from '@/types/blog';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: BlogPostMetadata;
}

export default function PostCard({ post }: PostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <article className={styles.postCard}>
      {/* Featured Image */}
      {post.featuredImage ? (
        <div className={styles.imageContainer}>
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt}
            width={post.featuredImage.width}
            height={200}
            className={styles.featuredImage}
            style={{ objectFit: 'cover' }}
          />
          <div className={styles.imageAttribution}>
            <a 
              href={post.featuredImage.attribution.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {post.featuredImage.attribution.text}
            </a>
          </div>
        </div>
      ) : (
        <div className={styles.noImage}>
          {post.title}
        </div>
      )}

      <div className={styles.postCardContent}>
        <div className={styles.categories}>
          {post.categories.map(category => (
            <Link 
              key={category}
              href={`/blog?category=${encodeURIComponent(category.toLowerCase())}`}
              className={styles.category}
            >
              {category}
            </Link>
          ))}
        </div>
      
      <h2 className={styles.postTitle}>
        <Link href={`/blog/${post.slug}`}>
          {post.title}
        </Link>
      </h2>
      
      <div className={styles.postMeta}>
        <span>{formatDate(post.publishedAt)}</span>
        <span>•</span>
        <span>{post.readTime}</span>
        <span>•</span>
        <span>by {post.author}</span>
      </div>
      
      <p className={styles.postExcerpt}>
        {post.excerpt}
      </p>
      
      <div className={styles.postTags}>
        {post.tags.map(tag => (
          <Link 
            key={tag}
            href={`/blog?tag=${encodeURIComponent(tag)}`}
            className={styles.tag}
          >
            #{tag}
          </Link>
        ))}
      </div>
      
        <Link href={`/blog/${post.slug}`} className={styles.readMore}>
          Read more →
        </Link>
      </div>
    </article>
  );
}