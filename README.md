# Zach Liibbe's Personal Website

A modern [Next.js](https://nextjs.org/) 15 portfolio website with RAG-powered AI chat, integrated blog system, activity tracking, and comprehensive admin dashboard. Built with the App Router and deployed on Vercel at [zachliibbe.com](https://www.zachliibbe.com/).

## Features

### 🤖 **RAG-Powered AI Chat System**

- **Intelligent Conversational AI** - Claude-powered chat widget for visitor engagement
- **Semantic Search** - Pinecone vector database with 81 knowledge vectors
- **Context-Aware Responses** - RAG (Retrieval Augmented Generation) for accurate information
- **Cost-Optimized** - Adaptive model selection (Haiku/Sonnet) based on query complexity
- **Rate Limiting** - 100 requests per IP per day with persistent tracking via Vercel KV
- **Knowledge Base Management** - Admin interface for real-time knowledge updates and testing
- **Session Management** - 10-message limit per session for cost control

### 📝 **Blog Management System**

- **Full Blog CMS** - Create, edit, and manage blog posts with markdown editor
- **Post Scheduling** - Schedule posts for future publication with automated publishing via cron jobs
- **Draft Management** - Save drafts with auto-save functionality
- **Rich Content** - Support for categories, tags, series, and featured images from Unsplash
- **SEO Preview** - Google search result and social media card previews
- **Reading Progress** - Sticky progress bar tracking scroll position
- **Blog Search** - Full-text search across titles, excerpts, categories, and tags
- **LinkedIn Cross-posting** - One-click LinkedIn post generation with 28 engagement templates
- **RSS Feed** - Automatically generated RSS feed for blog content

### 🎨 **Customizable Theme System**

- **Dynamic Gradient Backgrounds** - Choose from 8 gradient themes with customizable colors
- **Dark/Light Mode Toggle** - Automatic system preference detection with manual override
- **Animation Controls** - Enable/disable gradient animations based on user preference
- **Persistent Settings** - All preferences saved to localStorage for consistent experience
- **Branded Selection** - Text selection highlight uses the active theme's accent color (`--accentPrimary`) with WCAG AA-compliant contrast
- **Intentional UI Chrome** - `user-select: none` applied to decorative elements (nav, hero, footer copyright, preferences panel, blog filters/badges, contact tagline) so content text remains selectable
- **CSS Custom Properties** - All theme variables use camelCase (`--themeColor`, `--accentPrimary`, etc.) set exclusively by `applyTheme()` — no kebab-case aliases

### 🔐 **Admin Dashboard**

- **Google OAuth Authentication** - Secure admin access with NextAuth.js
- **Protected Routes** - Session-based route protection for admin functionality
- **Blog Administration** - Complete interface for content management with live preview
- **Knowledge Base Editor** - Real-time markdown editing with change detection
- **Performance Monitoring** - Cache statistics and embedding status dashboard
- **RAG Testing Interface** - Query testing with context visualization and relevance scoring
- **Unsplash Integration Management** - Monitor API usage and status

### 📊 **Activity & Data Integration**

- **Strava Integration** - Display latest fitness activities with OAuth token management
- **Multi-Activity Heatmap** - Calendar visualization with diagonal split squares for multi-activity days
- **Activity Stats Cards** - Hover/touch preview with detailed metrics (distance, pace, elevation)
- **Goodreads Integration** - Show currently reading books with progress tracking
- **Book Cover Previews** - Hover/touch to display book covers in footer
- **Automated Caching** - Intelligent caching with Vercel KV for optimal performance
- **Real-time Updates** - Live data feeds with configurable refresh intervals

### 📈 **Analytics & Performance**

- **Google Analytics 4** - Comprehensive event tracking across all interactions
- **Blog Post Tracking** - View counts, read completion (90% scroll), and social shares
- **Chat Analytics** - Open/close events, message counts, and session duration
- **Search & Filter Tracking** - User search queries and filter selections
- **Vercel Speed Insights** - Real-time Core Web Vitals monitoring (LCP, FID, CLS)
- **Performance Optimization** - Persistent rate limiting and adaptive caching strategies

### 🚀 **Performance & Infrastructure**

- **Next.js 15.5.10** - Latest React framework with App Router and RSC
- **React 19** - Latest React with improved performance and features
- **Vercel KV Storage** - Edge-compatible Redis for caching and data persistence
- **Image Optimization** - Next.js Image component with multiple CDN sources
- **TypeScript** - Full type safety with strict configuration and ESLint CLI
- **Responsive Design** - Mobile-first design with CSS Modules and custom properties

### 🤖 **Automated Code Review (Bug Bot)**

- **Claude-Powered PR Reviews** - Every pull request is automatically reviewed by Claude Sonnet 4.6 via GitHub Actions
- **Bug-Focused** - Reports only genuine bugs (null access, missing awaits, logic errors, security issues) — skips style and formatting
- **Iterative** - Re-runs on every push; PRs are only merged after a clean "No bugs found." result
- **Secure** - SHA validation, PR metadata sandboxed in XML tags to prevent prompt injection, `spawnSync` args array to prevent shell injection

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.0.0 or higher
- Git

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/zliibbe/zachliibbe.com.git
   cd zachliibbe.com
   ```

2. **Install dependencies:**

   ```sh
   bun install
   ```

3. **Environment Configuration:**

   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-here

   # Google OAuth (for admin access)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Vercel KV (for caching and data storage)
   KV_KV_REST_API_URL=your-kv-api-url
   KV_KV_REST_API_TOKEN=your-kv-api-token

   # Strava API (for activity data)
   STRAVA_CLIENT_ID=your-strava-client-id
   STRAVA_CLIENT_SECRET=your-strava-client-secret
   STRAVA_REFRESH_TOKEN=your-strava-refresh-token

   # Goodreads Integration
   GOODREADS_USER_ID=your-goodreads-user-id

   # Unsplash API (for blog post images)
   UNSPLASH_ACCESS_KEY=your-unsplash-access-key

   # Cron Job Security (for scheduled publishing)
   CRON_SECRET=your-cron-secret

   # Anthropic API (for RAG chat and Bug Bot PR reviews)
   ANTHROPIC_API_KEY=your-anthropic-api-key

   # OpenAI API (for knowledge base embeddings)
   OPENAI_API_KEY=your-openai-api-key

   # Optional: Google Analytics
   GOOGLE_ANALYTICS_ID=your-ga-tracking-id
   ```

4. **Start the development server:**

   ```sh
   bun run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run test` - Run Jest tests
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Generate test coverage report
- `bun run format` - Check code formatting
- `bun run format:fix` - Fix code formatting

### Development Tools

This project enforces code consistency using:

- **[Prettier](https://prettier.io/)** - Code formatting
- **[ESLint](https://eslint.org/)** - Code linting with Next.js configuration
- **[TypeScript](https://www.typescriptlang.org/)** - Type checking
- **[Jest](https://jestjs.io/)** - Unit testing with React Testing Library

## ⚙️ Tech Stack

### **Frontend**

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [React 19](https://reactjs.org/) - UI library with latest features
- [TypeScript](https://www.typescriptlang.org/) - Full type safety with strict configuration
- [CSS Modules](https://github.com/css-modules/css-modules) - Scoped styling with CSS custom properties

### **Authentication & Admin**

- [NextAuth.js](https://next-auth.js.org/) - Authentication with Google OAuth
- [Upstash Redis Adapter](https://docs.upstash.com/redis) - Session storage adapter

### **AI & Machine Learning**

- [Anthropic Claude API](https://www.anthropic.com/) - Conversational AI for chat and automated PR reviews
- [OpenAI Embeddings API](https://platform.openai.com/) - `text-embedding-3-small` for knowledge base semantic search
- [Pinecone](https://www.pinecone.io/) - Vector database (512-dimension serverless index)

### **Data & Integrations**

- [Vercel KV](https://vercel.com/storage/kv) - Edge-compatible Redis storage for caching
- [Strava API](https://developers.strava.com/) - Fitness activity data with OAuth
- [Goodreads RSS](https://www.goodreads.com/) - Reading activity via custom RSS parsing
- [Unsplash API](https://unsplash.com/developers) - Dynamic featured images for blog posts

### **Content & Utilities**

- [Fast XML Parser](https://github.com/NaturalIntelligence/fast-xml-parser) - RSS feed processing
- [Moment.js](https://momentjs.com/) - Date/time manipulation
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library
- [React Calendar Heatmap](https://github.com/kevinsqi/react-calendar-heatmap) - Activity visualization

### **Development & Testing**

- [ESLint](https://eslint.org/) - Code linting with Prettier integration
- [Prettier](https://prettier.io/) - Code formatting
- [Jest](https://jestjs.io/) - Testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing utilities

### **CI/CD & Deployment**

- [Vercel](https://vercel.com/) - Hosting and deployment platform
- [GitHub Actions](https://github.com/features/actions) - Bug Bot automated PR review workflow
- [Serverless Functions](https://vercel.com/docs/functions) - API routes and cron jobs
- [Google Analytics](https://analytics.google.com/) - Website analytics

## 📁 Project Structure

```
.github/
└── workflows/
    └── bug-bot.yml         # Claude-powered automated PR review
scripts/
└── bug-bot.ts              # Bug Bot review script
goodreads-lambda/           # Serverless function for Goodreads data scraping
src/
├── app/                    # Next.js 15 App Router
│   ├── admin/             # Admin dashboard and blog management
│   ├── api/               # API routes and serverless functions
│   ├── auth/              # Authentication pages
│   ├── blog/              # Blog pages and components
│   ├── components/        # Reusable UI components
│   ├── context/           # React context providers
│   └── styles/            # Global styles and themes
├── content/               # Blog content and data
│   ├── blog/              # Markdown blog posts
│   └── blog-data/         # JSON data files for posts
├── data/                  # Static data files
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
└── utils/                 # Helper utilities
```

## 🔧 Key Features Explained

### Blog System

- **Markdown Editor**: Built-in editor with syntax highlighting and live preview
- **Auto-saving**: Drafts automatically saved to prevent data loss
- **Scheduling**: Posts can be scheduled for future publication
- **Automated Publishing**: Cron job automatically publishes scheduled posts
- **Image Integration**: Featured images automatically sourced from Unsplash API

### Activity Tracking

- **Strava Integration**: Latest fitness activities displayed with proper OAuth handling
- **Goodreads Integration**: Currently reading books with progress tracking
- **Caching Strategy**: 5-minute cache duration for optimal performance
- **Fallback Handling**: Graceful degradation when APIs are unavailable

### Theme System

- **CSS Custom Properties**: Dynamic theming without JavaScript recompilation
- **Gradient Backgrounds**: 8 customizable gradient themes
- **camelCase Variables**: All theme variables (`--themeColor`, `--accentPrimary`, `--gradientOne`, etc.) are set exclusively in camelCase by `applyTheme()` — use camelCase throughout CSS
- **Branded Selection Highlight**: `::selection` uses `--accentPrimary` with black text; all 8 theme accent colors verified WCAG AA compliant
- **Responsive Design**: Mobile-first approach with consistent layout patterns
- **Accessibility**: WCAG compliant color contrast and keyboard navigation

### Bug Bot

- **Trigger**: Runs automatically on every PR (opened, synchronize, reopened) via `.github/workflows/bug-bot.yml`
- **Script**: `scripts/bug-bot.ts` — fetches the PR diff, calls Claude Sonnet 4.6, posts findings as a PR comment
- **Scope**: Reviews `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs`, `.css`, `.json` files; excludes lock files and generated files
- **GitHub Secret required**: `ANTHROPIC_API_KEY` must be set in repository Settings → Secrets → Actions

## 🚀 Deployment

### Vercel (Recommended)

The site is optimized for Vercel deployment:

1. **Connect your repository** to Vercel
2. **Configure environment variables** in the Vercel dashboard
3. **Deploy** - automatic deployments trigger on pushes to `main` branch

### Environment Variables for Production

Ensure all required environment variables are configured in your deployment platform:

- Authentication (NextAuth + Google OAuth)
- Database (Vercel KV)
- External APIs (Strava, Unsplash, Goodreads)
- AI APIs (Anthropic, OpenAI)
- Security tokens (CRON_SECRET)

### GitHub Actions Secret

The Bug Bot workflow requires one repository secret:

- `ANTHROPIC_API_KEY` — set in repository **Settings → Secrets and variables → Actions**

### Cron Jobs

The application includes automated blog publishing via Vercel Cron Jobs:

- **Schedule**: Configurable via `vercel.json`
- **Security**: Protected by CRON_SECRET environment variable
- **Functionality**: Automatically publishes scheduled blog posts

## 📊 API Routes

### Public APIs

- `/api/goodreads/*` - Reading activity data
- `/api/strava/*` - Fitness activity data
- `/api/feed/rss` - Blog RSS feed
- `/api/blog/posts` - Blog post listing
- `/api/chat` - RAG-powered AI chat

### Admin APIs (Protected)

- `/api/admin/blog/*` - Blog management operations
- `/api/admin/cron/*` - Scheduled publishing endpoints
- `/api/blog/schedule` - Post scheduling
- `/api/blog/publish` - Manual publishing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes in small, focused increments — one logical change per commit
4. Commit each change following the commit convention below (e.g. `feat(blog): add tag filtering`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request — Bug Bot will automatically review it
7. Address any bugs Bug Bot reports, then push again until it returns "No bugs found."

### Development Guidelines

- Follow the established code style (Prettier/ESLint)
- Write tests for new functionality
- Update documentation as needed
- Test admin functionality with proper authentication
- Ensure mobile responsiveness for new features

## 📋 Commit Convention

This project uses conventional commits. Each commit message follows the format:

```
<type>(<scope>): <description>
```

No emojis in commit titles. No `Co-Authored-By` lines.

### Core Commit Types

| Type       | Description              | Example                                              |
| ---------- | ------------------------ | ---------------------------------------------------- |
| `feat`     | New features             | `feat(auth): add JWT token validation middleware`    |
| `fix`      | Bug fixes                | `fix(api): resolve race condition in user lookup`    |
| `docs`     | Documentation changes    | `docs: update README with installation steps`        |
| `style`    | Code style/formatting    | `style(css): improve button hover animations`        |
| `refactor` | Code restructuring       | `refactor(utils): simplify error handling logic`     |
| `perf`     | Performance improvements | `perf(api): optimize database query caching`         |
| `test`     | Adding/fixing tests      | `test(auth): add unit tests for login validation`    |
| `chore`    | Tooling/configuration    | `chore: update ESLint configuration`                 |
| `ci`       | CI/CD changes            | `ci: add Claude-powered Bug Bot workflow`            |

### Scope Examples

Common scopes used in this project:

- `auth` - Authentication and authorization
- `blog` - Blog system functionality
- `api` - API routes and endpoints
- `ui` - User interface components
- `admin` - Admin dashboard features
- `strava` - Strava integration
- `theme` - Theme system and styling
- `build` - Build system and configuration
- `deps` - Dependencies and packages
- `ci` - CI/CD and GitHub Actions

### Atomic Commits

We follow atomic commit principles:

- **One logical change per commit** - Each commit addresses a single concern
- **Self-contained** - Commits can be cherry-picked or reverted independently
- **Descriptive** - Clear commit messages explain what and why
- **Tested** - Code is linted and tested before committing

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ by [Zach Liibbe](https://zachliibbe.com) using Next.js, TypeScript, and modern web technologies.
