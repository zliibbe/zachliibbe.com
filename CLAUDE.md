# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Principles

Follow the coding commandments located at `~/.claude/commandments.md` for all development work. Key principles include:

- Start with tests (TDD approach)
- Keep classes and methods single-responsibility
- Favor command pattern and service objects
- Keep logic out of views and controllers
- Follow YAGNI principles

## Development Commands

- **Development server**: `npm run dev` - Starts Next.js development server on localhost:3000
- **Build**: `npm run build` - Creates production build
- **Linting**: `npm run lint` - Runs ESLint with Next.js config
- **Formatting**: `npm run format` - Checks code formatting with Prettier
- **Format fix**: `npm run format:fix` - Auto-fixes formatting issues

## Architecture Overview

This is a Next.js 13 portfolio website with the following key characteristics:

### Core Architecture

- **Framework**: Next.js 13 with App Router (`src/app/` directory structure)
- **TypeScript**: Strict TypeScript configuration with custom path mapping (`@/*` → `./src/*`)
- **Styling**: CSS Modules with CSS custom properties for theming
- **State Management**: React Context for theme management (dark/light mode, gradient preferences)

### Key Features

- **Theme System**: Dynamic gradient backgrounds with customizable colors, dark/light mode toggle, and animation controls
- **Data Sources**: Integration with Goodreads (via serverless lambda) and Strava APIs for displaying reading activity and fitness data
- **Caching**: Vercel KV store for API response caching and token management
- **Image Optimization**: Next.js Image component with multiple remote domains configured

### Project Structure

- `src/app/` - Next.js 13 app router pages and components
- `src/lib/` - Shared utilities (KV store, Strava API, etc.)
- `src/types/` - TypeScript type definitions
- `goodreads-lambda/` - Separate serverless function for Goodreads data scraping
- `public/` - Static assets including favicons and company logos

### External Integrations

- **Vercel KV**: Redis-compatible key-value store for caching
- **Strava API**: Fitness activity data with OAuth token refresh
- **Goodreads**: Custom serverless scraper using Playwright
- **Vercel**: Deployment platform with automatic CI/CD from main branch

### Development Notes

- Uses Husky for git hooks with lint-staged for pre-commit formatting
- Local storage persistence for user preferences (theme, animation, dark mode)
- Responsive design with CSS custom properties for consistent theming
- Environment variables required for Strava and KV store functionality
