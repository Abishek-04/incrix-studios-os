/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['bull', 'ioredis'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
