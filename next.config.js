/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["goodreads.com"], // Add any external image domains you need
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  experimental: {
    serverActions: true,
  },
  env: {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  assetPrefix: process.env.NODE_ENV === "production" ? "/" : "",
};

module.exports = nextConfig;
