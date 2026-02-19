# Product Requirements Document: Personal Website Enhancement

## RAG-Powered Chat & Blog System

**Version:** 1.1  
**Date:** September 2025  
**Author:** Zach Liibbe

---

## Executive Summary

Transform zachliibbe.com into an interactive personal website featuring:

- [x] **RAG-powered AI chat** for visitors to learn about Zach through natural conversation
- [x] **Blog system with scheduling** for content creation and automated publishing
- [x] **Authentication system** for secure content management
- [x] **LinkedIn cross-posting integration** for professional content distribution

**Key Constraint:** Minimize costs while maintaining professional quality and performance.

---

## Current Technical Stack

- [x] **Framework:** Next.js 15 (React 19)
- [x] **Hosting:** Vercel
- [x] **Storage:** Vercel KV
- [x] **Styling:** CSS Modules
- [x] **Analytics:** Google Analytics

---

## 1. RAG-Powered Chat System

### 1.1 Functional Requirements

#### Priority A: Professional Information

- [ ] Respond to questions about work experience, technical skills, projects
- [ ] Provide context about career progression and expertise areas
- [ ] Share details about specific technologies and frameworks used

#### Priority B: Contact & Availability

- [ ] Guide visitors on how to reach out (preferred communication methods)
- [ ] Indicate general availability for opportunities (consulting, full-time, etc.)
- [ ] Provide context on response timeframes

#### Priority C: Personal Context

- [ ] Share interests, philosophy, and work approach
- [ ] Discuss personal projects and learning goals
- [ ] Provide insights into personality and working style

### 1.2 Technical Specifications

#### Knowledge Base Structure

```
/src/data/knowledge/
├── professional.md     # Work history, skills, projects
├── contact.md          # Communication preferences, availability
├── personal.md         # Interests, philosophy, approach
└── projects.md         # Detailed project information
```

#### AI Integration

- [x] **Provider:** Anthropic Claude (cost-effective, high quality)
- [x] **Vector Database:** Pinecone (free tier: 1M vectors, 1 index)
- [x] **Embeddings:** OpenAI text-embedding-3-small ($0.02/1M tokens)
- [x] **RAG Architecture:** Semantic search → context injection → Claude response

#### Chat Interface

- [x] **Location:** Floating chat widget (bottom-right corner)
- [x] **Design:** Clearly branded as AI chat with intuitive chat bubble icon, matches existing site theme
- [x] **Features:**
  - [x] Session memory (within conversation)
  - [x] Typing indicators
  - [x] Copy response functionality
  - [x] Source attribution ("Based on Zach's professional experience...")

### 1.3 Cost Optimization Strategy

- [x] Cache embeddings in Vercel KV to avoid re-computation (7-day TTL)
- [x] Implement conversation limits (10 messages per session initially)
- [x] Use Claude Haiku for simple queries, Sonnet for complex ones
- [x] Improved context specificity with higher confidence thresholds
- [ ] Batch embed knowledge base updates

---

## 2. Blog System with Scheduling

### 2.1 Content Structure

#### Blog Post Template

```markdown
---
title: "Post Title"
author: "Zach Liibbe"
publishedAt: "2025-01-15"
scheduledFor: "2025-01-20T09:00:00Z" # Optional
status: "draft" | "scheduled" | "published"
categories: ["Development", "Personal", "Learning", "Projects"]
tags: ["nextjs", "typescript", "learning"]
series: "Learning in Public" # Optional
excerpt: "Brief description for previews"
readTime: "8 min read" # Auto-calculated
---

# Post Content Here
```

#### File Organization

```
/src/content/blog/
├── 2025/
│   ├── 01-my-first-post.md
│   ├── 02-learning-rag.md
│   └── ...
├── drafts/
│   ├── upcoming-post.md
│   └── ...
└── templates/
    └── post-template.md
```

### 2.2 Admin Interface

#### Authentication

- [x] **Provider:** Google OAuth (NextAuth.js)
- [x] **Session Duration:** 180 minutes
- [x] **User Storage:** Username/password stored in Vercel KV database
- [x] **User Restriction:** Single user (zliibbe@gmail.com) verified working, other emails rejected
- [x] **Admin Access:** Subtle UI element (e.g., small "Admin" link in footer) visible to authenticated users

#### Writing Interface (`/admin/blog`)

- [x] Markdown editor with live preview
- [x] Auto-save drafts to file-based storage
- [x] Category/tag management
- [x] Scheduling interface with date/time picker
- [x] Reading time auto-calculation
- [x] SEO preview (title, description, social cards)
- [x] Multiple image selection options (choose from gallery)

#### Content Management

- [x] Draft → Review → Schedule → Publish workflow
- [ ] Bulk operations (publish multiple, reschedule)
- [ ] Post analytics integration
- [x] Image selection with multiple options (Unsplash integration)

