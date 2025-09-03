---
title: 'Content Management Workflows: From Draft to Published via Scheduled Automation'
author: 'Zach Liibbe'
publishedAt: ''
status: 'draft'
categories: ['Development', 'Learning']
tags:
  [
    'content-management',
    'workflow',
    'automation',
    'scheduling',
    'vercel-cron',
    'publishing',
    'cms',
  ]
series: 'Learning in Public'
excerpt: 'Building a complete content management workflow with draft states, scheduled publishing, and automated workflows. How I created a publishing system that handles everything from initial drafts to automated publication with Vercel Cron jobs.'
readTime: '14 min read'
---

# Content Management Workflows: From Draft to Published via Scheduled Automation

"I want to write when I'm inspired and publish when it makes sense." That simple requirement led me to build a sophisticated content management system with multiple draft states, scheduled publishing, and automated workflows. What started as a basic blog became a complete editorial pipeline that handles everything from initial ideas to automated publication.

Here's how I built a content workflow that lets me write freely while maintaining a consistent publishing schedule.

## The Problem: Writing vs Publishing Don't Align

My writing process was chaotic:

- Ideas came at random times
- First drafts were terrible and needed multiple revisions
- Good publishing times didn't match when I had time to write
- I'd forget to publish scheduled content
- No way to see my content pipeline at a glance

I needed a system that separated content creation from content publication.

## The Solution: Three-State Content Pipeline

I designed a workflow with three distinct states:

1. **Draft**: Work in progress, private, can be messy
2. **Scheduled**: Ready to publish, waiting for the right time
3. **Published**: Live on the website, public, indexed by search engines

Each state had different requirements and behaviors.

## State Management Architecture

The foundation was a robust state management system:

```typescript
// Core blog post interface with workflow states
interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  content: string;
  categories: string[];
  tags: string[];
  readTime: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: string; // ISO string for scheduled posts
  series?: string;
  featuredImage?: FeaturedImage;
  mediumUrl?: string; // For cross-posting tracking
  createdAt: string;
  updatedAt: string;
}

// Storage structure mirrors the states
const BLOG_DATA_DIR = path.join(process.cwd(), 'src', 'content', 'blog-data');
const DRAFTS_FILE = path.join(BLOG_DATA_DIR, 'drafts.json');
const SCHEDULED_FILE = path.join(BLOG_DATA_DIR, 'scheduled.json');
const PUBLISHED_FILE = path.join(BLOG_DATA_DIR, 'published.json');
```

This separation allowed each state to have different behaviors and optimizations.

## Draft Management: Freedom to Experiment

Drafts needed to be flexible and forgiving:

```typescript
export async function createDraft(
  initialData: Partial<BlogPost>
): Promise<BlogPost> {
  const draft: BlogPost = {
    id: generateId(),
    slug: generateSlug(initialData.title || 'untitled'),
    title: initialData.title || 'Untitled Draft',
    author: 'Zach Liibbe',
    publishedAt: '', // Empty for drafts
    excerpt: initialData.excerpt || '',
    content: initialData.content || '',
    categories: initialData.categories || [],
    tags: initialData.tags || [],
    readTime: calculateReadingTime(initialData.content || ''),
    status: 'draft',
    scheduledFor: undefined,
    series: initialData.series,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to drafts collection
  const drafts = await getAllDrafts();
  drafts.push(draft);
  await savePostsToFile(DRAFTS_FILE, drafts);

  return draft;
}

// Auto-save for drafts (every 30 seconds)
export async function autoSaveDraft(
  draftId: string,
  content: Partial<BlogPost>
): Promise<void> {
  const drafts = await getAllDrafts();
  const draftIndex = drafts.findIndex(d => d.id === draftId);

  if (draftIndex !== -1) {
    drafts[draftIndex] = {
      ...drafts[draftIndex],
      ...content,
      updatedAt: new Date().toISOString(),
    };

    await savePostsToFile(DRAFTS_FILE, drafts);
  }
}
```

Drafts could be messy, incomplete, and experimental without affecting the published site.

## Scheduling System: Planning Ahead

The scheduling system let me plan content weeks in advance:

