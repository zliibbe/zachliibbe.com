# Zach Liibbe's Personal Website

A modern [Next.js](https://nextjs.org/) 15 portfolio website with integrated blog system, activity tracking, and admin dashboard. Built with the App Router and deployed on Vercel at [zachliibbe.com](https://www.zachliibbe.com/).

## Features

### 🎨 **Customizable Theme System**

- **Dynamic Gradient Backgrounds** - Choose from multiple gradient options with customizable colors
- **Dark/Light Mode Toggle** - Automatic system preference detection with manual override
- **Animation Controls** - Enable/disable gradient animations based on user preference
- **Persistent Settings** - All preferences saved to localStorage for consistent experience

### 📝 **Blog Management System**

- **Full Blog CMS** - Create, edit, and manage blog posts with markdown editor
- **Post Scheduling** - Schedule posts for future publication with automated publishing via cron jobs
- **Draft Management** - Save drafts with auto-save functionality
- **Rich Content** - Support for categories, tags, series, and featured images from Unsplash
- **RSS Feed** - Automatically generated RSS feed for blog content

### 🔐 **Admin Dashboard**

- **Google OAuth Authentication** - Secure admin access with NextAuth.js
- **Protected Routes** - Session-based route protection for admin functionality
- **Blog Administration** - Complete interface for content management
- **Unsplash Integration Management** - Monitor API usage and status

### 📊 **Activity & Data Integration**

- **Strava Integration** - Display latest fitness activities with OAuth token management
- **Goodreads Integration** - Show currently reading books and reading progress
- **Automated Caching** - Intelligent caching with Vercel KV for optimal performance
- **Real-time Updates** - Live data feeds with configurable refresh intervals

### 🚀 **Performance & Infrastructure**

- **Next.js 15 App Router** - Modern React architecture with server-side rendering
- **Vercel KV Storage** - Edge-compatible caching and data persistence
- **Image Optimization** - Next.js Image component with multiple CDN sources
- **TypeScript** - Full type safety with strict configuration
- **Responsive Design** - Mobile-first design with CSS Modules

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/zliibbe/zachliibbe.com.git
   cd zachliibbe.com
   ```

2. **Install dependencies:**

   ```sh
   npm install
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

   # Optional: Google Analytics
   GOOGLE_ANALYTICS_ID=your-ga-tracking-id
   ```

4. **Start the development server:**

   ```sh
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run format` - Check code formatting
- `npm run format:fix` - Fix code formatting

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

### **Deployment & Infrastructure**

- [Vercel](https://vercel.com/) - Hosting and deployment platform
- [Serverless Functions](https://vercel.com/docs/functions) - API routes and cron jobs
- [Google Analytics](https://analytics.google.com/) - Website analytics

## 📁 Project Structure

```
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
- **Gradient Backgrounds**: Multiple customizable gradient options
- **Responsive Design**: Mobile-first approach with consistent layout patterns
- **Accessibility**: WCAG compliant color contrast and keyboard navigation

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
- Security tokens (CRON_SECRET)

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

### Admin APIs (Protected)

- `/api/admin/blog/*` - Blog management operations
- `/api/admin/cron/*` - Scheduled publishing endpoints
- `/api/blog/schedule` - Post scheduling
- `/api/blog/publish` - Manual publishing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the established code style (Prettier/ESLint)
- Write tests for new functionality
- Update documentation as needed
- Test admin functionality with proper authentication
- Ensure mobile responsiveness for new features

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ by [Zach Liibbe](https://zachliibbe.com) using Next.js, TypeScript, and modern web technologies.