### 2.3 Publishing System

#### Automated Scheduling

- [x] **Trigger:** Vercel Cron Jobs (daily check at 9 AM UTC)
- [x] **Process:**
  1. [x] Query scheduled posts due for publication
  2. [x] Move from `drafts/` to appropriate date folder
  3. [x] Update post status to "published"
  4. [x] Trigger site rebuild
  5. [x] Clear relevant caches

#### Public Blog Interface (`/blog`)

- [x] Post listing with pagination
- [x] Category/tag filtering
- [x] Search functionality (title, excerpt, categories, tags)
- [x] RSS feed generation
- [x] Social sharing buttons (Twitter/X, LinkedIn, Email)
- [ ] Reading progress indicator

---

## 3. System Architecture

### 3.1 Database Schema (Vercel KV)

```typescript
// Chat Sessions
type ChatSession = {
  id: string;
  userId?: string; // For authenticated users
  messages: Message[];
  createdAt: string;
  lastActivity: string;
};

// Blog Posts Metadata
type BlogPost = {
  id: string;
  slug: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: string;
  publishedAt?: string;
  metadata: PostMetadata;
  contentPath: string;
};

// Knowledge Base Embeddings Cache
type EmbeddingCache = {
  contentHash: string;
  embedding: number[];
  source: string;
  lastUpdated: string;
};
```

### 3.2 API Routes

```
/api/
├── chat/
│   ├── message          # POST: Send message, get AI response
│   ├── session          # GET: Retrieve session, POST: Create new
│   └── embeddings       # POST: Update knowledge base embeddings
├── blog/
│   ├── posts            # GET: List posts, POST: Create post
│   ├── posts/[slug]     # GET: Get post, PUT: Update, DELETE: Remove
│   ├── schedule         # POST: Schedule post for publication
│   └── publish          # POST: Manually publish post
├── admin/
│   ├── auth             # Google OAuth endpoints
│   └── cron/publish     # Vercel Cron endpoint for scheduled publishing
└── feed/
    └── rss              # RSS feed generation
```

### 3.3 Component Architecture

```
/src/app/components/
├── Chat/
│   ├── ChatWidget.tsx           # Main floating chat interface
│   ├── ChatMessage.tsx          # Individual message component
│   ├── TypingIndicator.tsx      # Loading state
│   └── ChatHistory.tsx          # Session message history
├── Blog/
│   ├── PostCard.tsx             # Blog post preview card
│   ├── PostContent.tsx          # Full post display
│   ├── CategoryFilter.tsx       # Category/tag filtering
│   └── ReadingProgress.tsx      # Progress indicator
└── Admin/
    ├── MarkdownEditor.tsx       # Blog post editor
    ├── PostScheduler.tsx        # Scheduling interface
    ├── PostMetadata.tsx         # Title, tags, category input
    └── DraftManager.tsx         # Draft listing and management
```

---

## 4. Implementation Phases

### Phase 1: Authentication & Admin Setup (Week 1)

- [x] Implement Google OAuth with NextAuth.js
- [x] Create admin dashboard layout
- [x] Build session management and user storage
- [x] Add admin route protection
- [x] Design admin access UI (subtle but accessible)

### Phase 2: Blog Creation Interface (Week 2)

- [x] Build markdown editor component
- [x] Implement draft auto-saving to Vercel KV
- [x] Create post metadata management
- [x] Add reading time calculation
- [x] Build post preview functionality
- [x] Set up initial blog categories: "Development", "Personal", "Learning", "Projects"

### Phase 3: Publishing & Scheduling (Week 3)

- [x] Implement scheduling system
- [x] Set up Vercel Cron jobs
- [x] Build automated publishing workflow
- [x] Create public blog interface (`/blog`)
- [x] Add RSS feed generation

### Phase 3.5: LinkedIn Cross-posting Integration (Week 3.5)

- [x] Add LinkedIn URL tracking to BlogPost interface
- [x] Implement professional content transformation with character limits
- [x] Create category-based professional hook generation system
- [x] Add LinkedIn cross-posting buttons to BlogAdmin interface
- [x] Build LinkedIn URL input field in MarkdownEditor
- [x] Implement manual workflow with clipboard API and redirect
- [x] Add comprehensive error handling and user feedback

### Phase 3.6: Enhanced LinkedIn Post Creation ✅ (100% Complete)

- [x] **LinkedIn Post Generator Modal:** Create modal component for Published Blogs in Blog Management
- [x] **Content Summarization:** Auto-generate LinkedIn-appropriate hooks from blog post content with 28 proven high-engagement templates
- [x] **Post Preview:** Show formatted LinkedIn post preview with character count and real-time validation
- [x] **Manual Publishing Workflow:** Copy-to-clipboard + LinkedIn redirect for optimal user control
- [x] **Hook Variety System:** ✨ New Hook button for A/B testing different engagement patterns
- [x] **Research-Based Hooks:** Implemented AuthoredUp-inspired hooks proven to boost engagement by 30%

### Phase 3.7: Blog Management UX Enhancements ✅ (100% Complete)

- [x] **CSS Style Consistency:** Updated production blog styles (`/blog`) to match Blog Management interface styling
- [x] **Published Blog Navigation:** Made published blog titles in "All Posts" section clickable links to live blog pages
- [x] **Admin Interface Polish:** Improved user experience with direct navigation from admin to public blog posts
- [x] **Button Styling Consistency:** Unified action button styling across LinkedIn and Medium features

### Phase 3.8: Blog Search & UX Enhancement ✅ (100% Complete)

- [x] **Text-Based Search:** Implemented comprehensive search functionality across post titles, excerpts, categories, and tags
- [x] **Search UI Integration:** Added responsive search form to `/blog` page with proper mobile optimization
- [x] **Filter Preservation:** Search maintains existing category/tag filters for refined browsing experience
- [x] **URL Parameter Support:** Search queries persist in URL for bookmarking and sharing search results
- [x] **Theme Integration:** Search components use globals.css variables for consistent light/dark mode theming

### Phase 3.9: Mobile Chat Widget Responsive Fixes ✅ (100% Complete)

- [x] **Breakpoint Optimization:** Fixed CSS cascade issues causing desktop styles to override mobile at 768px width
- [x] **Chat Positioning:** Resolved chatPrompt and chatToggle positioning to consistently appear in lower-right corner
- [x] **Arrow Positioning:** Centered promptArrow to point at chatToggle button on tablet and mobile screens (≤768px)
- [x] **Media Query Strategy:** Implemented complementary breakpoints (max-width: 769px / min-width: 770px) to prevent style conflicts
- [x] **Mobile Layout Fixes:** Additional responsive improvements for job cards and knowledge base markdown formatting

### Phase 3.10: Footer Book Cover Hover Enhancement ✅ (100% Complete)

- [x] **Pseudoelement Implementation:** Display book cover image on hover over `.bookTitle` in footer
- [x] **CSS-Only Solution:** Use `::before` pseudoelement with background-image and CSS custom property `--cover-image`
- [x] **Positioning Strategy:** Absolute positioning above footer centered over title text
- [x] **Responsive Design:** Desktop hover (180x270px), tablet touch (160x240px), mobile touch (140x210px)
- [x] **Mobile Touch Support:** Two-tap pattern - first tap shows cover for 3 seconds, second tap opens Goodreads link
- [x] **Animation:** Smooth fade-in transition with 0.3s ease
- [x] **Z-Index Management:** Proper layering (z-index: 1000) to avoid conflicts with other UI elements
- [x] **Strava Activity Stats Card:** Hover/touch preview showing detailed metrics (distance, duration, pace, heart rate, elevation, kudos)
- [x] **Imperial Units:** All metrics displayed in miles, feet, and min/mile pace
- [x] **Activity Type Detection:** Dynamic emoji display based on activity type (🏃 run, 🚴 ride, 🏊 swim, 🚶 walk, 🏋️ workout)

**Technical Implementation:**

- Book cover URL from Goodreads API passed as CSS custom property
- Responsive sizing via media queries with hover/pointer detection
- Mobile touch handler with classList manipulation and setTimeout cleanup
- ActivityStatsCard component with imperial unit conversion utilities
- Centered positioning using left: 50%, translateX(-50%) pattern
- Theme-aware styling supporting both light and dark modes

### Phase 3.11: Live Feed Multi-Activity Heatmap ✅ (100% Complete)

- [x] **Split-Square Design:** Implemented diagonal split (upper-left to lower-right) for 2+ activities per day using SVG clip-path
- [x] **Activity Type Colors:** Maintained existing color scheme with proper color assignment per activity type
- [x] **Data Structure Update:** Modified activity aggregation to support multiple activities per day with multi-activity detection
- [x] **Tooltip Enhancement:** Enhanced tooltips showing numbered list of all activities with metrics for multi-activity days
- [x] **Single Activity Fallback:** Preserved single-color display for days with 0-1 activities
- [x] **SVG Implementation:** Used SVG clip-path with polygon elements for diagonal division
- [x] **Responsive Calendar Display:** Fixed horizontal scrolling and minimum width (800px) for proper calendar rendering
- [x] **API Pagination Fix:** Implemented pagination to fetch all activities (up to 600) when >200 activities exist in date range
- [x] **Rounded Corners:** Applied 3px border-radius to all calendar squares for consistent visual design