```typescript
export async function schedulePost(
  draftId: string,
  scheduledFor: string
): Promise<BlogPost> {
  // Move from drafts to scheduled
  const drafts = await getAllDrafts();
  const draftIndex = drafts.findIndex(d => d.id === draftId);

  if (draftIndex === -1) {
    throw new Error('Draft not found');
  }

  const post = drafts[draftIndex];

  // Validate scheduling
  const scheduledDate = new Date(scheduledFor);
  if (scheduledDate <= new Date()) {
    throw new Error('Scheduled date must be in the future');
  }

  // Create scheduled post
  const scheduledPost: BlogPost = {
    ...post,
    status: 'scheduled',
    scheduledFor,
    updatedAt: new Date().toISOString(),
  };

  // Move between collections
  const scheduled = await getAllScheduledPosts();
  scheduled.push(scheduledPost);

  // Remove from drafts
  drafts.splice(draftIndex, 1);

  // Save both files
  await Promise.all([
    savePostsToFile(SCHEDULED_FILE, scheduled),
    savePostsToFile(DRAFTS_FILE, drafts),
  ]);

  return scheduledPost;
}
```

This gave me a clear pipeline view of upcoming content.

## Automated Publishing with Vercel Cron

The magic happened with automated publishing using Vercel Cron jobs:

```typescript
// /src/app/api/admin/cron/publish/route.ts
export async function POST(request: NextRequest) {
  // Verify this is a legitimate cron request
  const cronSecret = request.headers.get('authorization');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scheduledPosts = await getAllScheduledPosts();
    const now = new Date();

    // Find posts ready to publish
    const postsToPublish = scheduledPosts.filter(post => {
      if (!post.scheduledFor) return false;
      const scheduledDate = new Date(post.scheduledFor);
      return scheduledDate <= now;
    });

    console.log(`Found ${postsToPublish.length} posts ready to publish`);

    const publishedPosts = [];

    for (const post of postsToPublish) {
      try {
        // Move from scheduled to published
        const publishedPost = await publishScheduledPost(post);
        publishedPosts.push(publishedPost);

        console.log(`Successfully published: ${post.title}`);
      } catch (error) {
        console.error(`Failed to publish post ${post.slug}:`, error);
        // Continue with other posts even if one fails
      }
    }

    // Revalidate affected paths
    if (publishedPosts.length > 0) {
      await revalidatePaths(publishedPosts);
    }

    return NextResponse.json({
      success: true,
      publishedCount: publishedPosts.length,
      publishedPosts: publishedPosts.map(p => ({
        slug: p.slug,
        title: p.title,
        publishedAt: p.publishedAt,
      })),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled posts' },
      { status: 500 }
    );
  }
}

async function publishScheduledPost(post: BlogPost): Promise<BlogPost> {
  // Create published version
  const publishedPost: BlogPost = {
    ...post,
    status: 'published',
    publishedAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  };

  // Update collections
  const [scheduled, published] = await Promise.all([
    getAllScheduledPosts(),
    getAllPublishedPosts(),
  ]);

  // Remove from scheduled
  const updatedScheduled = scheduled.filter(p => p.id !== post.id);

  // Add to published
  published.push(publishedPost);

  // Save both collections
  await Promise.all([
    savePostsToFile(SCHEDULED_FILE, updatedScheduled),
    savePostsToFile(PUBLISHED_FILE, published),
  ]);

  return publishedPost;
}
```

The cron job configuration in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/cron/publish",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This published content automatically at 9 AM every day.

## Admin Interface: Visual Pipeline Management

The admin interface needed to show the entire content pipeline:

```typescript
type TabType = 'all' | 'published' | 'drafts' | 'scheduled';

export default function BlogAdmin({ session }: BlogAdminProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState({
    drafts: 0,
    scheduled: 0,
    published: 0,
  });

  // Load posts based on active tab
  useEffect(() => {
    loadPosts();
  }, [activeTab]);

  const loadPosts = async () => {
    try {
      const response = await fetch(`/api/blog/posts?status=${activeTab}`);
      const data = await response.json();
      setPosts(data.posts);

      // Update stats
      const statsResponse = await fetch('/api/admin/blog/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Tab navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Posts ({stats.drafts + stats.scheduled + stats.published})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'drafts' ? styles.active : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          Drafts ({stats.drafts})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'scheduled' ? styles.active : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled ({stats.scheduled})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'published' ? styles.active : ''}`}
          onClick={() => setActiveTab('published')}
        >
          Published ({stats.published})
        </button>
      </div>

      {/* Post list with status indicators */}
      <div className={styles.postList}>
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={handleEditPost}
            onSchedule={handleSchedulePost}
            onPublish={handlePublishPost}
            onDelete={handleDeletePost}
          />
        ))}
      </div>
    </div>
  );
}
```

This gave me a clear view of my entire content pipeline.

## Status Transitions and Validation

Moving between states required validation and careful data handling:

```typescript
interface StateTransition {
  from: BlogPost['status'];
  to: BlogPost['status'];
  validator: (post: BlogPost) => { valid: boolean; errors: string[] };
}

