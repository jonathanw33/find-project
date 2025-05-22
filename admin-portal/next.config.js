/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'xsgames.co', 'i.pravatar.cc'],
  },
  typescript: {
    // Skip TypeScript checking during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig