# Product Requirements Document: Personal Website Enhancement

## RAG-Powered Chat & Blog System

**Version:** 1.1  
**Date:** September 2025  
**Author:** Zach Liibbe

---

## Executive Summary

Transform zachliibbe.com into an interactive personal website featuring:

- [ ] **RAG-powered AI chat** for visitors to learn about Zach through natural conversation
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

- [ ] **Provider:** Anthropic Claude (cost-effective, high quality)
- [ ] **Vector Database:** Pinecone (free tier: 1M vectors, 1 index)
- [ ] **Embeddings:** OpenAI text-embedding-3-small ($0.02/1M tokens)
- [ ] **RAG Architecture:** Semantic search → context injection → Claude response

#### Chat Interface

- [ ] **Location:** Floating chat widget (bottom-right corner)
- [ ] **Design:** Clearly branded as AI chat with intuitive chat bubble icon, matches existing site theme
- [ ] **Features:**
  - [ ] Session memory (within conversation)
  - [ ] Typing indicators
  - [ ] Copy response functionality
  - [ ] Source attribution ("Based on Zach's professional experience...")

### 1.3 Cost Optimization Strategy

- [ ] Cache embeddings in Vercel KV to avoid re-computation
- [ ] Implement conversation limits (10 messages per session initially)
- [ ] Use Claude Haiku for simple queries, Sonnet for complex ones
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
- [ ] SEO preview (title, description, social cards)
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
- [ ] Search functionality
- [x] RSS feed generation
- [ ] Social sharing buttons
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

### Phase 4: RAG Chat Foundation (Week 4-5)

- [ ] Set up Pinecone integration
- [ ] Create knowledge base markdown files
- [ ] Implement embedding generation and caching
- [ ] Build floating chat widget (bottom-right, clearly AI-branded)
- [ ] Integrate Claude API for responses
- [ ] Deploy chat widget on existing site

### Phase 5: Polish & Optimization (Week 6)

- [ ] Optimize RAG performance and costs
- [ ] Add blog search and filtering
- [ ] Implement social sharing
- [ ] Add analytics tracking
- [ ] Performance testing and optimization

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

## 7. Future Enhancements (Post-MVP)

### Chat Improvements

- [ ] Site navigation assistance
- [ ] Project recommendation engine
- [ ] Multi-language support
- [ ] Voice interface

### Blog Features

- [ ] Comment system
- [ ] Newsletter integration
- [ ] Social media auto-posting
- [ ] Advanced analytics dashboard
- [ ] Multi-author support

### Technical Upgrades

- [ ] Dynamic knowledge base updates
- [ ] Advanced RAG with conversation context
- [ ] A/B testing for chat responses
- [ ] Performance monitoring dashboard

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

## Conclusion

This PRD outlines a cost-effective approach to building a personal website with advanced chat and blogging capabilities. The phased implementation allows for iterative development and early user feedback, while the technical choices prioritize sustainability and maintainability.

**Next Steps:**

1. [x] Review and approve this PRD
2. [x] Set up development environment
3. [x] Begin Phase 1 implementation
4. [x] Create initial knowledge base content

**Estimated Timeline:** 6 weeks for full MVP implementation
**Estimated Monthly Costs:** $5-15 (primarily AI services and Pinecone)
