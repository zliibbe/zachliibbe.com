# Admin User Guide for zachliibbe.com

**Version**: 2.5.0  
**Last Updated**: September 2025  
**Admin User**: zliibbe@gmail.com

---

## 🎯 Overview

This guide provides comprehensive documentation for admin users managing content and functionality on zachliibbe.com. The admin interface includes blog management, AI chat knowledge base administration, and system monitoring tools.

## 🔐 Authentication & Access

### Admin Login
- **URL**: `https://zachliibbe.com/admin`
- **Authentication**: Google OAuth (NextAuth.js)
- **Authorized User**: `zliibbe@gmail.com` only
- **Session Duration**: 180 minutes
- **Access Control**: All admin endpoints verify authentication server-side

### Admin Dashboard Features
1. **Blog Management**: Create, edit, and publish blog posts
2. **Chat Knowledge**: Manage AI chat knowledge base content  
3. **Analytics**: View performance metrics (Coming Soon)
4. **Settings**: Site-wide configuration (Coming Soon)

---

## 📝 Blog Management System

### Admin Interface: `/admin/blog`

#### Creating Blog Posts
1. Navigate to Blog Management from admin dashboard
2. Click "Create New Post" 
3. Fill in post metadata (title, categories, tags, etc.)
4. Write content using markdown editor with live preview
5. Select featured image from Unsplash integration
6. Choose publish status: Draft → Scheduled → Published

#### Post Management Workflow
- **Draft**: Auto-saved to Vercel KV, editable, not public
- **Scheduled**: Set publication date/time, automatically published by cron
- **Published**: Live on `/blog`, shareable, generates LinkedIn posts

#### LinkedIn Cross-Posting
- Generate professional LinkedIn posts with 28 proven engagement hooks
- Preview formatted content with character count validation
- Copy-to-clipboard workflow with automatic LinkedIn redirect
- Multiple hook variations for A/B testing

### Public Blog Interface: `/blog`
- Responsive post listing with pagination
- Category and tag filtering
- Text search across titles, excerpts, and metadata
- RSS feed generation at `/api/feed/rss`
- Social sharing (Twitter/X, LinkedIn, Email)

---

## 🤖 AI Chat Knowledge Management

### Knowledge Base Administration: `/admin/knowledge`

#### File Management Interface
- **Overview Tab**: Grid view of all knowledge files with status indicators
- **Editor Tab**: Full markdown editor with live preview toggle
- **Status Tab**: Performance monitoring and cache statistics
- **Testing Tab**: RAG system testing interface

#### Knowledge File Operations

##### Viewing & Editing Files
1. Access knowledge management from admin dashboard
2. Select file from grid view to see metadata and status
3. Click "Edit" to open full markdown editor
4. Use preview toggle to see rendered markdown
5. Auto-save detects changes and prompts before closing
6. Manual save updates file and triggers embedding regeneration

##### File Status Indicators
- **🟢 Current**: Embeddings are up-to-date
- **🟡 Outdated**: File modified since last embedding generation
- **🔴 Missing**: No embeddings found for this file

##### Embedding Management
- **Manual Re-processing**: Trigger embedding regeneration for specific files
- **Bulk Processing**: Regenerate embeddings for all knowledge files
- **Status Monitoring**: Track processing progress and performance metrics

#### RAG System Testing
- **Query Interface**: Test queries against knowledge base
- **Context Visualization**: See retrieved chunks with relevance scores  
- **Response Analysis**: View AI responses with performance metrics
- **Example Queries**: Pre-built test queries for common scenarios

### Knowledge Base Structure
```
/src/data/knowledge/
├── professional.md     # Work experience, skills, projects
├── contact.md          # Communication preferences, availability  
├── personal.md         # Interests, philosophy, approach
└── projects.md         # Detailed project information
```

---

## 🔌 API Reference

### Authentication
All admin endpoints require valid NextAuth.js session with `zliibbe@gmail.com` email.

### Blog Management APIs

#### `GET /api/admin/blog/posts`
**Purpose**: Retrieve all blog posts for admin management  
**Authentication**: Required  
**Response**: Array of blog posts with metadata and storage information
```typescript
{
  posts: BlogPost[]
}
```

