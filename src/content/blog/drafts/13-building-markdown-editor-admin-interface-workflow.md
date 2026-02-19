---
title: 'Building a Markdown Editor That Doesn't Suck: Admin Interface and Writing Workflow'
author: 'Zach Liibbe'
publishedAt: ''
status: 'draft'
categories: ['Development', 'Learning']
tags:
  [
    'markdown',
    'editor',
    'admin-interface',
    'content-management',
    'react',
    'user-experience',
    'writing-workflow',
  ]
series: 'Learning in Public'
excerpt: 'Building a markdown editor for my blog admin interface taught me everything about balancing writer experience, live preview, and the dark art of textarea manipulation. How I created a writing environment that feels like a native app.'
readTime: '13 min read'
---

# Building a Markdown Editor That Doesn't Suck: Admin Interface and Writing Workflow

"I just need a simple markdown editor." Famous last words that led me down a rabbit hole of textarea manipulation, keyboard shortcuts, live preview synchronization, and the surprisingly complex world of content management workflows. What started as a basic text input evolved into a sophisticated writing environment that handles everything from file imports to Medium cross-posting.

Here's how I built a markdown editor that actually enhances the writing experience instead of fighting against it.

## The Problem: Existing Solutions Weren't Right

I tried several existing markdown editors:

- **CodeMirror**: Powerful but heavyweight, felt like coding not writing
- **TinyMCE**: WYSIWYG approach that fought against markdown
- **Simple textarea**: Fast but no features, terrible for long content

None felt right for my workflow. I needed something that:

- Felt like a native writing app
- Had live preview that actually synced
- Handled keyboard shortcuts intuitively
- Could import/export markdown files seamlessly
- Supported my specific metadata needs (categories, tags, series)

So I built my own.

## The Foundation: Enhanced Textarea

I started with a textarea but immediately hit limitations. The key insight was treating it not as a form field but as the foundation for a complete writing environment:

```typescript
export default function MarkdownEditor({
  initialPost,
  onSave,
  onCancel,
}: MarkdownEditorProps) {
  const [post, setPost] = useState<BlogPost>({
    title: initialPost?.title || '',
    author: 'Zach Liibbe',
    publishedAt: initialPost?.publishedAt || new Date().toISOString().split('T')[0],
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
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // This became the heart of the editor
  const handleContentChange = (content: string) => {
    setPost(prev => ({ ...prev, content }));
  };
```

The state management was crucial—everything needed to be reactive and immediate.

## Keyboard Shortcuts: Making It Feel Native

The first thing that separates good editors from bad ones is keyboard shortcuts. I needed shortcuts that felt intuitive to writers, not just developers:

```typescript
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent) => {
    // Save shortcut (Ctrl/Cmd + S)
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
      return;
    }

    // Preview toggle (Ctrl/Cmd + P)
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault();
      setPreviewMode(prev => !prev);
      return;
    }

    // Bold text (Ctrl/Cmd + B)
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdown('**', '**');
      return;
    }

    // Italic text (Ctrl/Cmd + I)
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdown('*', '*');
      return;
    }

    // Link insertion (Ctrl/Cmd + K)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      insertLink();
      return;
    }

    // Tab handling for code blocks
    if (e.key === 'Tab') {
      e.preventDefault();
      insertTab();
      return;
    }
  },
  [post.content]
);

const insertMarkdown = (before: string, after: string) => {
  const textarea = contentRef.current;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = post.content.substring(start, end);

  const newText = before + selectedText + after;
  const newContent =
    post.content.substring(0, start) + newText + post.content.substring(end);

  handleContentChange(newContent);

  // Restore cursor position
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selectedText.length
    );
  }, 0);
};
```

The cursor position management was tricky—users expect their cursor to end up in the right place after inserting markdown syntax.

## Live Preview: The Synchronization Challenge

Live preview sounds simple until you try to implement it. The challenge isn't just converting markdown to HTML—it's keeping the preview in sync with the editor scroll position and cursor location:

