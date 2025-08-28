// Simple markdown to HTML converter without external dependencies
// Supports basic markdown syntax commonly used in blog posts

export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
    const lang = language ? ` class="language-${language}"` : "";
    return `<pre><code${lang}>${code.trim()}</code></pre>`;
  });

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, "<blockquote><p>$1</p></blockquote>");

  // Horizontal rules
  html = html.replace(/^---$/gim, "<hr>");

  // Lists - Unordered
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

  // Lists - Ordered
  html = html.replace(/^\d+\. (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, (match) => {
    // Only wrap in <ol> if not already wrapped in <ul>
    return match.includes("<ul>") ? match : `<ol>${match}</ol>`;
  });

  // Paragraphs - split on double newlines and wrap non-empty lines
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return "";

      // Don't wrap if already wrapped in HTML tags
      if (trimmed.match(/^<(h[1-6]|ul|ol|blockquote|pre|hr)/)) {
        return trimmed;
      }

      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .filter((p) => p)
    .join("\n\n");

  return html;
}

// Simple function to extract plain text for excerpts
export function extractPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

// Generate excerpt from content
export function generateExcerpt(
  content: string,
  maxLength: number = 150,
): string {
  const plainText = extractPlainText(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0
    ? truncated.slice(0, lastSpace) + "..."
    : truncated + "...";
}