**Technical Implementation:**

- react-calendar-heatmap with post-render DOM manipulation via useEffect
- SVG clip-path triangles (upper-left and lower-right) for diagonal splits
- MutationObserver for handling dynamic calendar updates
- Activity aggregation by date with special 'multiple' type for multi-activity days
- Smart pagination with early termination when reaching activities before cutoff date
- Client-side filtering to handle date range restrictions
- Horizontal scroll container with 100% width and min-width constraint
- Unique clip-path IDs to prevent conflicts across multiple split squares

### Phase 4: RAG Chat Foundation ✅ (100% Complete)

- [x] Set up Pinecone integration
- [x] Create knowledge base markdown files
- [x] Implement embedding generation and caching
- [x] Build floating chat widget (bottom-right, clearly AI-branded)
- [x] Integrate Claude API for responses
- [x] Deploy chat widget on existing site

### Phase 5: Polish & Optimization (Week 6)

- [x] Optimize RAG performance and costs (KV caching, adaptive models, conversation limits, improved specificity)
- [x] Add blog search and filtering
- [x] Implement social sharing
- [x] Add analytics tracking
- [ ] Performance testing and optimization

### Phase 5.1: RAG Performance & Cost Optimization ✅ (100% Complete)

- [x] **Vercel KV Embedding Cache:** Implemented persistent caching with 7-day TTL to eliminate repeated OpenAI API calls
- [x] **Adaptive Model Selection:** Automatic Claude Haiku vs Sonnet selection based on query complexity and conversation length
- [x] **Conversation Limits:** Enforced 10-message limit per session for cost control with graceful user messaging
- [x] **Enhanced Context Filtering:** Improved specificity with dual-tier confidence scoring (>0.7 high, >0.4 medium confidence)
- [x] **Experience-Specific Prompting:** Updated system prompts to focus on Zach's actual background vs generic responses
- [x] **Cost Monitoring:** Added logging for model selection and context chunk usage for cost tracking

---

### Phase 6: Admin Knowledge Management Interface ✅ (100% Complete)

- [x] **Complete Admin Interface:** Full knowledge base management system with file editing, monitoring, and testing
- [x] **API Endpoints:** 5 new authenticated endpoints for comprehensive knowledge management operations
- [x] **UI Components:** 4 specialized React components with responsive CSS modules styling
- [x] **Markdown Editor:** Live preview toggle with change detection and auto-save functionality
- [x] **Performance Dashboard:** Real-time cache statistics and embedding status monitoring
- [x] **RAG Testing Interface:** Query testing with context visualization and relevance scoring
- [x] **Bulk Operations:** Manual re-processing triggers for individual files or entire knowledge base
- [x] **Authentication Integration:** Seamless integration with existing NextAuth.js admin system
- [x] **Mobile Responsive:** Complete mobile optimization for knowledge management on all devices
- [x] **Version Control:** Package version bump to 2.5.0 reflecting major feature completion

---

### Phase 7: Persistent Rate Limiting ✅ (100% Complete)