const stateTransitions: StateTransition[] = [
  {
    from: 'draft',
    to: 'scheduled',
    validator: post => {
      const errors: string[] = [];

      if (!post.title.trim()) errors.push('Title is required');
      if (!post.content.trim()) errors.push('Content is required');
      if (!post.excerpt.trim()) errors.push('Excerpt is required');
      if (post.categories.length === 0)
        errors.push('At least one category is required');
      if (!post.scheduledFor) errors.push('Scheduled date is required');

      const scheduledDate = new Date(post.scheduledFor || '');
      if (scheduledDate <= new Date()) {
        errors.push('Scheduled date must be in the future');
      }

      return { valid: errors.length === 0, errors };
    },
  },
  {
    from: 'scheduled',
    to: 'published',
    validator: post => {
      // Additional checks for publishing
      const errors: string[] = [];

      if (post.content.length < 500) {
        errors.push('Content seems too short for publication');
      }

      if (!post.featuredImage) {
        errors.push('Featured image recommended for better engagement');
      }

      return { valid: errors.length === 0, errors };
    },
  },
  {
    from: 'draft',
    to: 'published',
    validator: post => {
      // Direct draft to published (immediate publishing)
      const errors: string[] = [];

      if (!post.title.trim()) errors.push('Title is required');
      if (!post.content.trim()) errors.push('Content is required');
      if (!post.excerpt.trim()) errors.push('Excerpt is required');
      if (post.categories.length === 0)
        errors.push('At least one category is required');

      return { valid: errors.length === 0, errors };
    },
  },
];

