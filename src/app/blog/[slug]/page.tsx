import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { FaTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { getPostBySlugWithImage, getAllPublishedPostsWithImages } from '@/lib/blog-with-images';
import Footer from '@/app/components/Footer';
import styles from './page.module.css';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlugWithImage(slug);

  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareUrl = `https://zachliibbe.com/blog/${post.slug}`;
  const shareText = encodeURIComponent(`Check out "${post.title}" by ${post.author}`);

  return (
    <>
      <main>
        <div className="universal-gradient-container">
          <div className="universal-gradient-background"></div>
          <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <div className={styles.content}>
              <article>
                <header className={styles.header}>
                  {/* Featured Image Background */}
                  {post.featuredImage && (
                    <>
                      <div className={styles.featuredImageContainer}>
                        <Image
                          src={post.featuredImage.url}
                          alt={post.featuredImage.alt}
                          width={post.featuredImage.width}
                          height={400}
                          className={styles.featuredImage}
                          style={{ objectFit: 'cover' }}
                          priority
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
                      <div className={styles.headerOverlay}></div>
                    </>
                  )}
                  
                  <div className={styles.headerContent}>
                    <Link href="/blog" className={styles.backLink}>
                      ← Back to Blog
                    </Link>
                    
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
                    
                    <h1 className={styles.title}>{post.title}</h1>
                    
                    <div className={styles.meta}>
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                      <span>•</span>
                      <span>by {post.author}</span>
                    </div>
                    
                    {post.excerpt && (
                      <p className={styles.excerpt}>{post.excerpt}</p>
                    )}
                    
                    <div className={styles.tags}>
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
                  </div>
                </header>

                <div 
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <footer className={styles.footer}>
                  <p className={styles.shareText}>
                    Found this helpful? Share it with others:
                  </p>
                  
                  <div className={styles.shareLinks}>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shareIcon}
                      aria-label="Share on Twitter"
                    >
                      <FaTwitter size={30} />
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shareIcon}
                      aria-label="Share on LinkedIn"
                    >
                      <FaLinkedin size={30} />
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${shareText}%0A%0A${shareUrl}`}
                      className={styles.shareIcon}
                      aria-label="Share via Email"
                    >
                      <FaEnvelope size={30} />
                    </a>
                  </div>
                </footer>
              </article>
            </div>
          </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// Generate static params for all published posts
export async function generateStaticParams() {
  const posts = await getAllPublishedPostsWithImages();
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for each post
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugWithImage(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Zach Liibbe',
    };
  }

  return {
    title: `${post.title} | Zach Liibbe`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}