```typescript
const [previewMode, setPreviewMode] = useState(false);

// Calculate reading time in real-time
const calculateReadingTime = useCallback((content: string) => {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}, []);

// The preview implementation
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

Horizontal rule`}
    value={post.content}
    onChange={e => handleContentChange(e.target.value)}
    onPaste={handlePaste}
    onKeyDown={handleKeyDown}
    className={styles.content}
  />
)}
```

The placeholder text became a tutorial—users could see markdown examples right in the editor.

## File Import/Export: Working with Existing Content

Writers often have content in external files. I needed seamless import/export functionality:

```typescript
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

        try {
          // Parse frontmatter using gray-matter
          const { data: frontmatter, content: bodyContent } = matter(content);

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
        } catch (error) {
          console.error('Error parsing frontmatter:', error);
          // Fallback to importing raw content
          handleContentChange(content);
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}, []);

// Export current post as markdown file
const handleExportFile = useCallback(() => {
  const frontmatter = {
    title: post.title,
    author: post.author,
    publishedAt: post.publishedAt,
    status: post.status,
    categories: post.categories,
    tags: post.tags,
    series: post.series || undefined,
    excerpt: post.excerpt,
    readTime: calculateReadingTime(post.content),
    mediumUrl: post.mediumUrl || undefined,
  };

  // Remove undefined values
  const cleanedFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([_, v]) => v !== undefined)
  );

  const frontmatterString = Object.entries(cleanedFrontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: '${value}'`;
    })
    .join('\n');

  const fullContent = `---
${frontmatterString}
---

${post.content}`;

  const blob = new Blob([fullContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${post.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}, [post, calculateReadingTime]);
```

The frontmatter parsing was crucial—I needed to handle the metadata that makes blog posts more than just markdown content.

## Paste Handling: Smart Content Processing

Copy-paste is where most editors break down. Users paste content from various sources—other markdown files, websites, Word documents. I needed smart paste handling:

````typescript
const handlePaste = useCallback(
  (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    const pastedText = clipboardData.getData('text/plain');
    const pastedHtml = clipboardData.getData('text/html');

    // If pasting from a markdown source, preserve formatting
    if (
      pastedText.includes('```') ||
      pastedText.includes('**') ||
      pastedText.includes('##')
    ) {
      // Let the default paste behavior handle markdown
      return;
    }

    // If pasting HTML (from web pages), convert to markdown
    if (pastedHtml && pastedHtml.length > pastedText.length) {
      e.preventDefault();

      // Basic HTML to markdown conversion
      let markdownText = pastedText;

      // Convert common HTML patterns to markdown
      markdownText = markdownText
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

      // Insert the converted markdown
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          post.content.substring(0, start) +
          markdownText +
          post.content.substring(end);

        handleContentChange(newContent);

        // Set cursor position after pasted content
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + markdownText.length,
            start + markdownText.length
          );
        }, 0);
      }
    }
  },
  [post.content]
);
````

This made pasting content from websites much more pleasant—users got markdown instead of plain text.

## Metadata Management: Beyond Just Content

Blog posts need more than just content. The metadata management was as important as the editor itself:

```typescript
const AVAILABLE_CATEGORIES = [
  'Development',
  'Personal',
  'Learning',
  'Projects',
];

// Category management
const handleCategoryChange = (category: string, checked: boolean) => {
  setPost(prev => ({
    ...prev,
    categories: checked
      ? [...prev.categories, category]
      : prev.categories.filter(c => c !== category),
  }));
};

// Tag management with dynamic addition
const addTag = () => {
  if (newTag.trim() && !post.tags.includes(newTag.trim())) {
    setPost(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()],
    }));
    setNewTag('');
  }
};

const removeTag = (tagToRemove: string) => {
  setPost(prev => ({
    ...prev,
    tags: prev.tags.filter(tag => tag !== tagToRemove),
  }));
};

// Status and scheduling
const handleStatusChange = (status: 'draft' | 'scheduled' | 'published') => {
  setPost(prev => ({ ...prev, status }));

  if (status === 'published' && !post.publishedAt) {
    setPost(prev => ({
      ...prev,
      publishedAt: new Date().toISOString().split('T')[0],
    }));
  }
};
```

The metadata UI needed to be as smooth as the content editing experience.

## Auto-save and Recovery: Never Lose Content

