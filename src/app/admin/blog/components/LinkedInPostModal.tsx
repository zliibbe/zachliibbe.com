import { useState, useEffect } from 'react';
import { BlogPost } from '@/types/blog';
import Modal from './Modal';
import styles from './LinkedInPostModal.module.css';

interface LinkedInPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost | null;
}

export default function LinkedInPostModal({
  isOpen,
  onClose,
  post,
}: LinkedInPostModalProps) {
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [customPost, setCustomPost] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const maxCharacters = 2800; // LinkedIn character limit with safety buffer

  useEffect(() => {
    if (isOpen && post) {
      generateLinkedInPost();
    }
  }, [isOpen, post]);

  useEffect(() => {
    const content = useCustom ? customPost : generatedPost;
    setCharacterCount(content.length);
  }, [generatedPost, customPost, useCustom]);

  const generateLinkedInPost = async () => {
    if (!post) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/blog/generate-linkedin-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          categories: post.categories,
          tags: post.tags,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedPost(data.post);
      } else {
        throw new Error('Failed to generate LinkedIn post');
      }
    } catch (error) {
      console.error('Error generating LinkedIn post:', error);
      // Fallback to basic template
      const basicPost = createBasicLinkedInPost();
      setGeneratedPost(basicPost);
    } finally {
      setIsGenerating(false);
    }
  };

  const createBasicLinkedInPost = () => {
    if (!post) return '';

    const blogUrl = `${window.location.origin}/blog/${post.slug}`;
    const categoryHook = getCategoryHook(post.categories[0] || '');

    return `${categoryHook}

${post.title}

${post.excerpt}

Read the full post here: ${blogUrl}

${post.tags
  .slice(0, 5)
  .map(tag => `#${tag.replace(/\s+/g, '')}`)
  .join(' ')}`;
  };

  const getCategoryHook = (category: string): string => {
    const hooks = {
      Development: '💻 Just published a new development insight!',
      Personal: '🌱 Sharing some personal reflections:',
      Learning: "📚 Here's what I've been learning lately:",
      Projects: '🚀 Excited to share my latest project work:',
    };
    return hooks[category as keyof typeof hooks] || '✨ New blog post is live!';
  };

  const copyToClipboard = async () => {
    const content = useCustom ? customPost : generatedPost;
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openLinkedIn = () => {
    window.open(
      'https://www.linkedin.com/feed/',
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handlePostAndRedirect = async () => {
    await copyToClipboard();
    openLinkedIn();
    onClose();
  };

  if (!post) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create LinkedIn Post"
      size="large"
    >
      <div className={styles.container}>
        {isGenerating ? (
          <div className={styles.generating}>
            <div className={styles.spinner}></div>
            <p>Generating LinkedIn post...</p>
          </div>
        ) : (
          <>
            <div className={styles.postPreview}>
              <div className={styles.previewHeader}>
                <h3>Post Preview</h3>
                <div className={styles.characterCount}>
                  <span
                    className={
                      characterCount > maxCharacters ? styles.overLimit : ''
                    }
                  >
                    {characterCount}/{maxCharacters}
                  </span>
                </div>
              </div>

              <div className={styles.toggleSection}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={useCustom}
                    onChange={e => setUseCustom(e.target.checked)}
                  />
                  Use custom post content
                </label>
              </div>

              {useCustom ? (
                <textarea
                  className={styles.customTextarea}
                  value={customPost}
                  onChange={e => setCustomPost(e.target.value)}
                  placeholder="Write your custom LinkedIn post..."
                  rows={12}
                />
              ) : (
                <div className={styles.generatedPost}>
                  <pre className={styles.postContent}>{generatedPost}</pre>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button
                className={styles.regenerateButton}
                onClick={generateLinkedInPost}
                disabled={isGenerating}
              >
                🔄 Regenerate Post
              </button>

              <button
                className={styles.hookButton}
                onClick={generateLinkedInPost}
                disabled={isGenerating}
                title="Generate a new hook while keeping the same content structure"
              >
                ✨ New Hook
              </button>

              <div className={styles.primaryActions}>
                <button
                  className={styles.copyButton}
                  onClick={copyToClipboard}
                  disabled={!generatedPost && !customPost}
                >
                  📋 Copy to Clipboard
                </button>

                <button
                  className={styles.postButton}
                  onClick={handlePostAndRedirect}
                  disabled={!generatedPost && !customPost}
                >
                  🚀 Copy & Open LinkedIn
                </button>
              </div>
            </div>

            <div className={styles.instructions}>
              <p>
                <strong>Instructions:</strong> Click "Copy & Open LinkedIn" to
                copy the post content and open LinkedIn in a new tab. Then paste
                and publish your post!
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
