/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["goodreads.com"], // Add any external image domains you need
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
};

module.exports = nextConfig;