- [x] **Vercel KV Storage:** Migrated from in-memory Map to persistent Vercel KV for rate limit tracking
- [x] **100 Requests Per Day:** Implemented 100 requests per IP per 24-hour window (upgraded from 10/minute)
- [x] **Serverless Compatible:** Rate limiting works across multiple serverless function instances
- [x] **Automatic Expiry:** KV entries automatically expire after 24 hours to prevent data accumulation
- [x] **Rate Limit Headers:** Added `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers to API responses
- [x] **Graceful Degradation:** Falls back to allowing requests if KV is unavailable (fail-open strategy)
- [x] **Enhanced Error Messages:** User-friendly rate limit exceeded messages showing daily limit and specific reset timestamp
- [x] **Conversation Limits:** Maintained existing 10-message per session limit for additional cost control

**Technical Implementation:**

- Persistent storage using `@vercel/kv` with automatic TTL management
- IP-based identifier extracted from `x-forwarded-for` header
- Rate limit key format: `rate_limit:{ip_address}`
- Async rate limit checks integrated into chat API route
- Standard HTTP 429 status code for rate limit exceeded responses
- Informative headers following industry best practices (X-RateLimit-\* pattern)
- Chat widget displays detailed API error messages with reset time to users

---

### Phase 8: Reading Progress Indicator ✅ (100% Complete)

- [x] **Fixed Progress Bar:** Sticky progress bar at top of page tracking reading progress
- [x] **Scroll Tracking:** Real-time calculation based on article scroll position
- [x] **Theme Integration:** Uses accent colors (--accentPrimary, --clr-accent-300) for consistency
- [x] **Smooth Animations:** Smooth width transitions with easing
- [x] **Responsive Design:** Adapts height for mobile (3px) and desktop (4px)
- [x] **Accessibility:** Proper ARIA attributes (progressbar role, valuenow, valuemin, valuemax)
- [x] **Reading Time Display:** Existing reading time calculation already integrated in blog meta

**Technical Implementation:**

- Client-side React component with useEffect for scroll listening
- Calculates progress based on article element position and height
- Fixed positioning (z-index: 1000) above all other content
- Window scroll and resize event listeners for accuracy
- CSS custom properties for seamless theme integration
- Gradient background using theme accent colors
- Box shadow for visual prominence

**User Experience:**

- Visual feedback of reading progress at a glance
- Non-intrusive design that doesn't block content
- Matches site theme colors for consistency
- Works on all blog post pages automatically

---

### Phase 5: Analytics Tracking Events ✅ (100% Complete)

**Status:** Complete (2025-10-01)

- [x] **Google Analytics Setup:** Existing GA4 integration with script tags and utilities
- [x] **Blog Post Tracking:** View, read completion (90% scroll), and social share events
- [x] **Chat Widget Tracking:** Open, message send/receive, and close with session metrics
- [x] **Search & Filter Tracking:** Blog search queries and category/tag filter selections
- [x] **Component Architecture:** Separated client components for tracking in server-rendered pages

**Technical Implementation:**

- Extended `analytics.ts` utility with 9 new tracking functions
- Created `BlogPostAnalytics` component for automatic view/completion tracking
- Created `ShareButtons` component with integrated click tracking
- Created `BlogSearch` and `BlogFilters` client components for user interaction tracking
- Integrated analytics into chat hooks (`useChatVisibility`, `useChatMessages`)
- All tracking respects analytics.isEnabled() checks
- Performance-optimized with passive scroll listeners and useRef for timing

**Analytics Events Implemented:**

**Blog Events:**

- `blog_post_view` - Post slug, title, category
- `blog_post_complete` - Post slug, read time (tracked at 90% scroll)
- `blog_post_share` - Post slug, platform (twitter/linkedin/email)

**Chat Events:**

- `chat_opened` - Timestamp tracking via openTimeRef
- `chat_message_sent` - Message number in session
- `chat_message_received` - AI response message number
- `chat_closed` - Session duration (seconds), total message count

**Search & Filter Events:**

- `search` - Query term, result count
- `filter_applied` - Filter type (category/tag), value, result count

**Commits Created:**

1. Extended analytics tracking functions
2. Created BlogPostAnalytics component
3. Created ShareButtons component with tracking
4. Integrated analytics into blog post pages
5. Added chat widget interaction tracking
6. Added search and filter tracking to blog page

**User Experience:**

- Zero impact on user experience (all tracking async)
- Privacy-respecting (GA4 consent framework)
- Performance-optimized with passive listeners
- Comprehensive tracking for data-driven optimization

---

### Phase 9: Fix Build Error - Html Import Issue ✅ (100% Complete - Recurring Issue)

**Status:** Complete (2025-10-01) - Documented solution for recurring issue
**Priority:** CRITICAL - Blocking production builds

**Problem:**
Production builds fail with:

```
Error: <Html> should not be imported outside of pages/_document.
Export encountered an error on /_error: /404, /500
```

**Root Cause:**
NODE_ENV is manually set to 'development' in the shell environment, causing Next.js 15 to incorrectly attempt Pages Router error handling during App Router production builds.

**Solution:**
Unset NODE_ENV before building:

```bash
unset NODE_ENV && bun run build
```

**Why This Happens:**

- Next.js automatically manages NODE_ENV (sets to 'production' during build, 'development' during dev)
- Manually setting NODE_ENV overrides this and confuses the build process
- When NODE_ENV is 'development' during a production build, Next.js tries to use Pages Router error handling
- This causes it to look for `<Html>` component from 'next/document', which doesn't exist in App Router

**Prevention:**

- Never set NODE_ENV manually in shell configuration files
- Let Next.js manage NODE_ENV automatically
- If NODE_ENV is set in current terminal session, open a new terminal or run `unset NODE_ENV`

**Error Boundary:**
The `src/app/error.tsx` file provides proper App Router error handling (created in previous fix, commit 0a166b1)

---

### Phase 10: ESLint Migration to CLI ✅ (100% Complete)

**Status:** Complete (2025-10-01)
**Priority:** HIGH - Technical debt, deprecation warning

**Problem:**
`next lint` is deprecated and will be removed in Next.js 16:

```
`next lint` is deprecated and will be removed in Next.js 16.
For existing projects, migrate to the ESLint CLI:
npx @next/codemod@canary next-lint-to-eslint-cli .
```

**Impact:**

- Future Next.js upgrades will break linting
- Using deprecated tooling
- Inconsistent with modern Next.js best practices

**Technical Requirements:**

- [x] **Run Codemod:** Execute official Next.js ESLint migration codemod
- [x] **Update Scripts:** Update package.json lint scripts to use ESLint CLI directly
- [x] **Verify Config:** Ensure ESLint configuration is properly migrated
- [x] **Test Linting:** Confirm linting works with new setup
- [x] **Update CI/CD:** Update any build pipelines using `next lint`
- [x] **Documentation:** Update development docs with new lint command

**Migration Command:**

```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

