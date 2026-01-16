/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    // Skip TypeScript checking during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint checking during build (optional)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