#### `POST /api/blog/posts`
**Purpose**: Create new blog post  
**Authentication**: Required  
**Request Body**:
```typescript
{
  title: string;
  content: string;        // Markdown content
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  series?: string;
  status?: 'draft' | 'scheduled' | 'published';
  scheduledFor?: string;  // ISO date string
  publishedAt?: string;
  author?: string;
}
```

#### `GET /api/blog/posts/[slug]`
**Purpose**: Retrieve specific blog post by slug  
**Authentication**: Required for drafts, public for published posts  
**Response**: Complete blog post with content and metadata

#### `PUT /api/blog/posts/[slug]`
**Purpose**: Update existing blog post  
**Authentication**: Required  
**Request Body**: Same as POST `/api/blog/posts`

#### `DELETE /api/blog/posts/[slug]`
**Purpose**: Delete blog post  
**Authentication**: Required  
**Response**: Confirmation of deletion

#### `POST /api/blog/schedule`
**Purpose**: Schedule blog post for future publication  
**Authentication**: Required  
**Request Body**:
```typescript
{
  postId: string;
  scheduledFor: string;  // ISO date string
}
```

#### `POST /api/blog/publish`
**Purpose**: Manually publish blog post immediately  
**Authentication**: Required  
**Request Body**:
```typescript
{
  postId: string;
}
```

#### `GET /api/admin/blog/stats`
**Purpose**: Blog performance statistics for admin dashboard  
**Authentication**: Required  
**Response**: Aggregated blog metrics and analytics

### Knowledge Management APIs

#### `GET /api/admin/knowledge`
**Purpose**: List all knowledge base files with metadata  
**Authentication**: Required  
**Response**:
```typescript
{
  filename: string;
  content: string;
  lastModified: string;
  embeddingStatus: 'current' | 'outdated' | 'missing';
  chunkCount: number;
}[]
```

#### `POST /api/admin/knowledge/update`
**Purpose**: Save changes to knowledge base file  
**Authentication**: Required  
**Request Body**:
```typescript
{
  filename: string;
  content: string;
}
```
**Response**: Success confirmation and file metadata

#### `POST /api/admin/knowledge/reprocess`
**Purpose**: Regenerate embeddings for knowledge files  
**Authentication**: Required  
**Request Body** (optional):
```typescript
{
  filename?: string;  // If omitted, processes all files
}
```
**Response**: Processing results with success/failure status per file

#### `GET /api/admin/knowledge/status`
**Purpose**: Performance metrics and cache statistics  
**Authentication**: Required  
**Response**:
```typescript
{
  cacheHitRate: number;
  averageResponseTime: number;
  totalQueries: number;
  embeddingCacheStatus: object;
  fileStatistics: object;
}
```

#### `POST /api/admin/knowledge/test-query`
**Purpose**: Test RAG system with custom queries  
**Authentication**: Required  
**Request Body**:
```typescript
{
  query: string;
}
```
**Response**:
```typescript
{
  query: string;
  response: string;
  contextChunks: Array<{
    content: string;
    source: string;
    score: number;
    metadata: object;
  }>;
  metadata: {
    totalChunks: number;
    highConfidenceChunks: number;
    mediumConfidenceChunks: number;
    lowConfidenceChunks: number;
    averageScore: number;
  };
}
```

### Publishing Automation

#### `POST /api/admin/cron/publish`
**Purpose**: Vercel Cron endpoint for automated publishing  
**Authentication**: Vercel Cron token validation  
**Schedule**: Daily at 9 AM UTC  
**Function**: Publishes scheduled posts automatically

### Content APIs

#### `GET /api/feed/rss`
**Purpose**: Generate RSS feed for published blog posts  
**Authentication**: None (public)  
**Response**: XML RSS 2.0 feed

#### `POST /api/blog/generate-linkedin-post`
**Purpose**: Generate LinkedIn post content from blog post  
**Authentication**: Required  
**Request Body**:
```typescript
{
  blogPostId: string;
  hookStyle?: string;  // Optional hook template preference
}
```

### External Data APIs

#### `GET /api/goodreads/route`
**Purpose**: Fetch current reading data from Goodreads  
**Authentication**: None  
**Caching**: 5-minute Vercel KV cache

#### `GET /api/strava/activities`
**Purpose**: Fetch recent Strava activities  
**Authentication**: None  
**Caching**: 5-minute Vercel KV cache

#### `POST /api/chat`
**Purpose**: Handle AI chat interactions  
**Authentication**: None (public chat interface)  
**Rate Limiting**: 10 messages per session, 100 per IP per day