export async function changePostStatus(
  postId: string,
  newStatus: BlogPost['status'],
  additionalData?: Partial<BlogPost>
): Promise<BlogPost> {
  // Find the post in current state
  const post = await findPostById(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  // Find and validate transition
  const transition = stateTransitions.find(
    t => t.from === post.status && t.to === newStatus
  );

  if (!transition) {
    throw new Error(`Invalid state transition: ${post.status} -> ${newStatus}`);
  }

  const validation = transition.validator({ ...post, ...additionalData });
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Perform the state transition
  return await executeStateTransition(post, newStatus, additionalData);
}
```

This prevented invalid state transitions and ensured content quality.

## Content Calendar and Planning

I built a calendar view to visualize my publishing schedule:

```typescript
interface CalendarEvent {
  date: string;
  posts: BlogPost[];
  type: 'scheduled' | 'published';
}

export function ContentCalendar() {
  const [calendarData, setCalendarData] = useState<CalendarEvent[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadCalendarData();
  }, [selectedMonth]);

  const loadCalendarData = async () => {
    const startDate = startOfMonth(selectedMonth);
    const endDate = endOfMonth(selectedMonth);

    const [scheduled, published] = await Promise.all([
      fetch(`/api/blog/posts?status=scheduled&after=${startDate.toISOString()}&before=${endDate.toISOString()}`),
      fetch(`/api/blog/posts?status=published&after=${startDate.toISOString()}&before=${endDate.toISOString()}`),
    ]);

    const scheduledPosts = await scheduled.json();
    const publishedPosts = await published.json();

    // Group by date
    const eventMap = new Map<string, CalendarEvent>();

    scheduledPosts.posts.forEach((post: BlogPost) => {
      const date = post.scheduledFor?.split('T')[0];
      if (date) {
        const existing = eventMap.get(date) || { date, posts: [], type: 'scheduled' };
        existing.posts.push(post);
        eventMap.set(date, existing);
      }
    });

    publishedPosts.posts.forEach((post: BlogPost) => {
      const date = post.publishedAt;
      if (date) {
        const existing = eventMap.get(date) || { date, posts: [], type: 'published' };
        existing.posts.push(post);
        eventMap.set(date, existing);
      }
    });

    setCalendarData(Array.from(eventMap.values()));
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
          ← Previous
        </button>
        <h2>{format(selectedMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
          Next →
        </button>
      </div>

      <div className={styles.calendarGrid}>
        {eachDayOfInterval({
          start: startOfWeek(startOfMonth(selectedMonth)),
          end: endOfWeek(endOfMonth(selectedMonth)),
        }).map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const events = calendarData.filter(event => event.date === dateStr);

          return (
            <div
              key={dateStr}
              className={`${styles.calendarDay} ${
                !isSameMonth(day, selectedMonth) ? styles.otherMonth : ''
              }`}
            >
              <div className={styles.dayNumber}>{format(day, 'd')}</div>
              {events.map(event => (
                <div
                  key={event.date}
                  className={`${styles.event} ${styles[event.type]}`}
                >
                  {event.posts.length === 1
                    ? event.posts[0].title
                    : `${event.posts.length} posts`}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

This helped me visualize my publishing schedule and identify gaps.

## Analytics and Performance Tracking

I tracked the performance of my publishing workflow:

```typescript
interface WorkflowMetrics {
  draftsCreated: number;
  postsScheduled: number;
  postsPublished: number;
  averageDraftToPublish: number; // days
  automatedPublications: number;
  manualPublications: number;
}

export async function getWorkflowMetrics(
  startDate: Date,
  endDate: Date
): Promise<WorkflowMetrics> {
  const [drafts, scheduled, published] = await Promise.all([
    getAllDrafts(),
    getAllScheduledPosts(),
    getAllPublishedPosts(),
  ]);

  const filteredPublished = published.filter(post => {
    const publishedDate = new Date(post.publishedAt);
    return publishedDate >= startDate && publishedDate <= endDate;
  });

  // Calculate average time from draft to publish
  const draftToPublishTimes = filteredPublished
    .map(post => {
      const created = new Date(post.createdAt);
      const published = new Date(post.publishedAt);
      return (published.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    })
    .filter(days => days > 0);

  const averageDraftToPublish =
    draftToPublishTimes.length > 0
      ? draftToPublishTimes.reduce((sum, days) => sum + days, 0) /
        draftToPublishTimes.length
      : 0;

  // Count automated vs manual publications
  const automatedPublications = filteredPublished.filter(
    post =>
      post.scheduledFor &&
      new Date(post.scheduledFor) <= new Date(post.publishedAt)
  ).length;

  return {
    draftsCreated: drafts.length,
    postsScheduled: scheduled.length,
    postsPublished: filteredPublished.length,
    averageDraftToPublish: Math.round(averageDraftToPublish),
    automatedPublications,
    manualPublications: filteredPublished.length - automatedPublications,
  };
}
```

This helped me understand and optimize my content workflow.

## Real-World Results

After implementing the complete workflow system:

- **Content consistency**: Published 2-3 posts per week automatically
- **Writing freedom**: Could write when inspired, publish when optimal
- **Quality improvement**: Review cycles between draft and scheduled caught issues
- **Time savings**: 80% reduction in manual publishing tasks
- **Planning visibility**: Clear view of content pipeline weeks in advance

## Lessons Learned

1. **State separation is powerful**: Different states need different behaviors
2. **Automation should be reliable**: Cron jobs need robust error handling
3. **Validation prevents embarrassment**: Check content quality before publishing
4. **Visual pipelines help planning**: Calendar and list views serve different purposes
5. **Metrics drive improvement**: Understanding workflow efficiency enables optimization

## What I'd Do Differently

Looking back, I would:

- **Add more sophisticated scheduling** (multiple time zones, social media integration)
- **Implement collaborative features** (comments, review workflows)
- **Build better analytics** (reader engagement, topic performance)
- **Add notification systems** (Slack alerts for published posts)
- **Create content templates** (different post types, series templates)

## The Bigger Picture

Building this content management workflow taught me that **good systems amplify creativity by removing friction**. When the technical aspects of publishing are automated and reliable, you can focus on what matters: creating great content.

The best content management systems disappear into the background, enabling creators to focus on creation rather than administration.

The complete content management system is available in my [GitHub repository](https://github.com/zliibbe/zachliibbe.com), and you can see it in action in my [admin interface](https://zachliibbe.com/admin/blog).

---

_Great content workflows balance creative freedom with operational discipline. Want to see more stories about building systems that enable creativity? Follow my journey as I share the real challenges of scaling content creation._