**Expected Changes:**

- `package.json` script changes from `next lint` to `eslint .`
- ESLint configuration updated to work without Next.js wrapper
- No more deprecation warnings
- Consistent linting across development and CI/CD

**Expected Outcome:**

- Modern ESLint CLI integration
- No deprecation warnings
- Future-proof linting setup for Next.js 16+

---

### Phase 11: Update Next.js to Latest Version ✅ (100% Complete)

**Status:** Complete (2025-10-01)
**Priority:** MEDIUM - Version staleness, security updates

**Problem:**
Current Next.js version is outdated. Next.js frequently releases updates with:

- Performance improvements
- Security patches
- Bug fixes
- New features

**Documentation:**
https://nextjs.org/docs/messages/version-staleness

**Impact:**

- Missing performance optimizations
- Potential security vulnerabilities
- Outdated features and APIs
- Compatibility issues with new packages

**Technical Requirements:**

- [x] **Check Current Version:** Review current Next.js version in package.json
- [x] **Review Changelog:** Read Next.js release notes for breaking changes
- [x] **Update Dependencies:** Update Next.js and related packages
- [x] **Update React:** Ensure React version is compatible with new Next.js
- [x] **Test Build:** Verify production build succeeds
- [x] **Test Features:** Ensure all features work (blog, chat, auth, etc.)
- [x] **Update Documentation:** Update version references in docs

**Update Commands:**

```bash
# Check current version
bun pm ls

# Update Next.js to latest
bun add next@latest react@latest react-dom@latest

# Update other Next.js related packages if needed
bun add @next/bundle-analyzer@latest @next/env@latest
```

**Testing Checklist:**

- [ ] Home page renders correctly
- [ ] Blog system (list, post pages, search, filters)
- [ ] Chat widget functionality
- [ ] Admin dashboard (if authenticated)
- [ ] API routes (blog, chat, auth, Strava, Goodreads)
- [ ] Static generation and ISR
- [ ] Image optimization
- [ ] CSS Modules and styling
- [ ] TypeScript compilation

**Expected Outcome:**

- Latest stable Next.js version
- All features working correctly
- Improved performance and security
- Access to newest Next.js features

---

### Phase 12: Fix Activities Display - Multiple Activities Per Day ✅ (100% Complete)

**Status:** Complete (2025-10-01)
**Priority:** MEDIUM - Visual bug, data display issue

**Problem:**
The Activities grid on `/live-feed` page is displaying black squares instead of appropriately-colored half-squares for days with more than one activity. When a user has multiple activities on the same day (e.g., a run and weight training), the grid should show the square split with each activity's color, but currently shows black squares instead.

**Visual Impact:**

- Loss of activity type visibility for multi-activity days
- Poor user experience - can't distinguish what activities were done
- Inconsistent with single-activity day display which works correctly

**Location:**

- Page: `/src/app/live-feed/page.tsx` or related components
- Component: ActivityGrid component or similar

**Technical Requirements:**

- [x] **Identify Root Cause:** Investigate ActivityGrid rendering logic for multi-activity days
- [x] **Review CSS:** Check if CSS for split squares is missing or overridden
- [x] **Test Data Structure:** Verify activity data structure supports multiple activities per day
- [x] **Fix Rendering Logic:** Update component to properly render half-squares with correct colors
- [x] **Test Edge Cases:** Verify rendering for 2, 3, 4+ activities on same day
- [x] **Verify Color Mapping:** Ensure activity type colors match the legend

**Activity Types and Colors:**

- Run: Red
- Bike Ride: Green
- Swim: Blue
- Ski: Yellow
- Hike: Gray
- Walk: Orange
- Weight Training: Purple
- No Recorded Activity: Gray

**Expected Outcome:**

- Days with multiple activities display split squares with correct colors
- All activity types visible in the grid
- Consistent visual representation matching the legend
- Improved user experience for activity tracking visualization

---

## 5. Success Metrics

### Chat System

- [ ] **Engagement:** Average messages per session > 3
- [ ] **Quality:** User satisfaction (manual feedback collection)
- [ ] **Performance:** Response time < 3 seconds
- [ ] **Cost:** < $10/month for AI services

### Blog System