---

## 🛠️ System Administration

### Knowledge Base Updates
1. **Manual Process**: Edit files through admin interface
2. **Automatic Re-processing**: Triggered on file save
3. **Batch Operations**: Use reprocess API for bulk updates
4. **Monitoring**: Track embedding status and performance

### Blog Publishing Schedule
- **Cron Job**: Runs daily at 9 AM UTC
- **Process**: Checks for scheduled posts, publishes automatically
- **Fallback**: Manual publish option available in admin interface
- **Monitoring**: Check admin dashboard for publication status

### Cache Management
- **Blog Posts**: Cached in Vercel KV with 7-day TTL
- **Embeddings**: Cached with content hash validation  
- **External APIs**: 5-minute cache for Goodreads/Strava data
- **Manual Clear**: Available through admin interface

### Performance Monitoring
- **Response Times**: Tracked for all API endpoints
- **Cache Hit Rates**: Monitored for cost optimization
- **Error Rates**: Logged with detailed error information
- **Usage Analytics**: Available in admin dashboard

---

## 🔧 Development & Deployment

### Local Development
```bash
npm run dev        # Start development server
npm run lint       # Run ESLint checks
npm run format     # Check Prettier formatting
npm run format:fix # Auto-fix formatting issues
npm run build      # Production build
```

### Environment Variables
Required for full functionality:
- `NEXTAUTH_SECRET`: Authentication secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `KV_URL` / `KV_REST_API_URL` / `KV_REST_API_TOKEN`: Vercel KV database
- `PINECONE_API_KEY` / `PINECONE_INDEX_NAME`: Vector database
- `ANTHROPIC_API_KEY`: Claude AI integration
- `OPENAI_API_KEY`: Embedding generation

### Deployment
- **Platform**: Vercel with automatic deployments
- **Branch**: `main` for production
- **Build Command**: `npm run build`
- **Framework**: Next.js 15 with App Router

---

## 📊 Usage Guidelines

### Best Practices
1. **Blog Posts**: Write in markdown, use categories consistently
2. **Knowledge Base**: Keep files focused, update regularly
3. **Testing**: Use test query interface before knowledge updates
4. **Monitoring**: Check admin dashboard regularly for system health

### Content Guidelines  
1. **Professional Tone**: Maintain consistent voice across all content
2. **SEO Optimization**: Use descriptive titles and excerpts
3. **Categorization**: Use established categories: Development, Personal, Learning, Projects
4. **Knowledge Updates**: Review and update knowledge base quarterly

### Security Considerations
1. **Admin Access**: Limited to `zliibbe@gmail.com` only
2. **Session Management**: 180-minute timeout for security
3. **CSRF Protection**: All admin endpoints include CSRF validation
4. **Input Validation**: All user inputs are sanitized and validated

---

## 🆘 Troubleshooting

### Common Issues

#### Authentication Problems
- **Solution**: Clear browser cookies and re-authenticate
- **Check**: Verify Google OAuth credentials in environment variables

#### Blog Publishing Failures  
- **Solution**: Use manual publish option in admin interface
- **Check**: Verify scheduled post datetime format and timezone

#### Knowledge Base Updates Not Reflecting
- **Solution**: Manually trigger re-processing through admin interface
- **Check**: Verify Pinecone and OpenAI API credentials

#### Chat System Not Responding
- **Solution**: Check Claude API key and rate limits
- **Check**: Review console logs for embedding generation errors

### Support Resources
- **Documentation**: This admin guide and `README.md`
- **Issue Tracking**: GitHub Issues for technical problems
- **Development**: Contact admin user for system modifications

---

## 🚀 Recent Updates

### Version 2.5.0 (Current)
- ✅ Complete admin knowledge management interface
- ✅ RAG system testing and monitoring
- ✅ Enhanced file editing with live preview
- ✅ Performance monitoring dashboard
- ✅ Bulk embedding reprocessing capabilities

### Previous Releases
- **2.4.0**: Phase 5 UX polish and search functionality
- **2.3.0**: LinkedIn cross-posting and content generation
- **2.2.0**: Blog search and filtering capabilities
- **2.1.0**: RAG-powered chat system deployment
- **2.0.0**: Complete blog management system

---

*This guide covers all current admin functionality. For technical development questions or system modifications, contact the admin user directly.*