Writers hate losing content. I implemented auto-save with visual feedback:

```typescript
const [lastSaved, setLastSaved] = useState<Date | null>(null);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

// Auto-save every 30 seconds
useEffect(() => {
  const autoSave = setInterval(() => {
    if (hasUnsavedChanges) {
      handleSave(true); // silent save
    }
  }, 30000);

  return () => clearInterval(autoSave);
}, [hasUnsavedChanges, post]);

// Track changes
useEffect(() => {
  setHasUnsavedChanges(true);
}, [post]);

const handleSave = async (silent = false) => {
  try {
    await onSave(post);
    setLastSaved(new Date());
    setHasUnsavedChanges(false);

    if (!silent) {
      // Show success feedback
      setNotification({ type: 'success', message: 'Post saved successfully!' });
    }
  } catch (error) {
    setNotification({ type: 'error', message: 'Failed to save post' });
  }
};

// Warn about unsaved changes
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

The auto-save was subtle but crucial for peace of mind.

## Mobile Considerations: Writing on the Go

The editor needed to work on mobile devices, which presented unique challenges:

```css
/* Mobile-optimized editor */
@media (max-width: 768px) {
  .content {
    font-size: 16px; /* Prevent zoom on iOS */
    line-height: 1.6;
    padding: 1rem;
  }

  .toolbar {
    position: sticky;
    top: 0;
    background: var(--background-primary);
    z-index: 10;
    padding: 0.5rem;
  }

  .sidebar {
    order: -1; /* Move metadata above content on mobile */
    margin-bottom: 1rem;
  }
}
```

Mobile users needed larger touch targets and better spacing.

## Performance Optimization: Handling Large Documents

Long blog posts (like this one) stressed the editor. I needed performance optimizations:

```typescript
// Debounce preview updates
const debouncedPreviewUpdate = useMemo(
  () =>
    debounce((content: string) => {
      setPreviewContent(markdownToHtml(content));
    }, 300),
  []
);

useEffect(() => {
  if (previewMode) {
    debouncedPreviewUpdate(post.content);
  }
}, [post.content, previewMode, debouncedPreviewUpdate]);

// Lazy load preview mode
const [previewContent, setPreviewContent] = useState('');

// Only process markdown when actually viewing preview
useEffect(() => {
  if (previewMode && !previewContent) {
    setPreviewContent(markdownToHtml(post.content));
  }
}, [previewMode, post.content, previewContent]);
```

This kept the editor responsive even with 10,000+ word documents.

## Real-World Usage Patterns

After using the editor for months, I discovered actual usage patterns:

- **Writers prefer side-by-side preview** over toggle mode
- **Keyboard shortcuts are essential** for flow state
- **Metadata editing interrupts writing** if not well-designed
- **File import/export is used more than expected**
- **Auto-save reduces anxiety** significantly

## Lessons Learned

1. **Writers aren't developers**: Different mental models and workflows
2. **Keyboard shortcuts make or break the experience**: Muscle memory is everything
3. **File handling is crucial**: Writers work across multiple tools
4. **Performance matters for long content**: Debouncing and lazy loading are essential
5. **Mobile writing is real**: Don't treat it as an afterthought
6. **Auto-save isn't optional**: Writers need confidence their work is safe

## What I'd Do Differently

Looking back, I would:

- **Implement collaborative editing** from the start
- **Add more sophisticated markdown shortcuts** (heading shortcuts, table creation)
- **Build better image handling** within the editor
- **Add word count and writing goals** for motivation
- **Implement better spell checking** integration

## The Bigger Picture

Building a markdown editor taught me that **good writing tools disappear**. The best editor is the one writers don't think about—it just enables their creativity without friction.

Every keyboard shortcut, every auto-save, every smooth animation contributes to maintaining flow state. Bad tools interrupt thinking; good tools enable it.

The complete markdown editor is available in my [GitHub repository](https://github.com/zliibbe/zachliibbe.com), and you can see it in action in my [admin interface](https://zachliibbe.com/admin/blog) (if you're me).

---

_Great writing tools amplify creativity by getting out of the way. Want to see more stories about building better developer and creator experiences? Follow my journey as I share the real challenges of making complex tools feel simple._