- [x] **Adoption:** 1-2 posts published per month
- [ ] **Workflow:** Draft to publish time < 30 minutes
- [ ] **Reliability:** 100% successful scheduled publications
- [x] **Performance:** Blog page load time < 2 seconds

### Admin Knowledge Management ✅

- [x] **Interface Completeness:** Full CRUD operations for knowledge files
- [x] **Performance Monitoring:** Real-time cache statistics and embedding health
- [x] **Testing Capabilities:** Comprehensive RAG system testing and debugging
- [x] **User Experience:** Intuitive tabbed interface with responsive design

---

## 6. Security & Privacy Considerations

### Chat System

- [ ] No persistent user data collection
- [ ] Rate limiting (10 messages per session, 100 per IP per day)
- [ ] Input sanitization and content filtering
- [x] No sensitive information in knowledge base

### Blog Admin

- [x] Single-user authentication only
- [x] Secure JWT token handling
- [x] CSRF protection on admin endpoints
- [x] Regular dependency security updates

---

## 7. Remaining Tasks & Future Enhancements

### Immediate Remaining Tasks (Current MVP Completion)

- [x] **SEO Preview:** Blog post SEO preview (title, description, social cards) in admin interface
- [x] **Reading Progress:** Blog post reading progress indicator with theme-adaptive accent colors on public blog pages
- [ ] **Bulk Operations:** Publish multiple posts, reschedule bulk operations in admin
- [ ] **Post Analytics:** Integration with performance metrics in admin dashboard
- [x] **Rate Limiting:** Implement chat rate limiting (10 messages per session, 100 per IP per day)
- [x] **Analytics Tracking:** Add comprehensive analytics tracking across the platform (Phase 5 complete)

### Chat System Enhancements (Post-MVP)

- [ ] Site navigation assistance
- [ ] Project recommendation engine
- [ ] Multi-language support
- [ ] Voice interface
- [ ] Advanced RAG with full conversation context
- [ ] A/B testing for chat responses

### Blog System Enhancements (Post-MVP)

- [ ] Comment system
- [ ] Newsletter integration
- [ ] Social media auto-posting (beyond LinkedIn)
- [ ] Advanced analytics dashboard
- [ ] Multi-author support

### Administrative Enhancements (Post-MVP)

- [x] ~~Dynamic knowledge base updates~~ ✅ (Completed - Admin interface provides this)
- [x] ~~Performance monitoring dashboard~~ ✅ (Completed - Embedding status interface)
- [ ] Advanced user management (if expanding beyond single admin)
- [ ] Backup and restore functionality
- [ ] Advanced caching strategies

---

## 8. Risk Mitigation

### Cost Overruns

- [ ] **Risk:** AI API costs exceed budget
- [ ] **Mitigation:** Implement strict rate limiting, usage monitoring, and fallback to cached responses

### Knowledge Base Maintenance

- [ ] **Risk:** Outdated information in chat responses
- [x] **Mitigation:** Quarterly knowledge base review process, clear last-updated timestamps

### Authentication Security

- [ ] **Risk:** Unauthorized access to admin functions
- [x] **Mitigation:** Single-user restriction, session timeout, regular security audits

### Publishing Failures

- [ ] **Risk:** Scheduled posts fail to publish
- [ ] **Mitigation:** Error monitoring, manual fallback process, scheduled post notifications

---

---

### Phase 13: Branch Cleanup

**Status:** Pending
**Priority:** HIGH — housekeeping, reduce noise in remote

**Scope:**
- Delete all merged/stale remote branches except `main` and `Add-Jest-and-React-Testing-Library`
- Prune all local branches except `main` and `Add-Jest-and-React-Testing-Library`
- Verify no unmerged work is lost before deleting

**Remote branches to delete (all merged):**
`blog/recent-development-work`, `chore/upgrade-next-16`, `dependabot/*`, `docs/update-readme`, `enhance/*`, `feature/*`, `fix/*`, `npm-to-bun`, `update-project-dependencies`, `vercel/*`

---

### Phase 14: Migrate ESLint + Prettier → Biome

**Status:** Pending
**Priority:** MEDIUM — toolchain modernization, faster linting/formatting

**Motivation:**
- Biome replaces both ESLint and Prettier with a single fast tool (written in Rust)
- Faster CI and local feedback loops
- Next.js 16 ESLint Flat Config is now default; good time to consolidate

**Technical Requirements:**
- [ ] Install `@biomejs/biome` and initialize `biome.json`
- [ ] Migrate ESLint rules to Biome equivalents
- [ ] Migrate Prettier config (`.prettierrc`) to Biome formatter settings
- [ ] Update `package.json` scripts: replace `lint` and `format` / `format:fix`
- [ ] Remove `eslint`, `eslint-config-next`, `eslint-plugin-prettier`, `eslint-config-prettier`, `prettier` from dependencies
- [ ] Update `CLAUDE.md` and `README.md` to reflect new toolchain
- [ ] Verify Bug Bot CI still works (uses `bun run lint` indirectly)

