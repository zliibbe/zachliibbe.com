'use client';

import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import Link from 'next/link';
import Image from 'next/image';
import { MdOpenInNew, MdCreate, MdHourglassEmpty } from 'react-icons/md';
import { BlogPost, FeaturedImage } from '@/types/blog';
import MarkdownEditor from './MarkdownEditor';
import styles from './BlogAdmin.module.css';

interface BlogAdminProps {
  session: Session;
}

type TabType = 'all' | 'published' | 'drafts' | 'scheduled';

export default function BlogAdmin({ session }: BlogAdminProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [posts, setPosts] = useState<
    (BlogPost & { featuredImage?: FeaturedImage })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blog/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    switch (activeTab) {
      case 'published':
        return post.status === 'published';
      case 'drafts':
        return post.status === 'draft';
      case 'scheduled':
        return post.status === 'scheduled';
      default:
        return true;
    }
  });

  const handleNewPost = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleSavePost = async (postData: any) => {
    try {
      // First save/update the post
      const url = editingPost
        ? `/api/blog/posts/${editingPost.slug}`
        : '/api/blog/posts';

      const method = editingPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error saving post: ${error.error}`);
        return;
      }

      const savedPost = await response.json();

      // If the post is scheduled, call the schedule API
      if (postData.status === 'scheduled' && postData.scheduledFor) {
        const scheduleResponse = await fetch('/api/blog/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug: savedPost.post?.slug || postData.slug,
            scheduledFor: postData.scheduledFor,
          }),
        });

        if (!scheduleResponse.ok) {
          const scheduleError = await scheduleResponse.json();
          alert(`Error scheduling post: ${scheduleError.error}`);
          return;
        }
      }

      setShowEditor(false);
      setEditingPost(null);
      await loadPosts(); // Refresh posts list
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  const handleDeletePost = async (post: BlogPost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/blog/posts/${post.slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPosts(); // Refresh posts list
      } else {
        const error = await response.json();
        alert(`Error deleting post: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again.');
    }
  };

  const handlePublishPost = async (post: BlogPost) => {
    try {
      const response = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: post.slug }),
      });

      if (response.ok) {
        await loadPosts(); // Refresh posts list
      } else {
        const error = await response.json();
        alert(`Error publishing post: ${error.error}`);
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Error publishing post. Please try again.');
    }
  };

  const handleGenerateImage = async (post: BlogPost) => {
    try {
      const confirmed = confirm(
        `Generate a featured image for "${post.title}"?\n\n` +
          `This will:\n` +
          `1. Search Unsplash for relevant images based on your post's tags and title\n` +
          `2. Add the best match as the featured image\n` +
          `3. Include proper attribution as required by Unsplash\n\n` +
          `Continue?`
      );

      if (!confirmed) return;

      // Show loading state
      alert('🔍 Searching for the perfect image...');

      // Call API to generate/fetch image
      const response = await fetch(
        `/api/blog/posts/${post.slug}/generate-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.featuredImage) {
          alert(
            `✅ Featured image added successfully!\n\n` +
              `📸 Image: ${result.featuredImage.alt}\n` +
              `📷 Photo by: ${result.featuredImage.attribution.text}\n\n` +
              `The image is now available for Medium cross-posting.`
          );
          await loadPosts(); // Refresh to show the new image
        } else {
          alert(
            'ℹ️ No suitable image found for this post. You can manually add one later or try different tags.'
          );
        }
      } else {
        const error = await response.json();
        alert(`❌ Error generating image: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('❌ Error generating image. Please try again.');
    }
  };

  const handleCrossPostToMedium = async (post: BlogPost) => {
    // Phase 1: Manual cross-posting workflow with improved Medium formatting
    const confirmed = confirm(
      `Cross-post "${post.title}" to Medium?\n\n` +
        `This will:\n` +
        `1. Copy the post content to your clipboard (optimized for Medium)\n` +
        `2. Open Medium's new story page\n` +
        `3. You can then paste, add images, and publish\n` +
        `4. Add the Medium URL back to this post for tracking\n\n` +
        `Continue?`
    );

    if (!confirmed) return;

    try {
      // Convert HTML content to Medium-optimized format
      const htmlToMediumFormat = (html: string): string => {
        return (
          html
            // Headers - Medium prefers single line breaks after headers
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
            .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
            .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
            .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
            // Paragraphs - Medium handles spacing better with single line breaks
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
            // Strong/Bold
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            // Emphasis/Italic
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            // Code blocks - Medium prefers triple backticks with language
            .replace(
              /<pre[^>]*><code[^>]*class="language-(\w+)"[^>]*>(.*?)<\/code><\/pre>/gis,
              '```$1\n$2\n```\n'
            )
            .replace(
              /<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis,
              '```\n$1\n```\n'
            )
            .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n')
            // Inline code
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            // Lists - Medium handles these well with proper spacing
            .replace(/<ul[^>]*>/gi, '')
            .replace(/<\/ul>/gi, '')
            .replace(/<ol[^>]*>/gi, '')
            .replace(/<\/ol>/gi, '')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
            // Links
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            // Blockquotes - Medium handles these nicely
            .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n')
            // Horizontal rules
            .replace(/<hr[^>]*>/gi, '---\n')
            // Line breaks
            .replace(/<br[^>]*>/gi, '\n')
            // Images - placeholder for manual insertion
            .replace(
              /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,
              '\n[IMAGE: $2 - $1]\n'
            )
            // Remove any remaining HTML tags
            .replace(/<[^>]*>/g, '')
            // Clean up excessive line breaks (max 2 consecutive)
            .replace(/\n{3,}/g, '\n\n')
            // Clean up spaces
            .replace(/ {2,}/g, ' ')
            .trim()
        );
      };

      const mediumContent = htmlToMediumFormat(post.content);

      // Create the final Medium-ready content with enhanced image support
      const contentSections = [`# ${post.title}`, ''];

      // Add featured image guidance if available
      if (post.featuredImage) {
        contentSections.push(
          `📸 **Featured Image Suggestion:**`,
          `Image URL: ${post.featuredImage.url}`,
          `Alt Text: ${post.featuredImage.alt}`,
          `Attribution: ${post.featuredImage.attribution.text}`,
          '',
          `*Copy the image URL above and add it as your hero image in Medium.*`,
          '',
          '---',
          ''
        );
      } else {
        contentSections.push(
          `📸 **Image Suggestion:**`,
          `Consider adding a relevant hero image to this post. Search for images related to: ${post.tags.slice(0, 3).join(', ')}`,
          '',
          '---',
          ''
        );
      }

      contentSections.push(
        mediumContent,
        '',
        '---',
        '',
        `*This article was originally published on [zachliibbe.com](https://zachliibbe.com/blog/${post.slug}). Follow me for more technical deep-dives and development insights.*`,
        '',
        `**Medium Tags Suggestion:** ${post.tags.slice(0, 5).join(', ')}`
      );

      const finalContent = contentSections.join('\n');

      // Copy to clipboard
      await navigator.clipboard.writeText(finalContent);

      // Open Medium's new story page
      window.open('https://medium.com/new-story', '_blank');

      // Enhanced success message with image-specific guidance
      const hasImage = post.featuredImage ? '✅' : '⚠️';
      const imageInstructions = post.featuredImage
        ? `Featured image URL is included at the top - copy and paste it as your hero image in Medium.`
        : `No featured image found. Consider adding a relevant image to enhance your post.`;

      alert(
        `✅ Content copied to clipboard and optimized for Medium!\n\n` +
          `${hasImage} **Image Status:** ${imageInstructions}\n\n` +
          `📝 **Next steps:**\n` +
          `1. Paste content in Medium editor (Ctrl/Cmd + V)\n` +
          `2. ${post.featuredImage ? 'Add the featured image URL as hero image' : 'Add a relevant hero image'}\n` +
          `3. Replace any [IMAGE: ...] placeholders with actual images\n` +
          `4. Review formatting and adjust as needed\n` +
          `5. Use the suggested tags at the bottom (Medium allows up to 5)\n` +
          `6. Publish on Medium\n` +
          `7. Copy the Medium URL and add it back to this post\n\n` +
          `💡 **Pro tip:** Medium's algorithm favors posts with high-quality images and good engagement!`
      );
    } catch (error) {
      console.error('Error cross-posting to Medium:', error);
      alert('❌ Error copying content to clipboard. Please try again.');
    }
  };

  if (showEditor) {
    return (
      <MarkdownEditor
        initialPost={editingPost || undefined}
        onSave={handleSavePost}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="universal-gradient-container">
      <div className="universal-gradient-background" />
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <main className={styles.content}>
            <header className={styles.header}>
              <div className={styles.headerContent}>
                <div>
                  <Link href="/admin" className={styles.backLink}>
                    ← Admin Dashboard
                  </Link>
                  <h1>Blog Management</h1>
                </div>
                <button
                  className={styles.newPostButton}
                  onClick={handleNewPost}
                >
                  New Post
                </button>
              </div>
            </header>

            <div className={styles.blogAdmin}>
              <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                  <button
                    className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Posts ({posts.length})
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'published' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('published')}
                  >
                    Published (
                    {posts.filter(p => p.status === 'published').length})
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'drafts' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('drafts')}
                  >
                    Drafts ({posts.filter(p => p.status === 'draft').length})
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'scheduled' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('scheduled')}
                  >
                    Scheduled (
                    {posts.filter(p => p.status === 'scheduled').length})
                  </button>
                </div>
              </div>

              <div className={styles.postsContainer}>
                {loading ? (
                  <div className={styles.loading}>
                    <div className={styles.loadingSpinner}>
                      <MdHourglassEmpty size={24} />
                    </div>
                    <p>Loading posts...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <MdCreate size={48} />
                    </div>
                    <h3>
                      {activeTab === 'all'
                        ? 'No posts yet'
                        : activeTab === 'published'
                          ? 'No published posts'
                          : activeTab === 'drafts'
                            ? 'No drafts'
                            : 'No scheduled posts'}
                    </h3>
                    <p>
                      {activeTab === 'all'
                        ? 'Create your first blog post to get started.'
                        : `Switch to another tab or create a new post.`}
                    </p>
                    <button
                      className={styles.createFirstPostButton}
                      onClick={handleNewPost}
                    >
                      Create {activeTab === 'all' ? 'First' : 'New'} Post
                    </button>
                  </div>
                ) : (
                  <div className={styles.postsList}>
                    {filteredPosts.map(post => (
                      <div
                        key={post.slug || post.id}
                        className={styles.postCard}
                      >
                        {post.featuredImage && (
                          <div className={styles.postImageContainer}>
                            <Image
                              src={post.featuredImage.url}
                              alt={post.featuredImage.alt}
                              width={post.featuredImage.width}
                              height={post.featuredImage.height}
                              className={styles.postImage}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        )}
                        <div className={styles.postContent}>
                          <div className={styles.postHeader}>
                            <h3 className={styles.postTitle}>{post.title}</h3>
                            <div className={styles.postMeta}>
                              <span
                                className={`${styles.postStatus} ${styles[`status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}`]}`}
                              >
                                {post.status.toUpperCase()}
                              </span>
                              <span className={styles.postDate}>
                                {post.status === 'scheduled' &&
                                post.scheduledFor
                                  ? (() => {
                                      try {
                                        return `Scheduled: ${new Date(
                                          post.scheduledFor
                                        ).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          timeZoneName: 'short',
                                        })}`;
                                      } catch (error) {
                                        console.warn(
                                          'Invalid scheduled date:',
                                          post.scheduledFor
                                        );
                                        return `Scheduled: ${post.scheduledFor}`;
                                      }
                                    })()
                                  : post.publishedAt || 'Not published'}
                              </span>
                              <span className={styles.postReadTime}>
                                {post.readTime}
                              </span>
                            </div>
                          </div>

                          <p className={styles.postExcerpt}>{post.excerpt}</p>

                          <div className={styles.postFooter}>
                            <div className={styles.postTags}>
                              {post.categories
                                .concat(post.tags)
                                .slice(0, 3)
                                .map(tag => (
                                  <span key={tag} className={styles.postTag}>
                                    {tag}
                                  </span>
                                ))}
                            </div>

                            <div className={styles.postActions}>
                              <button
                                className={styles.actionButton}
                                onClick={() => handleEditPost(post)}
                              >
                                Edit
                              </button>
                              {post.status === 'draft' && (
                                <button
                                  className={styles.actionButtonPrimary}
                                  onClick={() => handlePublishPost(post)}
                                >
                                  Publish
                                </button>
                              )}
                              {post.status === 'scheduled' && (
                                <button
                                  className={styles.actionButtonPrimary}
                                  onClick={() => handlePublishPost(post)}
                                >
                                  Publish Now
                                </button>
                              )}
                              {post.status === 'published' &&
                                !post.mediumUrl && (
                                  <>
                                    {!post.featuredImage && (
                                      <button
                                        className={styles.actionButton}
                                        onClick={() =>
                                          handleGenerateImage(post)
                                        }
                                        title="Generate featured image from Unsplash"
                                      >
                                        🖼️ Add Image
                                      </button>
                                    )}
                                    <button
                                      className={styles.actionButton}
                                      onClick={() =>
                                        handleCrossPostToMedium(post)
                                      }
                                    >
                                      Cross-post to Medium
                                    </button>
                                  </>
                                )}
                              {post.mediumUrl && (
                                <button
                                  className={styles.actionButton}
                                  onClick={() =>
                                    window.open(post.mediumUrl, '_blank')
                                  }
                                  title="View on Medium"
                                >
                                  <MdOpenInNew
                                    size={16}
                                    style={{ marginRight: '4px' }}
                                  />
                                  Medium
                                </button>
                              )}
                              <button
                                className={styles.actionButtonDanger}
                                onClick={() => handleDeletePost(post)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
