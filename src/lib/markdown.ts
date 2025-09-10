// Enhanced markdown to HTML converter with syntax highlighting support
// Supports basic markdown syntax commonly used in blog posts

export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML entities to prevent XSS
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Code blocks MUST be processed first to avoid interference with other patterns
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
    // Only escape < and > in code blocks to prevent HTML injection, but preserve quotes
    const safeCode = code
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const lang = language ? ` class="language-${language.toLowerCase()}"` : '';
    return `<pre><code${lang}>${safeCode}</code></pre>`;
  });

  // Inline code (process after code blocks)
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold (process before italic to handle overlaps)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Blockquotes (improved to handle multiple lines)
  html = html.replace(/^> (.*)$/gim, '<blockquote><p>$1</p></blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr>');

  // Lists - Unordered (improved regex)
  html = html.replace(/^[-*+] (.*)$/gim, '<li>$1</li>');

  // Lists - Ordered
  html = html.replace(/^\d+\. (.*)$/gim, '<li>$1</li>');

  // Wrap consecutive list items in ul/ol tags
  html = html.replace(/(<li>.*<\/li>\s*)+/gs, match => {
    // Check if this comes from ordered list pattern (contains numbers)
    const hasOrderedPattern = /^\d+\./.test(
      markdown
        .split('\n')
        .find(
          line =>
            line.trim().startsWith('1.') ||
            line.trim().startsWith('2.') ||
            line.trim().startsWith('3.')
        ) || ''
    );

    return hasOrderedPattern ? `<ol>${match}</ol>` : `<ul>${match}</ul>`;
  });

  // Paragraphs - split on double newlines and wrap non-empty lines
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(paragraph => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';

      // Don't wrap if already wrapped in HTML tags
      if (trimmed.match(/^<(h[1-6]|ul|ol|blockquote|pre|hr|li)/)) {
        return trimmed;
      }

      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(p => p)
    .join('\n\n');

  return html;
}

// Simple function to extract plain text for excerpts
export function extractPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Generate excerpt from content
export function generateExcerpt(
  content: string,
  maxLength: number = 150
): string {
  const plainText = extractPlainText(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0
    ? truncated.slice(0, lastSpace) + '...'
    : truncated + '...';
}
