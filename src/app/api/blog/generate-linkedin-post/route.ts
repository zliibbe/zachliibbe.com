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
      success: true,
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
    hashtags,
  ];

  return parts.join('\n').trim();
}

function getCategoryHook(category: string): string {
  const hooks = {
    Development: [
      'Most developers make this mistake. I did too.',
      "After 5 years of coding, here's what I wish I knew earlier:",
      "95% of developers struggle with this. Here's the solution:",
      'This coding practice changed everything for me.',
      'I used to hate debugging. Then I learned this:',
      "Every developer should know this (but most don't):",
      'The one thing that made me a better developer overnight:',
    ],
    Personal: [
      'I was ready to quit... until this happened:',
      'This personal realization changed my entire approach:',
      'I wish someone had told me this 5 years ago:',
      'The uncomfortable truth about personal growth:',
      'This mindset shift transformed my career:',
      'I used to believe this myth. I was wrong:',
      'The moment everything clicked for me:',
    ],
    Learning: [
      "I spent 100 hours learning this. Here's what matters:",
      "Most people learn this wrong. Here's the right way:",
      "This learning method 10x'd my progress:",
      'I wish I knew these 3 things before starting:',
      'Everyone talks about this, but misses the key point:',
      'The fastest way to master this skill:',
      "I failed at this 5 times. Here's what finally worked:",
    ],
    Projects: [
      'This project taught me more than any course:',
      'I thought this project would be easy. I was wrong:',
      "6 months of work. Here's what I learned:",
      'This side project became my biggest breakthrough:',
      'The project that changed my perspective:',
      'Building this taught me 3 crucial lessons:',
      "I almost gave up on this project. Here's why I'm glad I didn't:",
    ],
  };

  const categoryHooks = hooks[category as keyof typeof hooks] || [
    'This insight changed everything for me:',
    'I wish I knew this earlier:',
    'The one thing that made all the difference:',
    'This realization hit me hard:',
    "Here's what everyone gets wrong about this:",
  ];

  // Return a random hook from the category
  return categoryHooks[Math.floor(Math.random() * categoryHooks.length)];
}

function generateOpening(category: string, title: string): string {
  const templates = {
    Development: [
      `The truth about ${title.toLowerCase()} that no one talks about:`,
      `I made every mistake possible with ${title.toLowerCase()}. Here's what I learned:`,
      `${title} isn't what you think it is. Here's why:`,
      `Everyone does ${title.toLowerCase()} wrong. Here's the right approach:`,
      `This approach to ${title.toLowerCase()} changed everything:`,
      `The ${title.toLowerCase()} breakthrough that took me 3 months to figure out:`,
    ],
    Personal: [
      `The hard truth about ${title.toLowerCase()} that changed my perspective:`,
      `I used to struggle with ${title.toLowerCase()}. Then I realized this:`,
      `${title} taught me something I never expected:`,
      `The uncomfortable reality of ${title.toLowerCase()}:`,
      `My biggest mistake with ${title.toLowerCase()} (and how to avoid it):`,
      `Why everything I thought about ${title.toLowerCase()} was wrong:`,
    ],
    Learning: [
      `I spent months trying to understand ${title.toLowerCase()}. Here's the shortcut:`,
      `The ${title.toLowerCase()} mistake that costs everyone time:`,
      `Why most people fail at ${title.toLowerCase()} (and how to succeed):`,
      `The ${title.toLowerCase()} strategy that actually works:`,
      `I wish someone had explained ${title.toLowerCase()} like this:`,
      `The counterintuitive truth about ${title.toLowerCase()}:`,
    ],
    Projects: [
      `${title} almost broke me. Here's what saved the project:`,
      `The ${title.toLowerCase()} decision that changed everything:`,
      `What ${title.toLowerCase()} taught me about building products:`,
      `I thought ${title.toLowerCase()} would be simple. I was so wrong:`,
      `The ${title.toLowerCase()} challenge that made me a better developer:`,
      `Behind the scenes of ${title.toLowerCase()}: What really happened:`,
    ],
  };

  const categoryTemplates = templates[category as keyof typeof templates] || [
    `The surprising truth about ${title.toLowerCase()}:`,
    `What ${title.toLowerCase()} taught me:`,
    `The ${title.toLowerCase()} insight that changed my approach:`,
    `Why ${title.toLowerCase()} matters more than you think:`,
    `The hidden complexity of ${title.toLowerCase()}:`,
  ];

  // Pick a random template for variety
  return categoryTemplates[
    Math.floor(Math.random() * categoryTemplates.length)
  ];
}

function generateValueStatement(excerpt: string, category: string): string {
  if (!excerpt || excerpt.length < 50) {
    const fallbacks = {
      Development: 'Practical insights from real-world development work.',
      Personal: 'Personal reflections and lessons learned.',
      Learning: 'Key takeaways and practical applications.',
      Projects: 'Behind-the-scenes look at the development process.',
    };

    return (
      fallbacks[category as keyof typeof fallbacks] ||
      'Insights and practical takeaways from experience.'
    );
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
    generalHashtags.slice(0, remainingSlots).forEach(tag => {
      if (!cleanedHashtags.includes(tag)) {
        cleanedHashtags.push(tag);
      }
    });
  }

  return cleanedHashtags.join(' ');
}
