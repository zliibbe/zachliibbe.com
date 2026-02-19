'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { MdCreate, MdHourglassEmpty, MdOpenInNew } from 'react-icons/md';
import type { BlogPost, FeaturedImage } from '@/types/blog';
import styles from './BlogAdmin.module.css';
import ImageModal, { type ImageOption } from './ImageModal';
import LinkedInPostModal from './LinkedInPostModal';
import MarkdownEditor from './MarkdownEditor';
import Modal from './Modal';

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

  // Modal states
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    type: 'loading' | 'quick-result' | 'selection' | 'success' | 'error';
    title?: string;
    message?: string;
    image?: ImageOption;
    images?: ImageOption[];
    currentPost?: BlogPost;
    forceReplace?: boolean;
  }>({
    isOpen: false,
    type: 'loading',
  });

  const [generalModal, setGeneralModal] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
    type: 'success' | 'error' | 'confirm' | 'confirmation';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'success',
  });

  const [linkedInModal, setLinkedInModal] = useState<{
    isOpen: boolean;
    post: BlogPost | null;
  }>({
    isOpen: false,
    post: null,
  });

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      // Add cache busting to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/blog/posts?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
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

  const handleSavePost = async (
    postData: Omit<BlogPost, 'id' | 'slug' | 'readTime'>
  ) => {
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
        setGeneralModal({
          isOpen: true,
          type: 'error',
          title: 'Error Saving Post',
          message: error.error || 'Unknown error occurred',
        });
        return;
      }

      const savedPost = await response.json();

      // If the post is scheduled, call the schedule API
      if (postData.status === 'scheduled' && postData.scheduledFor) {
        if (!savedPost.post?.slug) {
          setGeneralModal({
            isOpen: true,
            type: 'error',
            title: 'Error Scheduling Post',
            message: 'Post was saved but slug was not generated',
          });
          return;
        }

        const scheduleResponse = await fetch('/api/blog/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug: savedPost.post.slug,
            scheduledFor: postData.scheduledFor,
          }),
        });

        if (!scheduleResponse.ok) {
          const scheduleError = await scheduleResponse.json();
          setGeneralModal({
            isOpen: true,
            type: 'error',
            title: 'Error Scheduling Post',
            message: scheduleError.error || 'Unknown error occurred',
          });
          return;
        }
      }

      setShowEditor(false);
      setEditingPost(null);
      await loadPosts(); // Refresh posts list
    } catch (error) {
      console.error('Error saving post:', error);
      setGeneralModal({
        isOpen: true,
        type: 'error',
        title: 'Error Saving Post',
        message: 'Please try again.',
      });
    }
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  const handleDeletePost = async (post: BlogPost) => {
    setGeneralModal({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Post',
      message: `Are you sure you want to delete "${post.title}"? This action cannot be undone.`,
      onConfirm: () => confirmDeletePost(post),
    });
  };

  const confirmDeletePost = async (post: BlogPost) => {
    try {
      const response = await fetch(`/api/blog/posts/${post.slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPosts(); // Refresh posts list
      } else {
        const error = await response.json();
        setGeneralModal({
          isOpen: true,
          type: 'error',
          title: 'Error Deleting Post',
          message: error.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setGeneralModal({
        isOpen: true,
        type: 'error',
        title: 'Error Deleting Post',
        message: 'Please try again.',
      });
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
        setGeneralModal({
          isOpen: true,
          type: 'error',
          title: 'Error Publishing Post',
          message: error.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      setGeneralModal({
        isOpen: true,
        type: 'error',
        title: 'Error Publishing Post',
        message: 'Please try again.',
      });
    }
  };

  const handleGenerateImage = async (post: BlogPost, forceReplace = false) => {
    try {
      // Show loading modal
      setImageModal({
        isOpen: true,
        type: 'loading',
        title: `Generating Image for "${post.title}"`,
        message: '🔍 Searching for the perfect image...',
        currentPost: post,
      });

      // Call API to generate/fetch image
      const response = await fetch(
        `/api/blog/posts/${post.slug}/generate-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ forceReplace }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.featuredImage) {
          // Convert FeaturedImage to ImageOption format
          const imageOption: ImageOption = {
            id: result.featuredImage.id || 'generated',
            url: result.featuredImage.url,
            thumbnailUrl:
              result.featuredImage.thumbnailUrl || result.featuredImage.url,
            alt: result.featuredImage.alt,
            attribution: result.featuredImage.attribution,
            width: result.featuredImage.width,
            height: result.featuredImage.height,
          };

          // Refresh posts data to show updated image
          await loadPosts();

          // Show success modal
          setImageModal({
            isOpen: true,
            type: 'success',
            title: 'Featured Image Added Successfully!',
            message: 'The image is now available for Medium cross-posting.',
            image: imageOption,
          });
        } else {
          // Show no results
          setImageModal({
            isOpen: true,
            type: 'selection',
            title: `No Images Found for "${post.title}"`,
            images: [],
          });
        }
      } else {
        const error = await response.json();
        setImageModal({
          isOpen: true,
          type: 'error',
          title: 'Error Generating Image',
          message: error.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setImageModal({
        isOpen: true,
        type: 'error',
        title: 'Error Generating Image',
        message: 'Please try again.',
      });
    }
  };

  const handleSelectFromImageOptions = async (
    post: BlogPost,
    forceReplace = false
  ) => {
    try {
      // Determine if this is a replacement operation
      const isReplacement = forceReplace || !!post.featuredImage;

      // Show loading modal
      setImageModal({
        isOpen: true,
        type: 'loading',
        title: `${isReplacement ? 'Replace' : 'Choose'} Image for "${post.title}"`,
        message: `🔍 Searching for ${isReplacement ? 'replacement ' : ''}image options...`,
        currentPost: post,
        forceReplace: isReplacement,
      });

      // Get image options
      const response = await fetch(
        `/api/blog/posts/${post.slug}/image-options`
      );

      if (!response.ok) {
        const error = await response.json();
        setImageModal({
          isOpen: true,
          type: 'error',
          title: 'Error Getting Image Options',
          message: error.error || 'Unknown error occurred',
        });
        return;
      }

      const result = await response.json();

      // Convert API response to ImageOption format
      const imageOptions: ImageOption[] = result.options.map(
        (option: ImageOption) => ({
          id: option.id,
          url: option.url,
          thumbnailUrl: option.thumbnailUrl,
          alt: option.alt,
          attribution: option.attribution,
          width: option.width,
          height: option.height,
        })
      );

      // Show selection modal
      setImageModal({
        isOpen: true,
        type: 'selection',
        title: `${isReplacement ? 'Replace' : 'Choose'} Image for "${post.title}"`,
        images: imageOptions,
        currentPost: post,
        forceReplace: isReplacement,
      });
    } catch (error) {
      console.error('Error getting image options:', error);
      setImageModal({
        isOpen: true,
        type: 'error',
        title: 'Error Getting Image Options',
        message: 'Please try again.',
      });
    }
  };

  // Handle image selection from modal
  const handleImageSelect = async (image: ImageOption) => {
    const post = imageModal.currentPost;
    if (!post) return;

    try {
      // Show loading state for selection
      setImageModal({
        isOpen: true,
        type: 'loading',
        title: 'Setting Selected Image',
        message: '📸 Setting selected image...',
        currentPost: post,
      });

      const selectResponse = await fetch(
        `/api/blog/posts/${post.slug}/image-options`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedImageId: image.id,
            forceReplace: imageModal.forceReplace || false,
          }),
        }
      );

      if (selectResponse.ok) {
        const selectResult = await selectResponse.json();

        // Convert response to ImageOption format
        const resultImage: ImageOption = {
          id: selectResult.featuredImage.id || image.id,
          url: selectResult.featuredImage.url,
          thumbnailUrl:
            selectResult.featuredImage.thumbnailUrl ||
            selectResult.featuredImage.url,
          alt: selectResult.featuredImage.alt,
          attribution: selectResult.featuredImage.attribution,
          width: selectResult.featuredImage.width,
          height: selectResult.featuredImage.height,
        };

        // Refresh posts data to show updated image
        await loadPosts();

        // Show success modal
        setImageModal({
          isOpen: true,
          type: 'success',
          title: `Featured Image ${post.featuredImage ? 'Replaced' : 'Added'} Successfully!`,
          message: 'The image is now available for Medium cross-posting.',
          image: resultImage,
        });
      } else {
        const error = await selectResponse.json();
        setImageModal({
          isOpen: true,
          type: 'error',
          title: 'Error Setting Image',
          message: error.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      setImageModal({
        isOpen: true,
        type: 'error',
        title: 'Error Selecting Image',
        message: 'Please try again.',
      });
    }
  };

  // Handle modal close
  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      type: 'loading',
    });
  };

  const closeGeneralModal = () => {
    setGeneralModal({
      isOpen: false,
      type: 'success',
    });
  };

  const handleCrossPostToMedium = async (post: BlogPost) => {
    setGeneralModal({
      isOpen: true,
      type: 'confirmation',
      title: `Cross-post "${post.title}" to Medium?`,
      message: `This will:\n\n1. Copy the post content to your clipboard (optimized for Medium)\n2. Open Medium's new story page\n3. You can then paste, add images, and publish\n4. Add the Medium URL back to this post for tracking`,
      onConfirm: () => performMediumCrossPost(post),
    });
  };

  const performMediumCrossPost = async (post: BlogPost) => {
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

      setGeneralModal({
        isOpen: true,
        type: 'success',
        title: 'Content Copied to Clipboard',
        message: `✅ Content optimized for Medium!\n\n${hasImage} Image Status: ${imageInstructions}\n\n📝 Next steps:\n1. Paste content in Medium editor (Ctrl/Cmd + V)\n2. ${post.featuredImage ? 'Add the featured image URL as hero image' : 'Add a relevant hero image'}\n3. Replace any [IMAGE: ...] placeholders\n4. Review formatting and adjust as needed\n5. Use the suggested tags (Medium allows up to 5)\n6. Publish on Medium\n7. Copy the Medium URL back to this post\n\n💡 Pro tip: Medium's algorithm favors posts with high-quality images!`,
      });
    } catch (error) {
      console.error('Error cross-posting to Medium:', error);
      setGeneralModal({
        isOpen: true,
        type: 'error',
        title: 'Error Copying to Clipboard',
        message: 'Please try again.',
      });
    }
  };

  const handleCreateLinkedInPost = (post: BlogPost) => {
    setLinkedInModal({
      isOpen: true,
      post: post,
    });
  };

  const handleCloseLinkedInModal = () => {
    setLinkedInModal({
      isOpen: false,
      post: null,
    });
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
                            <h3 className={styles.postTitle}>
                              {post.status === 'published' ? (
                                <a
                                  href={`/blog/${post.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.postTitleLink}
                                >
                                  {post.title}
                                </a>
                              ) : (
                                post.title
                              )}
                            </h3>
                            <div className={styles.postMeta}>
                              <span
                                className={`${styles.postStatus} ${styles[`status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}`]}`}
                              >
                                {post.status.toUpperCase()}
                              </span>
                              {post.featuredImage?.url && (
                                <span
                                  className={styles.imageIndicator}
                                  title="Has featured image"
                                >
                                  📸
                                </span>
                              )}
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

                              {/* Image options for all post types */}
                              {!post.featuredImage ||
                              !post.featuredImage.url ? (
                                <button
                                  className={styles.actionButton}
                                  onClick={() =>
                                    handleSelectFromImageOptions(post)
                                  }
                                  title="Choose a featured image for this post"
                                >
                                  🖼️ Choose Image
                                </button>
                              ) : (
                                <button
                                  className={styles.actionButton}
                                  onClick={() =>
                                    handleSelectFromImageOptions(post, true)
                                  }
                                  title="Replace current featured image"
                                >
                                  🔄 Replace Image
                                </button>
                              )}
                              {post.status === 'published' &&
                                !post.mediumUrl && (
                                  <button
                                    className={styles.actionButton}
                                    onClick={() =>
                                      handleCrossPostToMedium(post)
                                    }
                                  >
                                    Cross-post to Medium
                                  </button>
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
                              {post.status === 'published' && (
                                <button
                                  className={styles.actionButton}
                                  onClick={() => handleCreateLinkedInPost(post)}
                                  title="Generate LinkedIn post from this blog post"
                                >
                                  💼 Create LinkedIn Post
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

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        type={imageModal.type}
        title={imageModal.title}
        message={imageModal.message}
        image={imageModal.image}
        images={imageModal.images}
        onSelectImage={handleImageSelect}
      />

      {/* LinkedIn Post Modal */}
      <LinkedInPostModal
        isOpen={linkedInModal.isOpen}
        onClose={handleCloseLinkedInModal}
        post={linkedInModal.post}
      />

      {/* General Purpose Modal */}
      <Modal
        isOpen={generalModal.isOpen}
        onClose={closeGeneralModal}
        title={generalModal.title}
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
            {generalModal.type === 'success'
              ? '✅'
              : generalModal.type === 'error'
                ? '❌'
                : '⚠️'}
          </div>
          <p
            style={{
              margin: '0 0 24px 0',
              color: 'var(--text-primary, #1f2937)',
            }}
          >
            {generalModal.message}
          </p>
          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
          >
            <button
              onClick={closeGeneralModal}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              {generalModal.type === 'confirm' ||
              generalModal.type === 'confirmation'
                ? 'Cancel'
                : 'Close'}
            </button>
            {(generalModal.type === 'confirm' ||
              generalModal.type === 'confirmation') &&
              generalModal.onConfirm && (
                <button
                  onClick={() => {
                    generalModal.onConfirm?.();
                    closeGeneralModal();
                  }}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {generalModal.type === 'confirmation'
                    ? 'Cross-Post to Medium'
                    : 'Confirm'}
                </button>
              )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
