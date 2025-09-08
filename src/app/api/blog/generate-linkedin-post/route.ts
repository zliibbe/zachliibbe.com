import { NextRequest, NextResponse } from 'next/server';

interface LinkedInPostRequest {
  slug: string;
  title: string;
  excerpt: string;
  categories: string[];
  tags: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { slug, title, excerpt, categories, tags }: LinkedInPostRequest = 
      await request.json();

    if (!slug || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: slug and title' },
        { status: 400 }
      );
    }

    // Generate the LinkedIn post content
    const linkedInPost = generateLinkedInPost({
      slug,
      title,
      excerpt,
      categories,
      tags,
    });

    return NextResponse.json({ 
      post: linkedInPost,
      characterCount: linkedInPost.length,
      success: true 
    });
  } catch (error) {
    console.error('Error generating LinkedIn post:', error);
    return NextResponse.json(
      { error: 'Failed to generate LinkedIn post' },
      { status: 500 }
    );
  }
}

function generateLinkedInPost({
  slug,
  title,
  excerpt,
  categories,
  tags,
}: LinkedInPostRequest): string {
  const blogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://zachliibbe.com'}/blog/${slug}`;
  
  // Get category-specific hook
  const primaryCategory = categories[0] || '';
  const hook = getCategoryHook(primaryCategory);
  
  // Generate engaging opening based on category
  const opening = generateOpening(primaryCategory, title);
  
  // Create value proposition
  const valueStatement = generateValueStatement(excerpt, primaryCategory);
  
  // Generate hashtags (max 5, cleaned)
  const hashtags = generateHashtags(tags, categories);
  
  // Construct the post
  const parts = [
    hook,
    '',
    opening,
    '',
    valueStatement,
    '',
    `Read the full post: ${blogUrl}`,
    '',
    hashtags
  ];
  
  return parts.join('\n').trim();
}

function getCategoryHook(category: string): string {
  const hooks = {
    'Development': '💻 Just shipped some thoughts on development...',
    'Personal': '🌱 Sharing some personal insights:',
    'Learning': '📚 Recently learned something worth sharing:',
    'Projects': '🚀 Exciting project update:',
  };
  
  return hooks[category as keyof typeof hooks] || '✨ New thoughts from the blog:';
}

function generateOpening(category: string, title: string): string {
  const templates = {
    'Development': [
      `Working on ${title.toLowerCase()} got me thinking...`,
      `Here's what I discovered about ${title.toLowerCase()}:`,
      `Key insights from my work with ${title.toLowerCase()}:`,
    ],
    'Personal': [
      `Reflecting on ${title.toLowerCase()}...`,
      `Some thoughts on ${title.toLowerCase()}:`,
      `Personal take on ${title.toLowerCase()}:`,
    ],
    'Learning': [
      `Deep dive into ${title.toLowerCase()}:`,
      `What I learned about ${title.toLowerCase()}:`,
      `Breaking down ${title.toLowerCase()}:`,
    ],
    'Projects': [
      `Latest project work: ${title}`,
      `Building ${title.toLowerCase()} - here's what I learned:`,
      `Project update: ${title}`,
    ],
  };
  
  const categoryTemplates = templates[category as keyof typeof templates] || [
    `New post: ${title}`,
    `Thoughts on ${title.toLowerCase()}:`,
    `Exploring ${title.toLowerCase()}:`,
  ];
  
  // Pick a random template for variety
  return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
}

function generateValueStatement(excerpt: string, category: string): string {
  if (!excerpt || excerpt.length < 50) {
    const fallbacks = {
      'Development': 'Practical insights from real-world development work.',
      'Personal': 'Personal reflections and lessons learned.',
      'Learning': 'Key takeaways and practical applications.',
      'Projects': 'Behind-the-scenes look at the development process.',
    };
    
    return fallbacks[category as keyof typeof fallbacks] || 
           'Insights and practical takeaways from experience.';
  }
  
  // Use the excerpt but ensure it's concise for LinkedIn
  let statement = excerpt.trim();
  
  // If excerpt is too long, truncate it smartly
  if (statement.length > 200) {
    const sentences = statement.split('. ');
    statement = sentences[0];
    if (statement.length > 150) {
      statement = statement.substring(0, 147) + '...';
    } else {
      statement += '.';
    }
  }
  
  return statement;
}

function generateHashtags(tags: string[], categories: string[]): string {
  const allTerms = [...categories, ...tags];
  
  // Clean and format hashtags
  const cleanedHashtags = allTerms
    .slice(0, 5) // Limit to 5 hashtags
    .map(term => term.replace(/[^a-zA-Z0-9\s]/g, '')) // Remove special chars
    .map(term => term.replace(/\s+/g, '')) // Remove spaces
    .filter(term => term.length > 0) // Remove empty strings
    .map(term => `#${term}`)
    .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
  
  // Add some general tech hashtags if we have room
  const generalHashtags = ['#webdevelopment', '#coding', '#learning', '#tech'];
  const remainingSlots = 5 - cleanedHashtags.length;
  
  if (remainingSlots > 0) {
    generalHashtags
      .slice(0, remainingSlots)
      .forEach(tag => {
        if (!cleanedHashtags.includes(tag)) {
          cleanedHashtags.push(tag);
        }
      });
  }
  
  return cleanedHashtags.join(' ');
}