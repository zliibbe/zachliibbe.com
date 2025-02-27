/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images-na.ssl-images-amazon.com",
      "images.gr-assets.com",
      "i.gr-assets.com",
      "images-us.ssl-images-amazon.com",
      "images-eu.ssl-images-amazon.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.gr-assets.com",
        pathname: "/images/**",
      },
    ],
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
