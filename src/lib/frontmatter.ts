export interface ParsedFrontmatter {
  metadata: Record<string, unknown>;
  content: string;
}

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const [, frontmatter, bodyContent] = match;
  const metadata: Record<string, unknown> = {};

  // Simple YAML parser for your specific format
  frontmatter!.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (!key || !value) return;

    // Handle arrays - support both formats: ["item1", "item2"] and [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        // First try parsing as JSON
        metadata[key] = JSON.parse(value);
      } catch {
        // If JSON parsing fails, try manual array parsing
        const arrayContent = value.slice(1, -1).trim();
        if (arrayContent) {
          metadata[key] = arrayContent
            .split(',')
            .map(item => item.trim().replace(/^["']|["']$/g, ''));
        } else {
          metadata[key] = [];
        }
      }
    } else if (value.startsWith('["') || value.startsWith("['")) {
      // Handle multi-line arrays (your tags format)
      try {
        metadata[key] = JSON.parse(value);
      } catch {
        metadata[key] = value;
      }
    } else {
      // Handle regular values - remove quotes if present
      metadata[key] = value.replace(/^["']|["']$/g, '');
    }
  });

  return { metadata, content: bodyContent!.trim() };
}

export function stripFrontmatter(content: string): string {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  return content.replace(frontmatterRegex, '').trim();
}

export function createFrontmatter(metadata: Record<string, unknown>): string {
  const lines = ['---'];

  Object.entries(metadata).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      // Format arrays as JSON
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else if (
      typeof value === 'string' &&
      (value.includes(':') || value.includes('"'))
    ) {
      // Quote strings that contain special characters
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  });

  lines.push('---', '');
  return lines.join('\n');
}
