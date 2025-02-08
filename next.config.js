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
  kv: {
    database: true,
  },
};

module.exports = nextConfig;
