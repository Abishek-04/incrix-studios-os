/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // MongoDB connection timeout
  serverRuntimeConfig: {
    maxDuration: 10,
  },
};

module.exports = nextConfig;