---

### Phase 15: Update /work and /about Content

**Status:** Pending
**Priority:** HIGH — current job missing, content is stale

**Scope:**

#### /work page
- [ ] Add current job/role (not yet listed)
- [ ] Review and update all existing job entries for accuracy
- [ ] Confirm contract status indicators are current

#### /about page — `.recentSection`
- [ ] Update recent activities / highlights content
- [ ] Ensure content reflects current interests and projects

---

### Phase 16: Add Currently Reading Section to /live-feed

**Status:** Pending
**Priority:** MEDIUM — improves live feed completeness

**Motivation:**
Currently `/live-feed` shows completed books ("Read" shelf) and audiobooks ("Listening" shelf) but has no "Currently Reading" section, even though the data is already fetched via `/api/goodreads/currently-reading`.

**Scope:**
- [ ] Rename existing "Reading" section → "Read" (books completed)
- [ ] Add new "Reading" section above "Read" showing currently-in-progress books with progress %
- [ ] Reuse existing `currently-reading` API data (already powers the footer widget)
- [ ] Match visual style of existing book cards

---

### Phase 17: React Testing Library + CI Integration

**Status:** Pending
**Priority:** HIGH — `Add-Jest-and-React-Testing-Library` branch has scaffolding; needs actual tests and CI wiring

**Scope:**
- [ ] Merge or rebase `Add-Jest-and-React-Testing-Library` branch onto current main
- [ ] Write meaningful component tests (focus on: chat widget, blog post card, theme toggle, nav)
- [ ] Write API route unit tests for critical paths (chat rate limiting, blog post fetching)
- [ ] Add test run step to Bug Bot workflow (or separate CI workflow)
- [ ] Ensure `bun run test` passes cleanly in CI
- [ ] Update `README.md` with testing instructions

---

## Current Status & Conclusion

This PRD has guided the successful implementation of a comprehensive personal website with advanced RAG-powered chat and complete blog management capabilities. The phased approach enabled iterative development with continuous user feedback.

### ✅ **Completed Major Features:**

1. **Authentication & Admin System** - Google OAuth with NextAuth.js
2. **Complete Blog Management** - Creation, editing, scheduling, LinkedIn cross-posting
3. **RAG-Powered AI Chat** - 81 knowledge vectors with Claude integration
4. **Advanced Search** - Full-text search across blog content
5. **Admin Knowledge Interface** - Complete knowledge base management system
6. **Performance Optimization** - Caching, adaptive AI models, cost controls
7. **Enhanced RAG Chat UX** - Suggested questions, improved loading states, better error handling
8. **Knowledge Base Optimization** - Restructured all files for better semantic search and RAG retrieval
9. **SEO Preview System** - Google search result and social media card previews in blog editor
10. **Mobile Chat Responsive Design** - Fixed positioning and breakpoint issues across all mobile devices
11. **Footer Interactive Elements** - Book cover hover and Strava activity stats preview
12. **Live Feed Multi-Activity Heatmap** - Diagonal split squares for days with multiple activities

### 📊 **Current Performance:**

- **Site Speed:** < 2 seconds page load time ✅
- **AI Costs:** < $10/month with optimization strategies ✅
- **Blog Publishing:** Automated scheduling with 100% reliability ✅
- **Knowledge Management:** Real-time editing and testing interface ✅

### 🎯 **Immediate Next Steps:**

1. **Rate Limiting:** Complete chat system rate limiting implementation
2. **Analytics Integration:** Implement comprehensive performance tracking
3. **Reading Progress:** Add progress indicators to blog posts
4. **Bulk Operations:** Enhance admin capabilities for batch operations
5. **Post Analytics Dashboard:** Performance metrics for published blog posts

### 📈 **Success Metrics Achieved:**

- **Technical Architecture:** Next.js 15, Vercel deployment, comprehensive API layer
- **User Experience:** Responsive design, intuitive admin interface, fast performance
- **Content Management:** Complete workflow from draft to publication to cross-platform sharing
- **AI Integration:** Functional RAG system with 81 knowledge vectors and real-time testing
- **Administrative Tools:** Full knowledge base management with performance monitoring

**Current Version:** 2.5.0  
**Development Timeline:** 6 phases completed over 6 weeks ✅  
**Monthly Operating Costs:** $5-15 (within target range) ✅  
**System Reliability:** Production-ready with comprehensive error handling ✅

The platform now provides a solid foundation for ongoing content creation and visitor engagement, with all core MVP features successfully implemented and deployed.
