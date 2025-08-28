"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import { MdOpenInNew, MdCreate, MdHourglassEmpty } from "react-icons/md";
import { BlogPost, FeaturedImage } from "@/types/blog";
import MarkdownEditor from "./MarkdownEditor";
import styles from "./BlogAdmin.module.css";

interface BlogAdminProps {
  session: Session;
}

type TabType = "all" | "published" | "drafts" | "scheduled";

export default function BlogAdmin({ session }: BlogAdminProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
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
      const response = await fetch("/api/admin/blog/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    switch (activeTab) {
      case "published":
        return post.status === "published";
      case "drafts":
        return post.status === "draft";
      case "scheduled":
        return post.status === "scheduled";
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
        : "/api/blog/posts";

      const method = editingPost ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
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
      if (postData.status === "scheduled" && postData.scheduledFor) {
        const scheduleResponse = await fetch("/api/blog/schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
      console.error("Error saving post:", error);
      alert("Error saving post. Please try again.");
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
        method: "DELETE",
      });

      if (response.ok) {
        await loadPosts(); // Refresh posts list
      } else {
        const error = await response.json();
        alert(`Error deleting post: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error deleting post. Please try again.");
    }
  };

  const handlePublishPost = async (post: BlogPost) => {
    try {
      const response = await fetch("/api/blog/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      console.error("Error publishing post:", error);
      alert("Error publishing post. Please try again.");
    }
  };

  const handleCrossPostToMedium = async (post: BlogPost) => {
    // Phase 1: Manual cross-posting workflow
    const confirmed = confirm(
      `Cross-post "${post.title}" to Medium?\n\n` +
      `This will:\n` +
      `1. Copy the post content to your clipboard\n` +
      `2. Open Medium's new story page\n` +
      `3. You can then paste and format the content\n` +
      `4. Add the Medium URL back to this post for tracking\n\n` +
      `Continue?`
    );
    
    if (!confirmed) return;

    try {
      // Prepare content for Medium (convert from markdown to plain text for now)
      const mediumContent = `# ${post.title}\n\n${post.content}\n\n---\n\nOriginally published at zachliibbe.com`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(mediumContent);
      
      // Open Medium's new story page
      window.open('https://medium.com/new-story', '_blank');
      
      // Show success message with next steps
      alert(
        `Content copied to clipboard!\n\n` +
        `Next steps:\n` +
        `1. Paste the content in the Medium editor\n` +
        `2. Format and customize as needed\n` +
        `3. Add any images or additional formatting\n` +
        `4. Publish on Medium\n` +
        `5. Come back and edit this post to add the Medium URL for tracking`
      );
      
    } catch (error) {
      console.error("Error cross-posting to Medium:", error);
      alert("Error copying content to clipboard. Please try again.");
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
                    className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Posts ({posts.length})
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === "published" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("published")}
                  >
                    Published (
                    {posts.filter((p) => p.status === "published").length})
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === "drafts" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("drafts")}
                  >
                    Drafts ({posts.filter((p) => p.status === "draft").length})
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === "scheduled" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("scheduled")}
                  >
                    Scheduled (
                    {posts.filter((p) => p.status === "scheduled").length})
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
                      {activeTab === "all"
                        ? "No posts yet"
                        : activeTab === "published"
                          ? "No published posts"
                          : activeTab === "drafts"
                            ? "No drafts"
                            : "No scheduled posts"}
                    </h3>
                    <p>
                      {activeTab === "all"
                        ? "Create your first blog post to get started."
                        : `Switch to another tab or create a new post.`}
                    </p>
                    <button
                      className={styles.createFirstPostButton}
                      onClick={handleNewPost}
                    >
                      Create {activeTab === "all" ? "First" : "New"} Post
                    </button>
                  </div>
                ) : (
                  <div className={styles.postsList}>
                    {filteredPosts.map((post) => (
                      <div key={post.id} className={styles.postCard}>
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
                                {post.publishedAt || "Not published"}
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
                                .map((tag) => (
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
                              {post.status === "draft" && (
                                <button
                                  className={styles.actionButtonPrimary}
                                  onClick={() => handlePublishPost(post)}
                                >
                                  Publish
                                </button>
                              )}
                              {post.status === "scheduled" && (
                                <button
                                  className={styles.actionButtonPrimary}
                                  onClick={() => handlePublishPost(post)}
                                >
                                  Publish Now
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
