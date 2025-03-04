# Zach Liibbe's Personal Website

This is a [Next.js](https://nextjs.org/) (v13) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). The site is deployed on Vercel at [zachliibbe.com](https://www.zachliibbe.com/).

## Features

- **Customizable Gradient Background**
  - Users can personalize the background gradient via a preferences menu. The selected gradient is saved in local storage.
- **Dark Mode Support**
  - Coming soon! (Currently a work in progress.) A dark mode option is available, with the user's preference stored in local storage for a persistent experience.
- **Gradient Animation Toggle**
  - Users can enable or disable the background gradient animation, with their choice saved in local storage.
- **Local Storage Persistence**
  - User preferences (gradient selection, dark mode, animation toggle) are stored in local storage to ensure settings persist across sessions.
- **Next.js Optimization**
  - The site benefits from automatic static optimization, server-side rendering (SSR), and dynamic imports for improved performance.
- **Modern Styling**
  - Built with responsive and accessible UI patterns, ensuring compatibility across various devices and screen sizes.
- **Fast Deployment**
  - Hosted on Vercel with automatic deployments from GitHub, allowing for seamless updates and CI/CD integration.

## Development Setup

### Code Linting and Formatting

This project enforces code consistency using:

- [Prettier](https://prettier.io/docs/en/index.html) for code formatting
- [ESLint](https://eslint.org/docs/latest/) for linting
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) to avoid conflicts
- [Husky](https://typicode.github.io/husky/) for Git hooks
- [lint-staged](https://github.com/okonet/lint-staged) to run linting and formatting only on staged files

## Running Locally

1. Clone the repository:

   ```sh
   git clone https://github.com/zliibbe/zachliibbe.com.git
   cd zachliibbe.com
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

## Deployment

The site is continuously deployed on Vercel. Any changes pushed to the `main` branch trigger an automatic deployment.
