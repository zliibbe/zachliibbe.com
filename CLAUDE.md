# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

### Version Control & Branching

- **Versioning**: Track changes using version in `package.json` following SemVer (Semantic Versioning)
- **Branching**: Always create a separate, well-named branch when starting new work
- **Branch Naming**: Use descriptive names like `feature/blog-system`, `fix/auth-session`, `enhance/chat-widget`

### Development Commands

- **Development server**: `npm run dev` - Starts Next.js development server on localhost:3000
- **Build**: `npm run build` - Creates production build
- **Linting**: `npm run lint` - Runs ESLint with Next.js config
- **Formatting**: `npm run format` - Checks code formatting with Prettier
- **Format fix**: `npm run format:fix` - Auto-fixes formatting issues
- **Testing**: `npm test` - Run Jest test suite

## Coding Principles

Follow the coding commandments located at `~/.claude/commandments.md` for all development work. Key principles include:

- **Start with tests** (TDD approach)
- **Keep it short**: Single-responsibility classes and methods
- **Respect Law of Demeter**: Clear object boundaries, avoid method chaining
- **No meta programming**: Explicit, maintainable solutions
- **Favor command pattern and service objects** for complex logic
- **Keep logic out of views and controllers**
- **Prefer logs to comments, comments to nothing**
- **Avoid primitive obsessions**: Use higher-level objects with validation
- **YAGNI**: Build only what's currently needed

## Development Tools

- **ESLint**: Next.js configuration with Prettier integration
- **Prettier**: Code formatting with custom configuration
- **TypeScript**: Strict type safety with custom path mapping
- **Jest & React Testing Library**: Unit and integration testing
- **Vercel**: Deployment platform with automatic CI/CD

Run `npm run format:fix` after making changes to ensure Prettier and ESLint rules are follwed.

## Architecture Overview

This is a Next.js 15 portfolio website with the following key characteristics:

### Core Architecture

- **Framework**: Next.js 15 with App Router (`src/app/` directory structure)
- **TypeScript**: Strict TypeScript configuration with custom path mapping (`@/*` → `./src/*`)
- **Styling**: CSS Modules with CSS custom properties for theming
- **State Management**: React Context for theme management (dark/light mode, gradient preferences)

### Key Features

- **Theme System**: Dynamic gradient backgrounds with customizable colors, dark/light mode toggle, and animation controls
- **Data Sources**: Integration with Goodreads (via serverless lambda) and Strava APIs for displaying reading activity and fitness data
- **Caching**: Vercel KV store for API response caching and token management
- **Image Optimization**: Next.js Image component with multiple remote domains configured

### Project Structure

- `src/app/` - Next.js 15 app router pages and components
- `src/lib/` - Shared utilities (KV store, Strava API, etc.)
- `src/types/` - TypeScript type definitions
- `goodreads-lambda/` - Separate serverless function for Goodreads data scraping
- `public/` - Static assets including favicons and company logos

### External Integrations

- **Vercel KV**: Redis-compatible key-value store for caching (5-minute cache duration)
- **Strava API**: Fitness activity data with OAuth token refresh
- **Goodreads**: Custom RSS feed integration with reading progress tracking
- **Vercel**: Deployment platform with automatic CI/CD from main branch

### Development Notes

- Local storage persistence for user preferences (theme, animation, dark mode)
- Responsive design with CSS custom properties for consistent theming
- Environment variables required for Strava and KV store functionality
- Coordinated caching strategy: 5-minute cache duration for both Vercel KV and Next.js fetch cache

### Layout System (Added 2025-08-24)

- **Standardized Structure**: All pages follow `container > contentWrapper > content` pattern
- **Responsive Breakpoints**: Unified breakpoints at 768px, 769px, and 1025px across all pages
- **Sticky Footer**: Flexbox-based layout ensures footer stays at bottom
- **Semantic HTML**: Proper `<main>` elements for accessibility compliance
- **Theme Integration**: CSS variables work consistently across all layouts

### Recent Enhancements (2025-08-24)

- About page redesigned with personal updates and recent activities sidebar
- Work page simplified with centered overview and contract status indicators
- Contact page completely redesigned with consistent layout system
- SEO metadata enhanced across multiple pages for better discoverability
- Browser compatibility improved with browserslist configuration

## Planned Enhancements

Refer to `PRD.md` for detailed specifications of upcoming features:

### Phase 1: Authentication & Admin Setup

- Google OAuth integration with NextAuth.js
- Admin dashboard for blog management
- User session management with Vercel KV storage

### Phase 2: Blog System

- Markdown editor with live preview
- Post scheduling and automated publishing
- Categories: "Development", "Personal", "Learning", "Projects"

### Phase 3: RAG-Powered Chat

- Pinecone vector database integration
- Anthropic Claude API for responses
- Knowledge base from `/src/data/knowledge/` markdown files
- Floating chat widget (bottom-right corner)
