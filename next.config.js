/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images-na.ssl-images-amazon.com",
      "images.gr-assets.com",
      "i.gr-assets.com",
      "images-us.ssl-images-amazon.com",
      "images-eu.ssl-images-amazon.com",
      "s.gr-assets.com",
      "covers.openlibrary.org",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.gr-assets.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GOODREADS_GETREADBOOKS_URL_LOCAL: "http://localhost:3003/getReadBooks",
    GOODREADS_GETAUDIOBOOKS_URL_LOCAL: "http://localhost:3003/getAudiobooks",
    GOODREADS_GETCURRENTLYREADING_URL_LOCAL:
      "http://localhost:3003/getCurrentlyReading",
    NEXT_PUBLIC_USE_LOCAL_LAMBDA: "true",
  },
  assetPrefix: process.env.NODE_ENV === "production" ? "/" : "",
};

module.exports = nextConfig;
