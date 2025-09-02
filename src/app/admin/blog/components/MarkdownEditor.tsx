'use client';

import React, { useState, useRef, useCallback } from 'react';
import matter from 'gray-matter';
import { markdownToHtml } from '@/lib/markdown';
import styles from './MarkdownEditor.module.css';

interface BlogPost {
  title: string;
  author: string;
  publishedAt: string;
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'published';
  categories: string[];
  tags: string[];
  series?: string;
  excerpt: string;
  content: string;
  mediumUrl?: string;
}

interface MarkdownEditorProps {
  initialPost?: Partial<BlogPost>;
  onSave: (post: BlogPost) => void;
  onCancel: () => void;
}

const AVAILABLE_CATEGORIES = [
  'Development',
  'Personal',
  'Learning',
  'Projects',
];

export default function MarkdownEditor({
  initialPost,
  onSave,
  onCancel,
}: MarkdownEditorProps) {
  const [post, setPost] = useState<BlogPost>({
    title: initialPost?.title || '',
    author: 'Zach Liibbe',
    publishedAt:
      initialPost?.publishedAt || new Date().toISOString().split('T')[0],
    scheduledFor: initialPost?.scheduledFor || '',
    status: initialPost?.status || 'draft',
    categories: initialPost?.categories || [],
    tags: initialPost?.tags || [],
    series: initialPost?.series || '',
    excerpt: initialPost?.excerpt || '',
    content: initialPost?.content || '',
    mediumUrl: initialPost?.mediumUrl || '',
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Calculate reading time (rough estimate: 200 words per minute)
  const calculateReadingTime = useCallback((content: string) => {
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  }, []);

  const handleContentChange = (content: string) => {
    setPost(prev => ({ ...prev, content }));
  };

  // Import markdown file handler
  const handleImportFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          const content = e.target?.result as string;
          console.log('Raw file content:', content.substring(0, 200));

          // Parse frontmatter
          const { data: frontmatter, content: bodyContent } = matter(content);
          console.log('Parsed frontmatter:', frontmatter);
          console.log('Body content preview:', bodyContent.substring(0, 200));

          // Update the post content (without frontmatter)
          handleContentChange(bodyContent);

          // Update the post metadata from frontmatter
          setPost(prev => ({
            ...prev,
            title: frontmatter.title || prev.title,
            categories: frontmatter.categories || prev.categories,
            tags: frontmatter.tags || prev.tags,
            series: frontmatter.series || prev.series,
            excerpt: frontmatter.excerpt || prev.excerpt,
            status: frontmatter.status || prev.status,
            scheduledFor: frontmatter.scheduledFor || prev.scheduledFor,
            mediumUrl: frontmatter.mediumUrl || prev.mediumUrl,
          }));
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  // Export current post as markdown file
  const handleExportFile = useCallback(() => {
    // Create frontmatter
    const frontmatterData = {
      title: post.title,
      author: post.author,
      publishedAt: post.publishedAt,
      status: post.status,
      categories: post.categories,
      tags: post.tags,
      series: post.series,
      excerpt: post.excerpt,
      scheduledFor: post.scheduledFor,
      mediumUrl: post.mediumUrl,
    };

    // Use gray-matter to create the full markdown file with frontmatter
    const fullMarkdown = matter.stringify(post.content, frontmatterData);

    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [post]);

  const handleMetadataChange = (field: keyof BlogPost, value: any) => {
    setPost(prev => ({ ...prev, [field]: value }));
  };

  // Simple timezone conversion helpers
  const utcToMst = (utcString: string) => {
    // Parse the UTC datetime string and manually adjust for MST (-7 hours)
    const [date, time] = utcString.replace('Z', '').split('T');
    const [hours, minutes] = time.split(':').map(Number);

    let mstHours = hours - 7;
    let mstDate = date;

    // Handle day rollover
    if (mstHours < 0) {
      mstHours += 24;
      const dateObj = new Date(date);
      dateObj.setDate(dateObj.getDate() - 1);
      mstDate = dateObj.toISOString().split('T')[0];
    }

    return `${mstDate}T${String(mstHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const mstToUtc = (datetimeLocal: string) => {
    // Parse the datetime-local value and manually adjust for UTC (+7 hours)
    const [date, time] = datetimeLocal.split('T');
    const [hours, minutes] = time.split(':').map(Number);

    let utcHours = hours + 7;
    let utcDate = date;

    // Handle day rollover
    if (utcHours >= 24) {
      utcHours -= 24;
      const dateObj = new Date(date);
      dateObj.setDate(dateObj.getDate() + 1);
      utcDate = dateObj.toISOString().split('T')[0];
    }

    return `${utcDate}T${String(utcHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;
  };

  const getCurrentMstMin = () => {
    const now = new Date();
    const utcString = now.toISOString();
    return utcToMst(utcString);
  };

  const handleCategoryToggle = (category: string) => {
    setPost(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !post.tags.includes(newTag.trim())) {
      setPost(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSave = () => {
    console.log('Scheduling post with date:', post.scheduledFor);
    // Validate scheduling requirements
    if (post.status === 'scheduled' && !post.scheduledFor) {
      alert(
        'Please set a scheduled date and time before scheduling this post.'
      );
      return;
    }

    // Validate scheduled date is in the future
    if (post.status === 'scheduled' && post.scheduledFor) {
      const scheduledDate = new Date(post.scheduledFor);
      if (scheduledDate <= new Date()) {
        alert('Scheduled date must be in the future.');
        return;
      }
    }

    // Auto-generate excerpt if empty
    const finalPost = {
      ...post,
      excerpt:
        post.excerpt ||
        post.content.slice(0, 150) + (post.content.length > 150 ? '...' : ''),
    };
    onSave(finalPost);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only prevent default for specific shortcuts, let other keys pass through
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'p') {
        e.preventDefault();
        setPreviewMode(!previewMode);
      }
    }
    // Don't prevent default for other keys - let them reach the textarea
  };

  // Paste handler
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedContent = e.clipboardData.getData('text');
    setPost(prev => ({ ...prev, content: prev.content + pastedContent }));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <input
            type="text"
            placeholder="Post title..."
            value={post.title}
            onChange={e => handleMetadataChange('title', e.target.value)}
            className={styles.titleInput}
          />
          <div className={styles.metadata}>
            <span>{calculateReadingTime(post.content)}</span>
            <span>•</span>
            <span>{post.content.length} characters</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            onClick={handleImportFile}
            className={styles.button}
            title="Import markdown file"
          >
            Import
          </button>
          <button
            type="button"
            onClick={handleExportFile}
            className={styles.button}
            title="Export current post as markdown"
            disabled={!post.title.trim()}
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`${styles.button} ${previewMode ? styles.buttonActive : ''}`}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={styles.buttonSecondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={styles.buttonPrimary}
            disabled={!post.title.trim() || !post.content.trim()}
          >
            {post.status === 'scheduled'
              ? 'Schedule Post'
              : post.status === 'published'
                ? 'Update Post'
                : 'Save Draft'}
          </button>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3>Post Status</h3>
            <select
              value={post.status}
              onChange={e => handleMetadataChange('status', e.target.value)}
              className={styles.select}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Categories</h3>
            <div className={styles.categories}>
              {AVAILABLE_CATEGORIES.map(category => (
                <label key={category} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={post.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Tags</h3>
            <div className={styles.tags}>
              {post.tags.map(tag => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className={styles.tagRemove}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className={styles.tagInput}>
              <input
                type="text"
                placeholder="Add tag..."
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                }
                className={styles.input}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className={styles.addTagButton}
              >
                Add
              </button>
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Series (Optional)</h3>
            <input
              type="text"
              placeholder="e.g., Learning in Public"
              value={post.series}
              onChange={e => handleMetadataChange('series', e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.sidebarSection}>
            <h3>Medium URL (Optional)</h3>
            <input
              type="url"
              placeholder="https://medium.com/@username/article-title"
              value={post.mediumUrl}
              onChange={e => handleMetadataChange('mediumUrl', e.target.value)}
              className={styles.input}
            />
            <p className={styles.helpText}>
              URL of cross-posted Medium article (for tracking purposes)
            </p>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Excerpt</h3>
            <textarea
              placeholder="Brief description for previews..."
              value={post.excerpt}
              onChange={e => handleMetadataChange('excerpt', e.target.value)}
              className={styles.textarea}
              rows={3}
            />
          </div>

          {post.status === 'scheduled' && (
            <div className={styles.sidebarSection}>
              <h3>Scheduled For (MST)</h3>
              <input
                type="datetime-local"
                value={post.scheduledFor ? utcToMst(post.scheduledFor) : ''}
                onChange={e => {
                  const value = e.target.value;
                  handleMetadataChange(
                    'scheduledFor',
                    value ? mstToUtc(value) : ''
                  );
                }}
                className={styles.input}
                min={getCurrentMstMin()}
                required
              />
              <p className={styles.helpText}>
                Enter time in Mountain Standard Time (MST). Post will be
                automatically published at this time (stored as UTC internally).
              </p>
            </div>
          )}
        </div>

        <div className={styles.editor}>
          {previewMode ? (
            <div className={styles.preview}>
              <div
                className={styles.previewContent}
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(post.content),
                }}
              />
            </div>
          ) : (
            <textarea
              ref={contentRef}
              placeholder={`Write your blog post content here...

You can use Markdown formatting:

# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
\`Inline code\`

\`\`\`javascript
// Code blocks
console.log('Hello, world!');
\`\`\`

- Bullet point
- Another point

1. Numbered list
2. Another item

[Link text](https://example.com)

> Blockquote

---

Horizontal rule

Use Ctrl/Cmd + S to save, Ctrl/Cmd + P to toggle preview.

💡 Tips for smooth workflow:
• Click 'Import' to import .md files
• Use 'Export' to download your content as markdown
• Fill out metadata in the sidebar to organize your posts`}
              value={post.content}
              onChange={e => handleContentChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              className={styles.content}
            />
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.helpText}>
            Ctrl/Cmd + S to save • Ctrl/Cmd + P to toggle preview
          </span>
        </div>
        <div className={styles.footerRight}>
          <span className={styles.status}>
            {post.status === 'draft'
              ? 'Draft'
              : post.status === 'scheduled'
                ? `Scheduled for ${post.scheduledFor}`
                : 'Published'}
          </span>
        </div>
      </div>
    </div>
  );
}
